import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadJson, saveJson } from '../lib/storage';

const STORAGE_KEY = 'alpharank-watchlist';
const NOTES_KEY = 'alpharank-notes';
const WatchlistContext = createContext(null);

function loadNotes() {
  const saved = loadJson(NOTES_KEY, {});
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
  const out = {};
  for (const [k, v] of Object.entries(saved)) {
    out[String(k).toUpperCase()] = String(v ?? '');
  }
  return out;
}

export function WatchlistProvider({ children }) {
  const [tickers, setTickers] = useState(() => {
    const saved = loadJson(STORAGE_KEY, []);
    return Array.isArray(saved) ? saved.map(String) : [];
  });
  const [notes, setNotes] = useState(loadNotes);

  useEffect(() => {
    saveJson(STORAGE_KEY, tickers);
  }, [tickers]);

  useEffect(() => {
    saveJson(NOTES_KEY, notes);
  }, [notes]);

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

  const note = useCallback(
    (ticker) => notes[String(ticker).toUpperCase()] || '',
    [notes],
  );

  const setNote = useCallback((ticker, text) => {
    const t = String(ticker).toUpperCase();
    const next = String(text ?? '');
    setNotes((prev) => {
      if (!next) {
        if (!(t in prev)) return prev;
        const copy = { ...prev };
        delete copy[t];
        return copy;
      }
      if (prev[t] === next) return prev;
      return { ...prev, [t]: next };
    });
  }, []);

  const value = useMemo(
    () => ({
      tickers,
      isWatched,
      add,
      remove,
      toggle,
      clear,
      note,
      setNote,
      count: tickers.length,
    }),
    [tickers, isWatched, add, remove, toggle, clear, note, setNote],
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used within WatchlistProvider');
  return ctx;
}
