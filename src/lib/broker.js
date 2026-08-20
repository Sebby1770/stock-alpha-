/**
 * Pure paper-broker: cash + lots, no React, no I/O.
 */

export const PORTFOLIO_VERSION = 4;
export const STARTING_CASH = 100_000;

export const DEFAULT_HOLDINGS = [
  { ticker: 'NVDA', shares: 50, entryPrice: 620.0 },
  { ticker: 'MSFT', shares: 120, entryPrice: 385.0 },
  { ticker: 'META', shares: 80, entryPrice: 470.0 },
  { ticker: 'AAPL', shares: 200, entryPrice: 172.0 },
  { ticker: 'AVGO', shares: 100, entryPrice: 135.0 },
  { ticker: 'LLY', shares: 30, entryPrice: 750.0 },
  { ticker: 'GOOGL', shares: 150, entryPrice: 145.0 },
  { ticker: 'V', shares: 80, entryPrice: 250.0 },
  { ticker: 'JPM', shares: 100, entryPrice: 185.0 },
  { ticker: 'COST', shares: 25, entryPrice: 820.0 },
];

const SHARE_EPS = 1e-8;

const LEDGER_CSV_COLS = [
  'id', 'ts', 'side', 'ticker', 'shares', 'price', 'fee', 'realized', 'cashAfter', 'note',
];

export function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

export function normalizeHoldings(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((h) => h && h.ticker && Number(h.shares) > 0 && Number(h.entryPrice) > 0)
    .map((h) => ({
      ticker: String(h.ticker).toUpperCase(),
      shares: Number(h.shares),
      entryPrice: Number(h.entryPrice),
    }));
}

export function normalizeStops(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter(
      (s) =>
        s &&
        s.ticker &&
        (s.kind === 'stop_loss' || s.kind === 'take_profit') &&
        Number(s.price) > 0,
    )
    .map((s, i) => ({
      id: s.id ? String(s.id) : `stop-${String(s.ticker).toUpperCase()}-${s.kind}-${i}`,
      ticker: String(s.ticker).toUpperCase(),
      kind: s.kind,
      price: Number(s.price),
      enabled: s.enabled !== false,
    }));
}

export function defaultBook() {
  return {
    version: PORTFOLIO_VERSION,
    cash: STARTING_CASH,
    holdings: DEFAULT_HOLDINGS.map((h) => ({ ...h })),
    ledger: [],
    stops: [],
  };
}

/**
 * Upgrade v2 array-of-holdings or a v3 cash-ledger book to the v4 book (adds stops).
 */
export function migratePortfolio(saved) {
  if (saved == null) return defaultBook();

  if (Array.isArray(saved)) {
    return {
      version: PORTFOLIO_VERSION,
      cash: STARTING_CASH,
      holdings: normalizeHoldings(saved),
      ledger: [],
      stops: [],
    };
  }

  if (typeof saved === 'object') {
    const holdings = normalizeHoldings(saved.holdings);
    const cashRaw = Number(saved.cash);
    const ledger = Array.isArray(saved.ledger) ? saved.ledger : [];
    const ver = Number(saved.version);
    // v3 (or unversioned objects) get an empty stops list; v4+ keeps saved stops
    const stops = ver >= 4 ? normalizeStops(saved.stops) : [];
    return {
      version: PORTFOLIO_VERSION,
      cash: Number.isFinite(cashRaw) ? cashRaw : STARTING_CASH,
      holdings,
      ledger,
      stops,
    };
  }

  return defaultBook();
}

function parseOrder(state, order) {
  const cash = Number(state?.cash);
  const holdings = Array.isArray(state?.holdings) ? state.holdings : [];
  const ticker = String(order?.ticker ?? '').trim().toUpperCase();
  const shares = Number(order?.shares);
  const price = Number(order?.price);
  const fee = order?.fee == null ? 0 : Number(order.fee);

  if (!ticker) return { error: 'Unknown ticker' };
  if (!Number.isFinite(shares) || shares <= 0) return { error: 'Invalid shares' };
  if (!Number.isFinite(price) || price <= 0) return { error: 'Invalid price' };
  if (!Number.isFinite(fee) || fee < 0) return { error: 'Invalid fee' };
  if (!Number.isFinite(cash)) return { error: 'Invalid cash' };

  return { cash, holdings, ticker, shares, price, fee };
}

/**
 * Buy shares for cash. Averages up an existing lot.
 * @returns {{ ok: true, cash: number, holdings: Array, fill: object } | { ok: false, error: string }}
 */
