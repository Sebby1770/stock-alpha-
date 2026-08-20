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

function finiteSeries(returns) {
  if (!Array.isArray(returns)) return [];
  return returns.map(Number).filter((n) => Number.isFinite(n));
}

function alignFinite(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return [[], []];
  const n = Math.min(a.length, b.length);
  const xs = [];
  const ys = [];
  for (let i = 0; i < n; i += 1) {
    const x = Number(a[i]);
    const y = Number(b[i]);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      xs.push(x);
      ys.push(y);
    }
  }
  return [xs, ys];
}

/**
 * Sample stdev of min(r − mar, 0). Zero with fewer than 2 returns.
 */
export function downsideDeviation(returns, mar = 0) {
  const xs = finiteSeries(returns);
  if (xs.length < 2) return 0;
  const hurdle = Number.isFinite(Number(mar)) ? Number(mar) : 0;
  const downs = xs.map((r) => Math.min(r - hurdle, 0));
  return volatility(downs);
}

/**
 * Annualized Sortino: (mean − rf/periods) / downsideDeviation × √periods.
 */
export function sortino(returns, { rf = 0, periods = 252, mar = 0 } = {}) {
  const xs = finiteSeries(returns);
  if (xs.length < 2) return 0;
  const dd = downsideDeviation(xs, mar);
  if (dd === 0) return 0;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const per = Number(periods) > 0 ? Number(periods) : 252;
  const excess = mean - Number(rf) / per;
  const value = (excess / dd) * Math.sqrt(per);
  return Number.isFinite(value) ? value : 0;
}

/**
 * Calmar: annualized return / max drawdown.
 * Ann. return is (last/first)^(periods/(length−1)) − 1.
 */
export function calmar(equityCurve, { periods = 252 } = {}) {
  const xs = toValues(equityCurve);
  if (xs.length < 2) return 0;
  const dd = maxDrawdown(xs);
  if (!(dd > 0)) return 0;
  const first = xs[0];
  const last = xs[xs.length - 1];
  if (!(first > 0)) return 0;
  const n = xs.length - 1;
  const per = Number(periods) > 0 ? Number(periods) : 252;
  const ann = (last / first) ** (per / n) - 1;
  if (!Number.isFinite(ann)) return 0;
  const value = ann / dd;
  return Number.isFinite(value) ? value : 0;
}

/**
 * OLS beta vs a benchmark (cov / var of the aligned inner series).
 */
export function beta(assetReturns, benchmarkReturns) {
  const [xs, ys] = alignFinite(assetReturns, benchmarkReturns);
  if (xs.length < 2) return 0;
  const n = xs.length;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i += 1) {
    sx += xs[i];
    sy += ys[i];
  }
  const mx = sx / n;
  const my = sy / n;
  let cov = 0;
  let varY = 0;
  for (let i = 0; i < n; i += 1) {
    const dy = ys[i] - my;
    cov += (xs[i] - mx) * dy;
    varY += dy * dy;
  }
  if (varY === 0) return 0;
  const value = cov / varY;
  return Number.isFinite(value) ? value : 0;
}

/**
 * Annualized tracking error: sample stdev of (asset − bench) × √periods.
 */
export function trackingError(assetReturns, benchmarkReturns, { periods = 252 } = {}) {
  const [xs, ys] = alignFinite(assetReturns, benchmarkReturns);
  if (xs.length < 2) return 0;
  const diffs = xs.map((x, i) => x - ys[i]);
  const per = Number(periods) > 0 ? Number(periods) : 252;
  const te = volatility(diffs) * Math.sqrt(per);
  return Number.isFinite(te) ? te : 0;
}

/**
 * Annualized information ratio: mean(asset − bench) / stdev(asset − bench) × √periods.
 */
export function informationRatio(assetReturns, benchmarkReturns, { periods = 252 } = {}) {
  const [xs, ys] = alignFinite(assetReturns, benchmarkReturns);
  if (xs.length < 2) return 0;
  const diffs = xs.map((x, i) => x - ys[i]);
  const vol = volatility(diffs);
  if (vol === 0) return 0;
  const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const per = Number(periods) > 0 ? Number(periods) : 252;
  const value = (mean / vol) * Math.sqrt(per);
  return Number.isFinite(value) ? value : 0;
}

function monthKey(date) {
  if (date instanceof Date && Number.isFinite(date.getTime())) {
    return date.toISOString().slice(0, 7);
  }
  const s = String(date ?? '');
  if (/^\d{4}-\d{2}/.test(s)) return s.slice(0, 7);
  const d = new Date(s);
  if (Number.isFinite(d.getTime())) return d.toISOString().slice(0, 7);
  return '';
}

/**
 * Month-by-month simple returns from `{ date, value }` or `{ date, price }` points.
 * Numeric series have no calendar, so the result is empty.
 * Months with fewer than 2 points are skipped.
 */
export function monthlyReturns(equityCurve) {
  if (!Array.isArray(equityCurve) || equityCurve.length === 0) return [];
  const probe = equityCurve.find((pt) => pt != null);
  if (typeof probe === 'number') return [];

  const groups = new Map();
  for (const pt of equityCurve) {
    if (!pt || typeof pt !== 'object' || pt.date == null) continue;
    const month = monthKey(pt.date);
    if (!month) continue;
    const raw = pt.value != null ? pt.value : pt.price;
    const val = Number(raw);
    if (!Number.isFinite(val)) continue;
    const bucket = groups.get(month);
    if (bucket) bucket.push(val);
    else groups.set(month, [val]);
  }

  const out = [];
  for (const [month, xs] of groups) {
    if (xs.length < 2) continue;
    const first = xs[0];
    const last = xs[xs.length - 1];
    if (first === 0) continue;
    const ret = last / first - 1;
    if (!Number.isFinite(ret)) continue;
    out.push({ month, ret });
  }
  return out;
}
