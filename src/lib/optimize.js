/**
 * Inverse-vol / min-variance weights and a mock efficient frontier.
 * Pure numerics — educational, not advice.
 */

import { alignPriceHistories } from './backtest.js';
import { dailyReturns } from './correlation.js';
import { volatility } from './risk.js';

function equalWeights(n) {
  if (n <= 0) return [];
  return Array(n).fill(1 / n);
}

/**
 * Gaussian elimination with partial pivoting. Returns null if singular.
 */
function solveLinear(Ain, bin) {
  const n = Ain.length;
  if (n === 0) return [];
  if (!Array.isArray(bin) || bin.length !== n) return null;

  const M = Ain.map((row, i) => {
    const r = row.map(Number);
    r.push(Number(bin[i]));
    return r;
  });

  for (let k = 0; k < n; k += 1) {
    let piv = k;
    let best = Math.abs(M[k][k]);
    for (let i = k + 1; i < n; i += 1) {
      const v = Math.abs(M[i][k]);
      if (v > best) {
        best = v;
        piv = i;
      }
    }
    if (!(best > 1e-14)) return null;
    if (piv !== k) {
      const tmp = M[k];
      M[k] = M[piv];
      M[piv] = tmp;
    }
    const diag = M[k][k];
    for (let i = k + 1; i < n; i += 1) {
      const f = M[i][k] / diag;
      if (f === 0) continue;
      for (let j = k; j <= n; j += 1) {
        M[i][j] -= f * M[k][j];
      }
    }
  }

  const x = new Array(n);
  for (let i = n - 1; i >= 0; i -= 1) {
    let s = M[i][n];
    for (let j = i + 1; j < n; j += 1) s -= M[i][j] * x[j];
    const d = M[i][i];
    if (!(Math.abs(d) > 1e-14) || !Number.isFinite(s / d)) return null;
    x[i] = s / d;
  }
  return x;
}

function seriesMeans(matrix, T) {
  return matrix.map((row) => {
    if (!(T > 0)) return 0;
    let s = 0;
    for (let t = 0; t < T; t += 1) {
      const v = Number(row[t]);
      s += Number.isFinite(v) ? v : 0;
    }
    return s / T;
  });
}

function innerT(matrix) {
  if (!Array.isArray(matrix) || matrix.length === 0) return 0;
  const lengths = matrix.map((r) => (Array.isArray(r) ? r.length : 0));
  const T = Math.min(...lengths);
  return Number.isFinite(T) && T > 0 ? T : 0;
}

function normalize(weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!Number.isFinite(sum) || sum === 0) return null;
  return weights.map((w) => w / sum);
}

function portStats(C, mu, weights) {
  const n = weights.length;
  let varp = 0;
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      varp += weights[i] * (C[i]?.[j] ?? 0) * weights[j];
    }
  }
  const risk = Number.isFinite(varp) && varp > 0 ? Math.sqrt(varp) : 0;
  let ret = 0;
  for (let i = 0; i < n; i += 1) ret += weights[i] * (mu[i] ?? 0);
  return {
    risk: Number.isFinite(risk) ? risk : 0,
    ret: Number.isFinite(ret) ? ret : 0,
    weights,
  };
}

/**
 * Min-variance weights s.t. 1ᵀw = 1 and μᵀw = target (KKT, two extra equations).
 */
function minVarAtReturn(C, mu, target) {
  const n = C.length;
  const N = n + 2;
  const A = Array.from({ length: N }, () => Array(N).fill(0));
  const b = Array(N).fill(0);
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) A[i][j] = C[i][j];
    A[i][n] = 1;
    A[i][n + 1] = mu[i];
    A[n][i] = 1;
    A[n + 1][i] = mu[i];
  }
  b[n] = 1;
  b[n + 1] = target;
  const x = solveLinear(A, b);
  if (!x) return null;
  return normalize(x.slice(0, n));
}

/**
 * Aligned daily-return matrix for a stock list.
 * @returns {{ tickers: string[], matrix: number[][] }}
 */
export function returnMatrix(stocks) {
  const list = Array.isArray(stocks) ? stocks : [];
  const tickers = list.map((s, i) => {
    const t = s?.ticker;
    if (t == null || String(t).trim() === '') return String(i);
    return String(t);
  });
  const aligned = alignPriceHistories(list);
  const series = tickers.map((_, i) => aligned.series[i] ?? []);
  const matrix = series.map(dailyReturns);
  return { tickers, matrix };
}

