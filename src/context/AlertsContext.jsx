import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadJson, saveJson } from '../lib/storage';
import { getStockByTicker } from '../data/stocks';
import { meetsMinGrade } from '../lib/quant';

const STORAGE_KEY = 'alpharank-alerts';
const AlertsContext = createContext(null);

export const ALERT_KINDS = [
  { id: 'price_above', label: 'Price ≥' },
  { id: 'price_below', label: 'Price ≤' },
  { id: 'grade_at_least', label: 'Grade at least' },
];

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `alert-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeAlerts(saved) {
  if (!Array.isArray(saved)) return [];
  return saved
    .filter((a) => a && a.ticker && a.kind)
    .map((a) => ({
      id: a.id || makeId(),
      ticker: String(a.ticker).toUpperCase(),
      kind: a.kind,
      value: a.value,
      enabled: a.enabled !== false,
    }));
}

/**
 * Evaluate one alert against a mock stock. Pure.
 */
export function evaluateAlert(alert, stock) {
  if (!alert || !stock) return { triggered: false, label: '' };
  const ticker = stock.ticker;
  if (alert.kind === 'price_above') {
    const threshold = Number(alert.value);
    const px = Number(stock.price);
    const triggered = Number.isFinite(px) && Number.isFinite(threshold) && px >= threshold;
    return {
      triggered,
      label: `${ticker} ${px.toFixed(2)} ≥ ${threshold}`,
    };
  }
  if (alert.kind === 'price_below') {
    const threshold = Number(alert.value);
    const px = Number(stock.price);
    const triggered = Number.isFinite(px) && Number.isFinite(threshold) && px <= threshold;
    return {
      triggered,
      label: `${ticker} ${px.toFixed(2)} ≤ ${threshold}`,
    };
  }
  if (alert.kind === 'grade_at_least') {
    const min = String(alert.value || '');
    const triggered = meetsMinGrade(stock.quantGrade, min);
    return {
      triggered,
      label: `${ticker} ${stock.quantGrade} ≥ ${min}`,
    };
  }
  return { triggered: false, label: '' };
}

export function AlertsProvider({ children }) {
  const [alerts, setAlerts] = useState(() => normalizeAlerts(loadJson(STORAGE_KEY, [])));

  useEffect(() => {
    saveJson(STORAGE_KEY, alerts);
  }, [alerts]);

  const add = useCallback((input) => {
    const ticker = String(input?.ticker || '').toUpperCase();
    const kind = input?.kind;
    const value = input?.value;
    if (!ticker || !getStockByTicker(ticker)) return { ok: false, error: 'Unknown ticker' };
    if (!ALERT_KINDS.some((k) => k.id === kind)) return { ok: false, error: 'Invalid kind' };
    if (value == null || value === '') return { ok: false, error: 'Value required' };
    if (kind !== 'grade_at_least' && !Number.isFinite(Number(value))) {
      return { ok: false, error: 'Invalid price' };
    }
    const row = {
      id: makeId(),
      ticker,
      kind,
      value: kind === 'grade_at_least' ? String(value) : Number(value),
      enabled: true,
    };
    setAlerts((prev) => [...prev, row]);
    return { ok: true, alert: row };
  }, []);

  const remove = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const toggle = useCallback((id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
    );
  }, []);

  const evaluated = useMemo(
    () =>
      alerts.map((alert) => {
        const stock = getStockByTicker(alert.ticker);
        const ev = evaluateAlert(alert, stock);
        return { ...alert, ...ev, stock };
      }),
    [alerts],
  );

  const triggered = useMemo(
    () => evaluated.filter((a) => a.enabled && a.triggered),
    [evaluated],
  );

  const enabledCount = useMemo(
    () => alerts.filter((a) => a.enabled).length,
    [alerts],
  );

  const value = useMemo(
    () => ({
      alerts,
      evaluated,
      triggered,
      enabledCount,
      add,
      remove,
      toggle,
      count: alerts.length,
    }),
    [alerts, evaluated, triggered, enabledCount, add, remove, toggle],
  );

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}

export function useAlerts() {
  const ctx = useContext(AlertsContext);
  if (!ctx) throw new Error('useAlerts must be used within AlertsProvider');
  return ctx;
}
