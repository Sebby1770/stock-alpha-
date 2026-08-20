/**
 * Mark holdings using a historical mock close on or before `date`.
 */

/**
 * Close on/before YYYY-MM-DD, else the stock's last price.
 */
export function priceAsOf(stock, date) {
  if (!stock) return 0;
  const last = Number(stock.price);
  const fallback = Number.isFinite(last) ? last : 0;
  if (date == null || date === '') return fallback;
  const target = String(date).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(target)) return fallback;
  const hist = Array.isArray(stock.priceHistory) ? stock.priceHistory : [];
  let best = null;
  for (const pt of hist) {
    const d = pt && pt.date != null ? String(pt.date).slice(0, 10) : '';
    if (!d || d > target) continue;
    const px = Number(pt.price);
    if (!Number.isFinite(px)) continue;
    if (!best || d >= best.date) best = { date: d, price: px };
  }
  return best ? best.price : fallback;
}

/**
 * Sum of shares * priceAsOf for each lot.
 */
export function valueAsOf(holdings, stocks, date) {
  if (!Array.isArray(holdings) || !Array.isArray(stocks)) return 0;
  const byTicker = new Map();
  for (const s of stocks) {
    if (s && s.ticker) byTicker.set(String(s.ticker).toUpperCase(), s);
  }
  return holdings.reduce((sum, h) => {
    if (!h) return sum;
    const stock = byTicker.get(String(h.ticker).toUpperCase());
    if (!stock) return sum;
    const shares = Number(h.shares);
    if (!Number.isFinite(shares) || shares <= 0) return sum;
    return sum + shares * priceAsOf(stock, date);
  }, 0);
}