export function buy(state, order) {
  const parsed = parseOrder(state, order);
  if (parsed.error) return { ok: false, error: parsed.error };

  const { cash, holdings, ticker, shares, price, fee } = parsed;
  const cost = shares * price + fee;
  if (cash < cost) return { ok: false, error: 'Insufficient cash' };

  const nextCash = round2(cash - cost);
  const existing = holdings.find((h) => h.ticker === ticker);
  let nextHoldings;
  if (existing) {
    const totalShares = existing.shares + shares;
    const avgPrice = (existing.entryPrice * existing.shares + price * shares) / totalShares;
    nextHoldings = holdings.map((h) =>
      h.ticker === ticker
        ? { ticker, shares: totalShares, entryPrice: round2(avgPrice) }
        : h,
    );
  } else {
    nextHoldings = [...holdings, { ticker, shares, entryPrice: round2(price) }];
  }

  return {
    ok: true,
    cash: nextCash,
    holdings: nextHoldings,
    fill: { side: 'buy', ticker, shares, price, fee, cashAfter: nextCash, realized: 0 },
  };
}

/**
 * Sell shares back to cash. Drops the lot when remaining shares hit 0.
 */
export function sell(state, order) {
  const parsed = parseOrder(state, order);
  if (parsed.error) return { ok: false, error: parsed.error };

  const { cash, holdings, ticker, shares, price, fee } = parsed;
  const existing = holdings.find((h) => h.ticker === ticker);
  if (!existing || existing.shares + SHARE_EPS < shares) {
    return { ok: false, error: 'Insufficient shares' };
  }

  const proceeds = shares * price - fee;
  if (proceeds < 0) return { ok: false, error: 'Fee exceeds proceeds' };

  const nextCash = round2(cash + proceeds);
  const remaining = existing.shares - shares;
  const nextHoldings =
    remaining <= SHARE_EPS
      ? holdings.filter((h) => h.ticker !== ticker)
      : holdings.map((h) => (h.ticker === ticker ? { ...h, shares: remaining } : h));

  const realized = round2((price - existing.entryPrice) * shares - fee);

  return {
    ok: true,
    cash: nextCash,
    holdings: nextHoldings,
    fill: { side: 'sell', ticker, shares, price, fee, cashAfter: nextCash, realized },
  };
}

/**
 * Mark-to-market value of lots.
 * @param {Array} holdings
 * @param {(ticker: string) => number} priceOf
 */
export function positionValue(holdings, priceOf) {
  if (!Array.isArray(holdings) || typeof priceOf !== 'function') return 0;
  return holdings.reduce((sum, h) => {
    const px = Number(priceOf(h.ticker));
    const sh = Number(h.shares);
    if (!Number.isFinite(px) || !Number.isFinite(sh)) return sum;
    return sum + sh * px;
  }, 0);
}

/**
 * Unrealized P&L vs average entry.
 * @param {Array} holdings
 * @param {(ticker: string) => number} priceOf
 */
export function unrealizedPnL(holdings, priceOf) {
  if (!Array.isArray(holdings) || typeof priceOf !== 'function') return 0;
  return holdings.reduce((sum, h) => {
    const px = Number(priceOf(h.ticker));
    const sh = Number(h.shares);
    const entry = Number(h.entryPrice);
    if (!Number.isFinite(px) || !Number.isFinite(sh) || !Number.isFinite(entry)) return sum;
    return sum + (px - entry) * sh;
  }, 0);
}

/**
 * Sum of fill.realized across the ledger (closed-lot P&L).
 */
export function realizedPnL(ledger) {
  if (!Array.isArray(ledger)) return 0;
  return ledger.reduce((sum, fill) => {
    const r = Number(fill?.realized);
    return sum + (Number.isFinite(r) ? r : 0);
  }, 0);
}

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Export the fill ledger as CSV (header + one row per fill).
 */
export function ledgerToCsv(ledger) {
  const header = LEDGER_CSV_COLS.join(',');
  const rows = (Array.isArray(ledger) ? ledger : []).map((fill) =>
    LEDGER_CSV_COLS.map((col) => {
      if (col === 'ts' && fill?.ts != null) {
        const d = new Date(fill.ts);
        if (!Number.isNaN(d.getTime())) return csvEscape(d.toISOString());
      }
      return csvEscape(fill?.[col]);
    }).join(','),
  );
  return [header, ...rows].join('\n');
}
