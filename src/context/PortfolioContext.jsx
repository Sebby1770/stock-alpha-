import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadJson, saveJson } from '../lib/storage';
import { getStockByTicker } from '../data/stocks';
import {
  buy,
  sell,
  migratePortfolio,
  defaultBook,
  positionValue,
  unrealizedPnL,
  realizedPnL,
  normalizeHoldings,
  PORTFOLIO_VERSION,
} from '../lib/broker';
import { evaluateStops } from '../lib/stops';

const STORAGE_KEY = 'alpharank-portfolio';

const PortfolioContext = createContext(null);

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `fill-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function fillFromOutcome(outcome, note) {
  const fill = {
    id: makeId(),
    ts: Date.now(),
    side: outcome.fill.side,
    ticker: outcome.fill.ticker,
    shares: outcome.fill.shares,
    price: outcome.fill.price,
    fee: outcome.fill.fee ?? 0,
    realized: Number.isFinite(Number(outcome.fill.realized)) ? Number(outcome.fill.realized) : 0,
    cashAfter: outcome.cash,
  };
  if (note) fill.note = note;
  return fill;
}

function appendFill(prev, outcome, note) {
  return {
    version: PORTFOLIO_VERSION,
    cash: outcome.cash,
    holdings: outcome.holdings,
    ledger: [...(prev.ledger || []), fillFromOutcome(outcome, note)],
    stops: Array.isArray(prev.stops) ? prev.stops : [],
  };
}

export function PortfolioProvider({ children }) {
  const [book, setBook] = useState(() => migratePortfolio(loadJson(STORAGE_KEY, null)));

  useEffect(() => {
    saveJson(STORAGE_KEY, book);
  }, [book]);

  const buyStock = useCallback((ticker, shares, note) => {
    const t = String(ticker || '').toUpperCase();
    const stock = getStockByTicker(t);
    if (!stock) return { ok: false, error: 'Unknown ticker' };
    let outcome = { ok: false, error: 'Order failed' };
    setBook((prev) => {
      outcome = buy(
        { cash: prev.cash, holdings: prev.holdings },
        { ticker: t, shares, price: stock.price },
      );
      if (!outcome.ok) return prev;
      return appendFill(prev, outcome, note);
    });
    return outcome;
  }, []);

  const sellStock = useCallback((ticker, shares, note) => {
    const t = String(ticker || '').toUpperCase();
    const stock = getStockByTicker(t);
    if (!stock) return { ok: false, error: 'Unknown ticker' };
    let outcome = { ok: false, error: 'Order failed' };
    setBook((prev) => {
      outcome = sell(
        { cash: prev.cash, holdings: prev.holdings },
        { ticker: t, shares, price: stock.price },
      );
      if (!outcome.ok) return prev;
      return appendFill(prev, outcome, note);
    });
    return outcome;
  }, []);

  const removePosition = useCallback((ticker) => {
    const t = String(ticker || '').toUpperCase();
    const stock = getStockByTicker(t);
    let outcome = { ok: false, error: 'Unknown ticker' };
    setBook((prev) => {
      const lot = (prev.holdings || []).find((h) => h.ticker === t);
      if (!lot) {
        outcome = { ok: false, error: 'No position' };
        return prev;
      }
      if (!stock) {
        outcome = { ok: false, error: 'Unknown ticker' };
        return prev;
      }
      outcome = sell(
        { cash: prev.cash, holdings: prev.holdings },
        { ticker: t, shares: lot.shares, price: stock.price },
      );
      if (!outcome.ok) return prev;
      return appendFill(prev, outcome, 'close');
    });
    return outcome;
  }, []);

  const addStop = useCallback((input) => {
    const ticker = String(input?.ticker || '').toUpperCase();
    const kind = input?.kind;
    const price = Number(input?.price);
    if (!ticker) return { ok: false, error: 'Unknown ticker' };
    if (kind !== 'stop_loss' && kind !== 'take_profit') return { ok: false, error: 'Invalid kind' };
    if (!Number.isFinite(price) || price <= 0) return { ok: false, error: 'Invalid price' };
    const row = {
      id: makeId(),
      ticker,
      kind,
      price,
      enabled: input?.enabled !== false,
    };
    setBook((prev) => ({
      ...prev,
      version: PORTFOLIO_VERSION,
      stops: [
        ...(prev.stops || []).filter((s) => !(s.ticker === ticker && s.kind === kind)),
        row,
      ],
    }));
    return { ok: true, stop: row };
  }, []);

  const removeStop = useCallback((id) => {
    setBook((prev) => ({
      ...prev,
      version: PORTFOLIO_VERSION,
      stops: (prev.stops || []).filter((s) => s.id !== id),
    }));
  }, []);

  const executeStopSignals = useCallback(() => {
    const priceOf = (t) => getStockByTicker(t)?.price ?? 0;
    let hits = [];
    setBook((prev) => {
      const signals = evaluateStops(prev.holdings, priceOf, prev.stops || []);
      if (!signals.length) {
        hits = [];
        return prev;
      }
      let cash = prev.cash;
      let holdings = prev.holdings;
      let ledger = [...(prev.ledger || [])];
      let stops = [...(prev.stops || [])];
      const sold = new Set();
      const executed = [];
      for (const sig of signals) {
        const ticker = String(sig.stop.ticker).toUpperCase();
        if (sold.has(ticker)) continue;
        const stock = getStockByTicker(ticker);
        if (!stock) continue;
        const lot = (holdings || []).find((h) => h.ticker === ticker);
        if (!lot) continue;
        const outcome = sell(
          { cash, holdings },
          { ticker, shares: lot.shares, price: stock.price },
        );
        if (!outcome.ok) continue;
        cash = outcome.cash;
        holdings = outcome.holdings;
        ledger = [...ledger, fillFromOutcome(outcome, 'stop')];
        stops = stops.filter((s) => s.id !== sig.stop.id);
        sold.add(ticker);
        executed.push(sig);
      }
      hits = executed;
      if (!executed.length) return prev;
      return {
        version: PORTFOLIO_VERSION,
        cash,
        holdings,
        ledger,
        stops,
      };
    });
    return hits;
  }, []);

  const resetToDefault = useCallback(() => {
    setBook(defaultBook());
  }, []);

  const loadBook = useCallback((next) => {
    setBook(migratePortfolio(next));
  }, []);

  const applySnapshot = useCallback((snap) => {
    const cashNext = Number(snap?.cash);
    if (!Number.isFinite(cashNext)) return { ok: false, error: 'Invalid snapshot' };
    const holdingsNext = normalizeHoldings(snap?.holdings);
    setBook((prev) => ({
      ...prev,
      version: PORTFOLIO_VERSION,
      cash: cashNext,
      holdings: holdingsNext,
    }));
    return { ok: true };
  }, []);

  const holdings = book.holdings;
  const cash = book.cash;
  const ledger = book.ledger;
  const stops = book.stops || [];

  const priceOf = useCallback((ticker) => getStockByTicker(ticker)?.price ?? 0, []);

  const enriched = useMemo(() => {
    return holdings
      .map((h) => {
        const stock = getStockByTicker(h.ticker);
        if (!stock) return null;
        const currentVal = stock.price * h.shares;
        const costBasis = h.entryPrice * h.shares;
        const gain = currentVal - costBasis;
        const gainPct = costBasis ? (gain / costBasis) * 100 : 0;
        return { ...h, stock, currentVal, costBasis, gain, gainPct };
      })
      .filter(Boolean);
  }, [holdings]);

  const marketValue = useMemo(() => positionValue(holdings, priceOf), [holdings, priceOf]);
  const pnl = useMemo(() => unrealizedPnL(holdings, priceOf), [holdings, priceOf]);
  const realized = useMemo(() => realizedPnL(ledger), [ledger]);
  const equity = cash + marketValue;

  const value = useMemo(
    () => ({
      book,
      cash,
      holdings,
      ledger,
      stops,
      enriched,
      marketValue,
      equity,
      pnl,
      realized,
      buyStock,
      sellStock,
      removePosition,
      addStop,
      removeStop,
      executeStopSignals,
      resetToDefault,
      loadBook,
      applySnapshot,
    }),
    [
      book, cash, holdings, ledger, stops, enriched, marketValue, equity, pnl, realized,
      buyStock, sellStock, removePosition, addStop, removeStop, executeStopSignals, resetToDefault,
      loadBook, applySnapshot,
    ],
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider');
  return ctx;
}
