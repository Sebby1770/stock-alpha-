import { describe, it, expect } from 'vitest';
import { simulatePaths, equalWeightDailyReturns } from './montecarlo.js';

describe('simulatePaths', () => {
  it('starts every series at the start value', () => {
    const start = 100000;
    const r = simulatePaths({
      returns: [0.01, -0.01, 0.02],
      paths: 20,
      horizon: 5,
      start,
    });
    expect(r.paths).toHaveLength(20);
    expect(r.p5).toHaveLength(6);
    expect(r.p50).toHaveLength(6);
    expect(r.p95).toHaveLength(6);
    expect(r.p5[0]).toBe(start);
    expect(r.p50[0]).toBe(start);
    expect(r.p95[0]).toBe(start);
    for (const row of r.paths) {
      expect(row[0]).toBe(start);
      expect(row).toHaveLength(6);
    }
  });

  it('p5[last] <= p50[last] <= p95[last] on a long sample', () => {
    const returns = [];
    for (let i = 0; i < 80; i += 1) {
      returns.push(((i % 7) - 3) / 200);
    }
    const r = simulatePaths({
      returns,
      paths: 400,
      horizon: 40,
      start: 100000,
    });
    const last = r.p50.length - 1;
    expect(r.p5[last]).toBeLessThanOrEqual(r.p50[last]);
    expect(r.p50[last]).toBeLessThanOrEqual(r.p95[last]);
  });
});

describe('equalWeightDailyReturns', () => {
  it('averages aligned simple returns', () => {
    const stocks = [
      {
        ticker: 'A',
        priceHistory: [
          { date: '2024-01-01', price: 100 },
          { date: '2024-01-02', price: 110 },
          { date: '2024-01-03', price: 99 },
        ],
      },
      {
        ticker: 'B',
        priceHistory: [
          { date: '2024-01-01', price: 50 },
          { date: '2024-01-02', price: 50 },
          { date: '2024-01-03', price: 55 },
        ],
      },
    ];
    const rets = equalWeightDailyReturns(stocks);
    expect(rets).toHaveLength(2);
    expect(rets[0]).toBeCloseTo((0.1 + 0) / 2, 10);
    expect(rets[1]).toBeCloseTo((99 / 110 - 1 + 0.1) / 2, 10);
  });
});
