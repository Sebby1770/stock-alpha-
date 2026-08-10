import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadJson, saveJson } from '../lib/storage';

const STORAGE_KEY = 'alpharank-watchlist';
const WatchlistContext = createContext(null);

export function WatchlistProvider({ children }) {
  const [tickers, setTickers] = useState(() => {
    const saved = loadJson(STORAGE_KEY, []);
    return Array.isArray(saved) ? saved.map(String) : [];
  });

  useEffect(() => {
    saveJson(STORAGE_KEY, tickers);
  }, [tickers]);

  const isWatched = useCallback(
    (ticker) => tickers.includes(String(ticker).toUpperCase()),
    [tickers],
  );

  const add = useCallback((ticker) => {
    const t = String(ticker).toUpperCase();
    setTickers((prev) => (prev.includes(t) ? prev : [...prev, t]));
  }, []);

  const remove = useCallback((ticker) => {
    const t = String(ticker).toUpperCase();
    setTickers((prev) => prev.filter((x) => x !== t));
  }, []);

  const toggle = useCallback((ticker) => {
    const t = String(ticker).toUpperCase();
    setTickers((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }, []);

  const clear = useCallback(() => setTickers([]), []);

  const value = useMemo(
    () => ({ tickers, isWatched, add, remove, toggle, clear, count: tickers.length }),
    [tickers, isWatched, add, remove, toggle, clear],
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used within WatchlistProvider');
  return ctx;
}
