/**
 * Factor attribution: value-weighted holdings vs equal-weight universe.
 */

import { FACTOR_KEYS } from './quant.js';

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function emptyFactors() {
  return Object.fromEntries(FACTOR_KEYS.map((k) => [k, 0]));
}

function roundFactors(obj) {
  const out = emptyFactors();
  for (const k of FACTOR_KEYS) {
    const v = Number(obj?.[k]);
    out[k] = Number.isFinite(v) ? round2(v) : 0;
  }
  return out;
}

/**
 * Equal-weight mean of factor scores across the universe.
 */
function equalWeightFactors(universe) {
  const acc = emptyFactors();
  let n = 0;
  for (const stock of universe) {
    const f = stock?.factors;
    if (!f) continue;
    n += 1;
    for (const k of FACTOR_KEYS) {
      const v = Number(f[k]);
      if (Number.isFinite(v)) acc[k] += v;
    }
  }
  if (n === 0) return acc;
  for (const k of FACTOR_KEYS) acc[k] /= n;
  return acc;
}

/**
 * Value-weighted average factor scores of holdings vs equal-weight universe.
 *
 * @param {Array<{ ticker: string, shares: number, stock?: object }>} holdings
 * @param {Array} universe - stock objects with `factors` and `ticker`
 * @param {(ticker: string) => number} [priceOf]
 * @returns {{ portfolio: object, universe: object, delta: object }}
 */
export function factorAttribution(holdings, universe, priceOf) {
  const uni = Array.isArray(universe) ? universe : [];
  const lots = Array.isArray(holdings) ? holdings : [];
  const byTicker = new Map(
    uni.map((s) => [String(s?.ticker ?? '').toUpperCase(), s]),
  );

  const universeAvg = roundFactors(equalWeightFactors(uni));
  const acc = emptyFactors();
  let totalMv = 0;

  for (const h of lots) {
    const ticker = String(h?.ticker ?? '').toUpperCase();
    const stock = h?.stock || byTicker.get(ticker);
    if (!stock?.factors) continue;
    const sh = Number(h.shares);
    const px = typeof priceOf === 'function'
      ? Number(priceOf(ticker))
      : Number(stock.price);
    if (!Number.isFinite(sh) || sh <= 0 || !Number.isFinite(px) || px <= 0) continue;
    const mv = sh * px;
    totalMv += mv;
    for (const k of FACTOR_KEYS) {
      const v = Number(stock.factors[k]);
      if (Number.isFinite(v)) acc[k] += mv * v;
    }
  }

  if (totalMv > 0) {
    for (const k of FACTOR_KEYS) acc[k] /= totalMv;
  }

  const portfolio = roundFactors(acc);
  const delta = emptyFactors();
  for (const k of FACTOR_KEYS) {
    delta[k] = round2(portfolio[k] - universeAvg[k]);
  }

  return { portfolio, universe: universeAvg, delta };
}
