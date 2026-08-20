/**
 * Pure stop-loss / take-profit evaluator. No I/O, no React.
 */

export const STOP_KINDS = ['stop_loss', 'take_profit'];

/**
 * Stops that the current mark has crossed.
 * stop_loss fires when px <= stop.price; take_profit when px >= stop.price.
 * Disabled stops and names with no open lot are ignored.
 *
 * @param {Array<{ ticker: string, shares: number }>} holdings
 * @param {(ticker: string) => number} priceOf
 * @param {Array<{ id: string, ticker: string, kind: 'stop_loss'|'take_profit', price: number, enabled: boolean }>} stops
 * @returns {Array<{ stop: object, shares: number, price: number, reason: string }>}
 */
export function evaluateStops(holdings, priceOf, stops) {
  if (!Array.isArray(holdings) || !Array.isArray(stops) || typeof priceOf !== 'function') {
    return [];
  }

  const lots = new Map();
  for (const h of holdings) {
    if (!h?.ticker) continue;
    const ticker = String(h.ticker).toUpperCase();
    const shares = Number(h.shares);
    if (!Number.isFinite(shares) || shares <= 0) continue;
    lots.set(ticker, (lots.get(ticker) || 0) + shares);
  }

  const hits = [];
  for (const stop of stops) {
    if (!stop || stop.enabled === false) continue;
    const kind = stop.kind;
    if (kind !== 'stop_loss' && kind !== 'take_profit') continue;
    const ticker = String(stop.ticker || '').toUpperCase();
    const shares = lots.get(ticker);
    if (!shares) continue;
    const threshold = Number(stop.price);
    const px = Number(priceOf(ticker));
    if (!Number.isFinite(threshold) || threshold <= 0) continue;
    if (!Number.isFinite(px) || px <= 0) continue;

    const crossed = kind === 'stop_loss' ? px <= threshold : px >= threshold;
    if (!crossed) continue;

    const reason =
      kind === 'stop_loss'
        ? `stop_loss: ${ticker} ${px} <= ${threshold}`
        : `take_profit: ${ticker} ${px} >= ${threshold}`;

    hits.push({ stop, shares, price: px, reason });
  }

  return hits;
}
