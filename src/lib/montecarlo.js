/**
 * Bootstrap Monte Carlo on a daily-return series (mock data).
 */

import { alignPriceHistories } from './backtest.js';
import { dailyReturns } from './correlation.js';

function percentile(sorted, p) {
  const n = sorted.length;
  if (!n) return NaN;
  if (n === 1) return sorted[0];
  const idx = (n - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/**
 * Equal-weight average of aligned daily simple returns across a stock universe.
 */
export function equalWeightDailyReturns(stocks) {
  const list = Array.isArray(stocks) ? stocks : [];
  const { series } = alignPriceHistories(list);
  if (!series.length) return [];
  const rets = series.map(dailyReturns);
  const n = Math.min(...rets.map((r) => r.length));
  if (!Number.isFinite(n) || n <= 0) return [];
  const out = [];
  for (let t = 0; t < n; t += 1) {
    let s = 0;
    let c = 0;
    for (const r of rets) {
      const v = Number(r[t]);
      if (!Number.isFinite(v)) continue;
      s += v;
      c += 1;
    }
    out.push(c ? s / c : 0);
  }
  return out;
}

/**
 * Bootstrap daily returns with replacement.
 * @returns {{ paths: number[][], p5: number[], p50: number[], p95: number[] }}
 */
export function simulatePaths({
  returns,
  paths = 200,
  horizon = 63,
  start = 100000,
  rng = Math.random,
} = {}) {
  const pool = Array.isArray(returns)
    ? returns.map(Number).filter((r) => Number.isFinite(r))
    : [];
  const nPaths = Math.max(1, Math.floor(Number(paths) || 0));
  const steps = Math.max(0, Math.floor(Number(horizon) || 0));
  const startVal = Number.isFinite(Number(start)) ? Number(start) : 0;
  const pick = () => {
    if (!pool.length) return 0;
    const i = Math.floor(rng() * pool.length) % pool.length;
    return pool[i];
  };

  const pathRows = [];
  for (let p = 0; p < nPaths; p += 1) {
    const row = new Array(steps + 1);
    row[0] = startVal;
    let v = startVal;
    for (let t = 1; t <= steps; t += 1) {
      v *= 1 + pick();
      row[t] = v;
    }
    pathRows.push(row);
  }

  const p5 = new Array(steps + 1);
  const p50 = new Array(steps + 1);
  const p95 = new Array(steps + 1);
  for (let t = 0; t <= steps; t += 1) {
    const col = pathRows.map((row) => row[t]).sort((a, b) => a - b);
    p5[t] = percentile(col, 0.05);
    p50[t] = percentile(col, 0.5);
    p95[t] = percentile(col, 0.95);
  }

  return { paths: pathRows, p5, p50, p95 };
}
