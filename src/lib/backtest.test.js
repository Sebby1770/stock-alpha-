import { describe, it, expect } from 'vitest';
import { backtestMomentum, alignPriceHistories } from './backtest.js';

function stock(ticker, prices, startDay = 1) {
  return {
    ticker,
    priceHistory: prices.map((price, i) => ({
      date: `2024-01-${String(startDay + i).padStart(2, '0')}`,
      price,
    })),
  };
}

describe('alignPriceHistories', () => {
  it('inner-joins shared dates', () => {
    const a = stock('A', [10, 11, 12], 1);
    const b = stock('B', [20, 21], 2); // 02, 03
    const { dates, series } = alignPriceHistories([a, b]);
    expect(dates).toEqual(['2024-01-02', '2024-01-03']);
    expect(series[0]).toEqual([11, 12]);
    expect(series[1]).toEqual([20, 21]);
  });
});

describe('backtestMomentum', () => {
  const n = 30;
  const up = stock('UP', Array.from({ length: n }, (_, i) => 100 + i));
  const down = stock('DN', Array.from({ length: n }, (_, i) => 100 - i * 0.4));
  const flat = stock('FL', Array.from({ length: n }, () => 100));

  it('returns equity arrays with dates and finite stats', () => {
    const result = backtestMomentum([up, down, flat], {
      topN: 1,
      lookback: 5,
      rebalance: 5,
      startCash: 100000,
    });

    expect(result.equity.length).toBeGreaterThan(0);
    expect(result.equity[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const pt of result.equity) {
      expect(typeof pt.date).toBe('string');
      expect(Number.isFinite(pt.strategy)).toBe(true);
      expect(Number.isFinite(pt.benchmark)).toBe(true);
    }
    const { strategyReturn, benchmarkReturn, maxDrawdown, excessReturn } = result.stats;
    expect(Number.isFinite(strategyReturn)).toBe(true);
    expect(Number.isFinite(benchmarkReturn)).toBe(true);
    expect(Number.isFinite(maxDrawdown)).toBe(true);
    expect(Number.isFinite(excessReturn)).toBe(true);
    expect(maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(maxDrawdown).toBeLessThanOrEqual(1);
  });

  it('prefers the rising name when topN is 1', () => {
    const result = backtestMomentum([up, down], {
      topN: 1,
      lookback: 3,
      rebalance: 3,
      startCash: 1000,
    });
    const last = result.equity[result.equity.length - 1];
    expect(last.strategy).toBeGreaterThan(last.benchmark);
    expect(result.stats.excessReturn).toBeGreaterThan(0);
  });

  it('returns empty equity and finite zeros when history is too short', () => {
    const tiny = [stock('A', [1, 2, 3]), stock('B', [1, 2, 3])];
    const result = backtestMomentum(tiny, { lookback: 21, topN: 2, rebalance: 21 });
    expect(result.equity).toEqual([]);
    expect(result.stats.strategyReturn).toBe(0);
    expect(Number.isFinite(result.stats.maxDrawdown)).toBe(true);
  });
});
