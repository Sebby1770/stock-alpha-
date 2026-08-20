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
  PORTFOLIO_VERSION,
} from '../lib/broker';

const STORAGE_KEY = 'alpharank-portfolio';

const PortfolioContext = createContext(null);

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `fill-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function appendFill(prev, outcome, note) {
  const fill = {
    id: makeId(),
    ts: Date.now(),
    side: outcome.fill.side,
    ticker: outcome.fill.ticker,
    shares: outcome.fill.shares,
    price: outcome.fill.price,
    cashAfter: outcome.cash,
  };
  if (note) fill.note = note;
  return {
    version: PORTFOLIO_VERSION,
    cash: outcome.cash,
    holdings: outcome.holdings,
    ledger: [...(prev.ledger || []), fill],
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

  const resetToDefault = useCallback(() => {
    setBook(defaultBook());
  }, []);

  const holdings = book.holdings;
  const cash = book.cash;
  const ledger = book.ledger;

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
  const equity = cash + marketValue;

  const value = useMemo(
    () => ({
      book,
      cash,
      holdings,
      ledger,
      enriched,
      marketValue,
      equity,
      pnl,
      buyStock,
      sellStock,
      removePosition,
      resetToDefault,
    }),
    [
      book, cash, holdings, ledger, enriched, marketValue, equity, pnl,
      buyStock, sellStock, removePosition, resetToDefault,
    ],
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider');
  return ctx;
}
