/**
 * Tax-loss harvest candidates on paper lots (mock marks).
 */

function lookupPrice(priceOf, ticker) {
  if (typeof priceOf === 'function') return Number(priceOf(ticker));
  if (priceOf && typeof priceOf === 'object') {
    return Number(priceOf[ticker] ?? priceOf[String(ticker).toUpperCase()]);
  }
  return NaN;
}

/**
 * Lots whose unrealized loss meets both a dollar floor and a percent floor.
 *
 * @param {Array<{ ticker: string, shares: number, entryPrice: number }>} holdings
 * @param {(ticker: string) => number | Record<string, number>} priceOf
 * @returns {Array<{ ticker: string, shares: number, entryPrice: number, price: number, loss: number, lossPct: number }>}
 */
export function harvestCandidates(holdings, priceOf, { minLoss = 0, minLossPct = 0.05 } = {}) {
  const list = Array.isArray(holdings) ? holdings : [];
  const minL = Number.isFinite(Number(minLoss)) ? Number(minLoss) : 0;
  const minP = Number.isFinite(Number(minLossPct)) ? Number(minLossPct) : 0.05;
  const out = [];

  for (const h of list) {
    const ticker = String(h?.ticker ?? '');
    const shares = Number(h?.shares);
    const entryPrice = Number(h?.entryPrice);
    const price = lookupPrice(priceOf, ticker);
    if (!ticker) continue;
    if (!Number.isFinite(shares) || shares <= 0) continue;
    if (!Number.isFinite(entryPrice) || entryPrice <= 0) continue;
    if (!Number.isFinite(price)) continue;
    const loss = (entryPrice - price) * shares;
    const lossPct = (entryPrice - price) / entryPrice;
    if (loss >= minL && lossPct >= minP) {
      out.push({ ticker, shares, entryPrice, price, loss, lossPct });
    }
  }

  out.sort((a, b) => b.loss - a.loss || a.ticker.localeCompare(b.ticker));
  return out;
}
