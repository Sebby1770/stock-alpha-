import { describe, it, expect } from 'vitest';
import { pearson, dailyReturns, correlationMatrix } from './correlation.js';

function stock(ticker, prices) {
  return {
    ticker,
    priceHistory: prices.map((price, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      price,
    })),
  };
}

describe('pearson', () => {
  it('perfect correlation of a series with itself is 1', () => {
    const xs = [1, 2, 3, 4, 5];
    expect(pearson(xs, xs)).toBeCloseTo(1, 10);
  });

  it('anti-correlated pair is ~ -1', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [5, 4, 3, 2, 1];
    expect(pearson(xs, ys)).toBeCloseTo(-1, 10);
  });
});

describe('dailyReturns', () => {
  it('computes simple returns', () => {
    const rets = dailyReturns([100, 110, 99]);
    expect(rets).toHaveLength(2);
    expect(rets[0]).toBeCloseTo(0.1, 10);
    expect(rets[1]).toBeCloseTo(99 / 110 - 1, 10);
  });
});

describe('correlationMatrix', () => {
  it('diagonal of a varying series is 1', () => {
    const a = stock('A', [100, 110, 105, 120, 118]);
    const { matrix, tickers } = correlationMatrix([a]);
    expect(tickers).toEqual(['A']);
    expect(matrix[0][0]).toBeCloseTo(1, 8);
  });

  it('anti-correlated pair of return series is ~ -1', () => {
    // Opposite simple returns: +10%, -10%, +10% vs -10%, +10%, -10%
    const up = stock('UP', [100, 110, 99, 108.9]);
    const down = stock('DN', [100, 90, 99, 89.1]);
    const { matrix } = correlationMatrix([up, down]);
    expect(matrix[0][0]).toBeCloseTo(1, 8);
    expect(matrix[1][1]).toBeCloseTo(1, 8);
    expect(matrix[0][1]).toBeCloseTo(-1, 5);
    expect(matrix[1][0]).toBeCloseTo(-1, 5);
  });
});
