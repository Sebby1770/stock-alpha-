/**
 * Pairwise Pearson correlation of daily returns from aligned mock histories.
 */

import { alignPriceHistories } from './backtest.js';

/**
 * Simple returns from a price series: p_t / p_{t-1} - 1.
 */
export function dailyReturns(prices) {
  if (!Array.isArray(prices) || prices.length < 2) return [];
  const out = [];
  for (let i = 1; i < prices.length; i += 1) {
    const prev = Number(prices[i - 1]);
    const px = Number(prices[i]);
    if (!Number.isFinite(prev) || !Number.isFinite(px) || prev <= 0) {
      out.push(0);
    } else {
      out.push(px / prev - 1);
    }
  }
  return out;
}

/**
 * Pearson correlation of two numeric series (inner length).
 * Returns NaN when either series has zero variance or too few points.
 */
export function pearson(xs, ys) {
  if (!Array.isArray(xs) || !Array.isArray(ys)) return NaN;
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return NaN;

  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i += 1) {
    const x = Number(xs[i]);
    const y = Number(ys[i]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return NaN;
    sx += x;
    sy += y;
  }
  const mx = sx / n;
  const my = sy / n;

  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i += 1) {
    const a = Number(xs[i]) - mx;
    const b = Number(ys[i]) - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  if (!(den > 0)) return NaN;
  const r = num / den;
  if (!Number.isFinite(r)) return NaN;
  return Math.max(-1, Math.min(1, r));
}

/**
 * Pairwise correlation matrix of daily returns.
 * @returns {{ tickers: string[], matrix: number[][], dates: string[] }}
 */
export function correlationMatrix(stocks) {
  const list = Array.isArray(stocks) ? stocks : [];
  const tickers = list.map((s) => String(s?.ticker ?? ''));
  const { dates, series } = alignPriceHistories(list);
  const n = series.length;
  const returns = series.map(dailyReturns);
  const matrix = [];

  for (let i = 0; i < n; i += 1) {
    const row = [];
    for (let j = 0; j < n; j += 1) {
      if (i === j && returns[i]?.length >= 2) {
        const r = pearson(returns[i], returns[i]);
        row.push(Number.isFinite(r) ? r : 1);
      } else {
        row.push(pearson(returns[i], returns[j]));
      }
    }
    matrix.push(row);
  }

  return { tickers, matrix, dates };
}
