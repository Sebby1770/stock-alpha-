import { describe, it, expect } from 'vitest';
import { priceAsOf, valueAsOf } from './asof.js';

const stock = {
  ticker: 'AAA',
  price: 100,
  priceHistory: [
    { date: '2026-01-02', price: 10 },
    { date: '2026-01-15', price: 20 },
    { date: '2026-02-02', price: 30 },
  ],
};

const holdings = [{ ticker: 'AAA', shares: 2, entryPrice: 5 }];
const stocks = [stock];

describe('valueAsOf', () => {
  it('uses the priceHistory point on a known date', () => {
    expect(valueAsOf(holdings, stocks, '2026-01-15')).toBe(40);
  });

  it('uses the last point on or before the date', () => {
    expect(valueAsOf(holdings, stocks, '2026-01-20')).toBe(40);
    expect(valueAsOf(holdings, stocks, '2026-02-02')).toBe(60);
  });

  it('falls back to last price when nothing is on/before the date', () => {
    expect(valueAsOf(holdings, stocks, '2025-12-01')).toBe(200);
    expect(priceAsOf(stock, '2025-12-01')).toBe(100);
  });

  it('is 0 for empty holdings', () => {
    expect(valueAsOf([], stocks, '2026-01-15')).toBe(0);
  });
});
