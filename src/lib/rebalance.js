/**
 * Paper-broker rebalance planner. Fully invested among target names.
 * Educational / simulated — not live markets.
 */

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function lookup(map, ticker) {
  const t = String(ticker || '').toUpperCase();
  if (typeof map === 'function') return Number(map(t));
  if (!map || typeof map !== 'object') return NaN;
  const v = map[t] ?? map[ticker];
  return Number(v);
}

function uniqueTickers(list) {
  const out = [];
  const seen = new Set();
  for (const raw of list || []) {
    const t = String(raw || '').toUpperCase();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/**
 * @param {{
 *   holdings: Array<{ ticker: string, shares: number }>,
 *   cash: number,
 *   prices: Record<string, number> | ((t: string) => number),
 *   scores?: Record<string, number> | ((t: string) => number),
 *   mode?: 'equal' | 'score',
 *   topN?: number,
 *   universe?: string[],
 * }} args
 * @returns {{ trades: Array<{ ticker: string, side: 'buy' | 'sell', shares: number, value: number }>, turnover: number }}
 */
export function planRebalance({
  holdings,
  cash,
  prices,
  scores,
  mode = 'equal',
  topN,
  universe,
} = {}) {
  const lots = Array.isArray(holdings) ? holdings : [];
  const currentShares = {};
  let marketValue = 0;

  for (const h of lots) {
    const ticker = String(h?.ticker ?? '').toUpperCase();
    const shares = Number(h?.shares);
    const px = lookup(prices, ticker);
    if (!ticker || !Number.isFinite(shares) || shares <= 0) continue;
    currentShares[ticker] = (currentShares[ticker] || 0) + shares;
    if (Number.isFinite(px) && px > 0) marketValue += shares * px;
  }

  const cashN = Number.isFinite(Number(cash)) ? Number(cash) : 0;
  const equity = cashN + marketValue;

  let names = uniqueTickers(
    Array.isArray(universe) && universe.length
      ? universe
      : Object.keys(currentShares),
  );

  const nTake = Number(topN);
  if (Number.isFinite(nTake) && nTake > 0 && names.length > nTake) {
    names = names
      .slice()
      .sort((a, b) => {
        const sa = lookup(scores, a);
        const sb = lookup(scores, b);
        const da = Number.isFinite(sa) ? sa : 0;
        const db = Number.isFinite(sb) ? sb : 0;
        return db - da || a.localeCompare(b);
      })
      .slice(0, nTake);
  }

  const empty = { trades: [], turnover: 0 };
  if (!names.length || !(equity > 0)) return empty;

  let weights;
  if (mode === 'score') {
    const raw = names.map((t) => {
      const s = lookup(scores, t);
      return Number.isFinite(s) && s > 0 ? s : 0;
    });
    const sum = raw.reduce((a, b) => a + b, 0);
    weights = sum > 0 ? raw.map((s) => s / sum) : names.map(() => 1 / names.length);
  } else {
    weights = names.map(() => 1 / names.length);
  }

  const targetVal = {};
  names.forEach((t, i) => {
    targetVal[t] = weights[i] * equity;
  });

  const involved = uniqueTickers([...Object.keys(currentShares), ...names]);
  const trades = [];
  let absValue = 0;

  for (const ticker of involved) {
    const px = lookup(prices, ticker);
    if (!Number.isFinite(px) || px <= 0) continue;
    const held = currentShares[ticker] || 0;
    const currentVal = held * px;
    const tgt = targetVal[ticker] || 0;
    let deltaShares = round2((tgt - currentVal) / px);
    if (deltaShares < 0) {
      deltaShares = -Math.min(Math.abs(deltaShares), round2(held));
    }
    if (!deltaShares) continue;
    const value = round2(Math.abs(deltaShares) * px);
    if (!(value >= 1)) continue;
    const side = deltaShares > 0 ? 'buy' : 'sell';
    trades.push({
      ticker,
      side,
      shares: Math.abs(deltaShares),
      value,
    });
    absValue += value;
  }

  const turnover = equity > 0 ? round2((absValue / (2 * equity)) * 10000) / 10000 : 0;
  return { trades, turnover };
}
