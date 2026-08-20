import { describe, it, expect } from 'vitest';
import { annualIncome, yieldOnCost } from './dividends.js';

const fakeHolding = [{ ticker: 'AAA', shares: 100, entryPrice: 50 }];
const fakeStocks = [{ ticker: 'AAA', price: 80, dividendYield: 2.5 }];

describe('annualIncome', () => {
  it('is shares * price * (yield / 100) for a fake holding', () => {
    // 100 * 80 * 0.025 = 200
    expect(annualIncome(fakeHolding, fakeStocks)).toBe(200);
  });

  it('skips unknown tickers and empty input', () => {
    expect(annualIncome([{ ticker: 'ZZZ', shares: 10, entryPrice: 1 }], fakeStocks)).toBe(0);
    expect(annualIncome(null, fakeStocks)).toBe(0);
    expect(annualIncome(fakeHolding, null)).toBe(0);
  });
});

describe('yieldOnCost', () => {
  it('is annual income vs cost basis', () => {
    // 200 / (100 * 50) * 100 = 4
    expect(yieldOnCost(fakeHolding, fakeStocks)).toBe(4);
  });

  it('is 0 when cost basis is 0', () => {
    expect(yieldOnCost([], fakeStocks)).toBe(0);
  });
});
