/**
 * Per-holding P&L contribution vs portfolio total.
 */

function round4(n) {
  return Math.round(Number(n) * 10000) / 10000;
}

function lookupPrice(priceOf, ticker) {
  if (typeof priceOf === 'function') return Number(priceOf(ticker));
  if (priceOf && typeof priceOf === 'object') {
    return Number(priceOf[ticker] ?? priceOf[String(ticker).toUpperCase()]);
  }
  return NaN;
}

/**
 * @param {Array<{ ticker: string, shares: number, entryPrice: number }>} holdings
 * @param {(ticker: string) => number | Record<string, number>} priceOf
 * @returns {Array<{ ticker: string, pnl: number, weight: number, shareOfPnl: number }>}
 */
export function holdingContribution(holdings, priceOf) {
  const rows = [];
  let totalMv = 0;
  let totalPnl = 0;

  for (const h of Array.isArray(holdings) ? holdings : []) {
    const ticker = String(h?.ticker ?? '').toUpperCase();
    const shares = Number(h?.shares);
    const entry = Number(h?.entryPrice);
    const px = lookupPrice(priceOf, ticker);
    if (!ticker || !Number.isFinite(shares) || shares <= 0) continue;
    if (!Number.isFinite(px) || px <= 0) continue;
    const mv = shares * px;
    const cost = Number.isFinite(entry) && entry > 0 ? shares * entry : 0;
    const pnl = mv - cost;
    rows.push({ ticker, pnl, mv });
    totalMv += mv;
    totalPnl += pnl;
  }

  const out = rows.map((r) => ({
    ticker: r.ticker,
    pnl: Math.round(r.pnl * 100) / 100,
    weight: totalMv > 0 ? round4(r.mv / totalMv) : 0,
    shareOfPnl: totalPnl !== 0 ? round4(r.pnl / totalPnl) : 0,
  }));

  out.sort((a, b) => b.pnl - a.pnl || a.ticker.localeCompare(b.ticker));
  return out;
}
