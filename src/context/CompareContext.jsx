import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const MAX_COMPARE = 3;
const CompareContext = createContext(null);

export function CompareProvider({ children }) {
  const [tickers, setTickers] = useState([]);

  const isSelected = useCallback(
    (ticker) => tickers.includes(String(ticker).toUpperCase()),
    [tickers],
  );

  const toggle = useCallback((ticker) => {
    const t = String(ticker).toUpperCase();
    setTickers((prev) => {
      if (prev.includes(t)) return prev.filter((x) => x !== t);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, t];
    });
  }, []);

  const add = useCallback((ticker) => {
    const t = String(ticker).toUpperCase();
    setTickers((prev) => {
      if (prev.includes(t) || prev.length >= MAX_COMPARE) return prev;
      return [...prev, t];
    });
  }, []);

  const remove = useCallback((ticker) => {
    const t = String(ticker).toUpperCase();
    setTickers((prev) => prev.filter((x) => x !== t));
  }, []);

  const clear = useCallback(() => setTickers([]), []);

  const value = useMemo(
    () => ({
      tickers,
      isSelected,
      toggle,
      add,
      remove,
      clear,
      count: tickers.length,
      max: MAX_COMPARE,
      canAdd: tickers.length < MAX_COMPARE,
    }),
    [tickers, isSelected, toggle, add, remove, clear],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}
