import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadJson, saveJson } from '../lib/storage';
import { getStockByTicker } from '../data/stocks';

const STORAGE_KEY = 'alpharank-portfolio';

const DEFAULT_HOLDINGS = [
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

const PortfolioContext = createContext(null);

function normalizeHoldings(list) {
  if (!Array.isArray(list)) return DEFAULT_HOLDINGS;
  return list
    .filter((h) => h && h.ticker && Number(h.shares) > 0 && Number(h.entryPrice) > 0)
    .map((h) => ({
      ticker: String(h.ticker).toUpperCase(),
      shares: Number(h.shares),
      entryPrice: Number(h.entryPrice),
    }));
}

export function PortfolioProvider({ children }) {
  const [holdings, setHoldings] = useState(() => {
    const saved = loadJson(STORAGE_KEY, null);
    if (saved && Array.isArray(saved) && saved.length > 0) return normalizeHoldings(saved);
    return DEFAULT_HOLDINGS;
  });

  useEffect(() => {
    saveJson(STORAGE_KEY, holdings);
  }, [holdings]);

  const addPosition = useCallback((ticker, shares, entryPrice) => {
    const t = String(ticker).toUpperCase();
    const stock = getStockByTicker(t);
    if (!stock) return { ok: false, error: 'Unknown ticker' };
    const s = Number(shares);
    const p = Number(entryPrice) || stock.price;
    if (!Number.isFinite(s) || s <= 0) return { ok: false, error: 'Invalid shares' };
    if (!Number.isFinite(p) || p <= 0) return { ok: false, error: 'Invalid entry price' };

    setHoldings((prev) => {
      const existing = prev.find((h) => h.ticker === t);
      if (existing) {
        const totalShares = existing.shares + s;
        const avgPrice =
          (existing.entryPrice * existing.shares + p * s) / totalShares;
        return prev.map((h) =>
          h.ticker === t
            ? { ...h, shares: totalShares, entryPrice: Math.round(avgPrice * 100) / 100 }
            : h,
        );
      }
      return [...prev, { ticker: t, shares: s, entryPrice: Math.round(p * 100) / 100 }];
    });
    return { ok: true };
  }, []);

  const removePosition = useCallback((ticker) => {
    const t = String(ticker).toUpperCase();
    setHoldings((prev) => prev.filter((h) => h.ticker !== t));
  }, []);

  const updatePosition = useCallback((ticker, patch) => {
    const t = String(ticker).toUpperCase();
    setHoldings((prev) =>
      prev.map((h) => {
        if (h.ticker !== t) return h;
        return {
          ...h,
          shares: patch.shares !== undefined ? Number(patch.shares) : h.shares,
          entryPrice: patch.entryPrice !== undefined ? Number(patch.entryPrice) : h.entryPrice,
        };
      }),
    );
  }, []);

  const resetToDefault = useCallback(() => {
    setHoldings(DEFAULT_HOLDINGS);
  }, []);

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

  const value = useMemo(
    () => ({
      holdings,
      enriched,
      addPosition,
      removePosition,
      updatePosition,
      resetToDefault,
    }),
    [holdings, enriched, addPosition, removePosition, updatePosition, resetToDefault],
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider');
  return ctx;
}
