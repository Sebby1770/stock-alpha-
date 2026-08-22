import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { stocks } from '../data/stocks';
import {
  DEFAULT_POSITIONS,
  DEFAULT_WATCHLIST,
  sanitizePositions,
  sanitizeWatchlist,
} from '../lib/portfolio';

const ResearchContext = createContext(null);
const tickerUniverse = stocks.map((stock) => stock.ticker);

function readStorage(key, fallback, sanitizer) {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = window.localStorage.getItem(key);
    return saved === null ? fallback : sanitizer(JSON.parse(saved), tickerUniverse);
  } catch {
    return fallback;
  }
}

function usePersistentCollection(key, fallback, sanitizer) {
  const [value, setValue] = useState(() => readStorage(key, fallback, sanitizer));
  const update = useCallback((nextValue) => {
    setValue((current) => {
      const resolved = typeof nextValue === 'function' ? nextValue(current) : nextValue;
      const clean = sanitizer(resolved, tickerUniverse);
      try {
        window.localStorage.setItem(key, JSON.stringify(clean));
      } catch {
        // Storage can be unavailable in privacy mode; state still works in-session.
      }
      return clean;
    });
  }, [key, sanitizer]);
  return [value, update];
}

export function ResearchProvider({ children }) {
  const [watchlist, setWatchlist] = usePersistentCollection(
    'alpharank.watchlist.v1',
    DEFAULT_WATCHLIST,
    sanitizeWatchlist,
  );
  const [positions, setPositions] = usePersistentCollection(
    'alpharank.positions.v1',
    DEFAULT_POSITIONS,
    sanitizePositions,
  );

  const toggleWatchlist = useCallback((ticker) => {
    const normalized = ticker.toUpperCase();
    setWatchlist((current) => current.includes(normalized)
      ? current.filter((item) => item !== normalized)
      : [...current, normalized]);
  }, [setWatchlist]);

  const addPosition = useCallback((position) => {
    setPositions((current) => [...current, position]);
  }, [setPositions]);

  const updatePosition = useCallback((ticker, updates) => {
    setPositions((current) => current.map((position) =>
      position.ticker === ticker ? { ...position, ...updates, ticker } : position));
  }, [setPositions]);

  const removePosition = useCallback((ticker) => {
    setPositions((current) => current.filter((position) => position.ticker !== ticker));
  }, [setPositions]);

  const resetPortfolio = useCallback(() => {
    setPositions(DEFAULT_POSITIONS);
  }, [setPositions]);

  const value = useMemo(() => ({
    watchlist,
    positions,
    toggleWatchlist,
    addPosition,
    updatePosition,
    removePosition,
    resetPortfolio,
  }), [watchlist, positions, toggleWatchlist, addPosition, updatePosition, removePosition, resetPortfolio]);

  return <ResearchContext.Provider value={value}>{children}</ResearchContext.Provider>;
}

export function useResearch() {
  const value = useContext(ResearchContext);
  if (!value) throw new Error('useResearch must be used inside ResearchProvider');
  return value;
}