/**
 * Sample covariance (1/(T−1)) of aligned return rows. Zeros if T < 2.
 */
export function covariance(matrix) {
  const rows = Array.isArray(matrix) ? matrix : [];
  const n = rows.length;
  if (n === 0) return [];
  const C = Array.from({ length: n }, () => Array(n).fill(0));
  const T = innerT(rows);
  if (T < 2) return C;

  const means = seriesMeans(rows, T);
  const denom = T - 1;
  for (let i = 0; i < n; i += 1) {
    for (let j = i; j < n; j += 1) {
      let ss = 0;
      for (let t = 0; t < T; t += 1) {
        const a = Number(rows[i][t]);
        const b = Number(rows[j][t]);
        const ai = Number.isFinite(a) ? a : 0;
        const bj = Number.isFinite(b) ? b : 0;
        ss += (ai - means[i]) * (bj - means[j]);
      }
      const v = ss / denom;
      C[i][j] = v;
      C[j][i] = v;
    }
  }
  return C;
}

/**
 * wᵢ ∝ 1/σᵢ, renormalized. Zero-vol names get 0; all-zero → equal weight.
 */
export function inverseVolWeights(matrix) {
  const rows = Array.isArray(matrix) ? matrix : [];
  const n = rows.length;
  if (n === 0) return [];
  const inv = rows.map((r) => {
    const vol = volatility(r);
    return vol > 0 ? 1 / vol : 0;
  });
  const sum = inv.reduce((a, b) => a + b, 0);
  if (!(sum > 0)) return equalWeights(n);
  return inv.map((x) => x / sum);
}

/**
 * Global minimum-variance weights: solve (Σ + ridge I) w = 1, then 1ᵀw = 1.
 * Shorts allowed.
 */
export function minVarianceWeights(matrix, { ridge = 1e-4 } = {}) {
  const rows = Array.isArray(matrix) ? matrix : [];
  const n = rows.length;
  if (n === 0) return [];
  if (n === 1) return [1];
  const C = covariance(rows);
  const ridgeN = Number.isFinite(Number(ridge)) ? Number(ridge) : 1e-4;
  for (let i = 0; i < n; i += 1) C[i][i] += ridgeN;
  const raw = solveLinear(C, Array(n).fill(1));
  if (!raw) return equalWeights(n);
  return normalize(raw) ?? equalWeights(n);
}

/**
 * Mean-variance frontier from min mean to max mean.
 * `risk` is daily portfolio stdev; `ret` is mean daily return.
 */
export function efficientFrontier(matrix, { points = 9, ridge = 1e-4 } = {}) {
  const rows = Array.isArray(matrix) ? matrix : [];
  const n = rows.length;
  const pts = Math.max(2, Math.floor(Number(points) || 2));
  if (n === 0) return [];

  const T = innerT(rows);
  const mu = seriesMeans(rows, T);
  const C0 = covariance(rows);
  const ridgeN = Number.isFinite(Number(ridge)) ? Number(ridge) : 1e-4;
  const C = C0.map((row, i) => row.map((v, j) => v + (i === j ? ridgeN : 0)));

  const fromWeights = (w) => portStats(C0, mu, w);

  if (n === 1 || T < 2) {
    const w = n === 1 ? [1] : minVarianceWeights(rows, { ridge: ridgeN });
    const s = fromWeights(w);
    return Array.from({ length: pts }, () => ({ ...s, weights: [...w] }));
  }

  const minMu = Math.min(...mu);
  const maxMu = Math.max(...mu);
  if (!(maxMu > minMu)) {
    const w = minVarianceWeights(rows, { ridge: ridgeN });
    const s = fromWeights(w);
    return Array.from({ length: pts }, () => ({ ...s, weights: [...w] }));
  }

  const out = [];
  for (let k = 0; k < pts; k += 1) {
    const target = minMu + (maxMu - minMu) * (k / (pts - 1));
    const w = minVarAtReturn(C, mu, target) ?? minVarianceWeights(rows, { ridge: ridgeN });
    out.push(fromWeights(w));
  }
  return out;
}
