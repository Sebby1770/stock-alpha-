/**
 * Estimated dividend income from mock yields (percent, e.g. 2.5 = 2.5%).
 */

function stockByTicker(stocks) {
  const map = new Map();
  if (!Array.isArray(stocks)) return map;
  for (const s of stocks) {
    if (s && s.ticker) map.set(String(s.ticker).toUpperCase(), s);
  }
  return map;
}

/**
 * Sum of shares * last price * (dividendYield / 100).
 */
export function annualIncome(holdings, stocks) {
  if (!Array.isArray(holdings)) return 0;
  const byTicker = stockByTicker(stocks);
  return holdings.reduce((sum, h) => {
    if (!h) return sum;
    const stock = byTicker.get(String(h.ticker).toUpperCase());
    if (!stock) return sum;
    const shares = Number(h.shares);
    const price = Number(stock.price);
    const yld = Number(stock.dividendYield);
    if (!Number.isFinite(shares) || shares <= 0) return sum;
    if (!Number.isFinite(price) || !Number.isFinite(yld)) return sum;
    return sum + shares * price * (yld / 100);
  }, 0);
}

/**
 * Annual income as a percent of cost basis (shares * entryPrice).
 */
export function yieldOnCost(holdings, stocks) {
  if (!Array.isArray(holdings)) return 0;
  const income = annualIncome(holdings, stocks);
  const cost = holdings.reduce((sum, h) => {
    const shares = Number(h?.shares);
    const entry = Number(h?.entryPrice);
    if (!Number.isFinite(shares) || !Number.isFinite(entry)) return sum;
    return sum + shares * entry;
  }, 0);
  if (cost <= 0) return 0;
  return (income / cost) * 100;
}
