/**
 * Pure risk metrics. No I/O, no React.
 */

function toValues(equityCurve) {
  if (!Array.isArray(equityCurve) || equityCurve.length === 0) return [];
  return equityCurve.map((pt) => {
    if (typeof pt === 'number') return pt;
    if (pt && typeof pt === 'object') return Number(pt.value);
    return NaN;
  }).filter((n) => Number.isFinite(n));
}

/**
 * Peak-to-trough max drawdown as a fraction in [0, 1].
 * Accepts numbers or `{ value }` points.
 */
export function maxDrawdown(equityCurve) {
  const xs = toValues(equityCurve);
  if (xs.length === 0) return 0;
  let peak = xs[0];
  let maxDd = 0;
  for (const v of xs) {
    if (v > peak) peak = v;
    if (peak > 0) {
      const dd = (peak - v) / peak;
      if (dd > maxDd) maxDd = dd;
    }
  }
  return maxDd;
}

/**
 * Sample standard deviation of a return series.
 */
export function volatility(returns) {
  if (!Array.isArray(returns)) return 0;
  const xs = returns.map(Number).filter((n) => Number.isFinite(n));
  if (xs.length < 2) return 0;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  let ss = 0;
  for (const x of xs) ss += (x - mean) ** 2;
  return Math.sqrt(ss / (xs.length - 1));
}

/**
 * Annualized Sharpe ratio.
 * `rf` is the annual risk-free rate; converted to per-period via `periods`.
 */
export function sharpe(returns, { rf = 0, periods = 252 } = {}) {
  if (!Array.isArray(returns)) return 0;
  const xs = returns.map(Number).filter((n) => Number.isFinite(n));
  if (xs.length < 2) return 0;
  const vol = volatility(xs);
  if (vol === 0) return 0;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const per = Number(periods) > 0 ? Number(periods) : 252;
  const excess = mean - Number(rf) / per;
  const value = (excess / vol) * Math.sqrt(per);
  return Number.isFinite(value) ? value : 0;
}

/**
 * Herfindahl-Hirschman index: sum of squared weights (0–1 if weights are fractions).
 */
export function herfindahl(weights) {
  if (!Array.isArray(weights) || weights.length === 0) return 0;
  return weights.reduce((sum, w) => {
    const n = Number(w);
    return Number.isFinite(n) ? sum + n * n : sum;
  }, 0);
}

/**
 * Daily simple returns from an equity curve (`{ value }` or numbers).
 */
export function equityReturns(curve) {
  const xs = toValues(curve);
  if (xs.length < 2) return [];
  const out = [];
  for (let i = 1; i < xs.length; i += 1) {
    const prev = xs[i - 1];
    out.push(prev === 0 ? 0 : (xs[i] - prev) / prev);
  }
  return out;
}
