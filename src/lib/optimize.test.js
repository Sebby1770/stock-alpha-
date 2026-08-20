import { describe, it, expect } from 'vitest';
import {
  returnMatrix, covariance, inverseVolWeights, minVarianceWeights, efficientFrontier,
} from './optimize.js';

function stock(ticker, prices) {
  return {
    ticker,
    priceHistory: prices.map((price, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      price,
    })),
  };
}

describe('returnMatrix', () => {
  it('aligns daily returns and falls back to the index when ticker is missing', () => {
    const { tickers, matrix } = returnMatrix([
      stock('AAA', [100, 110, 99]),
      { priceHistory: [{ date: '2024-01-01', price: 50 }, { date: '2024-01-02', price: 55 }, { date: '2024-01-03', price: 44 }] },
    ]);
    expect(tickers).toEqual(['AAA', '1']);
    expect(matrix).toHaveLength(2);
    expect(matrix[0][0]).toBeCloseTo(0.1, 10);
    expect(matrix[1][0]).toBeCloseTo(0.1, 10);
  });
});

describe('covariance', () => {
  it('is zeros when T < 2', () => {
    expect(covariance([[1], [2]])).toEqual([[0, 0], [0, 0]]);
  });

  it('matches sample variance on the diagonal', () => {
    const xs = [0.01, -0.02, 0.03];
    const C = covariance([xs]);
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const v = xs.reduce((s, x) => s + (x - mean) ** 2, 0) / (xs.length - 1);
    expect(C[0][0]).toBeCloseTo(v, 10);
  });
});

describe('inverseVolWeights', () => {
  it('sums to 1', () => {
    const w = inverseVolWeights([
      [0.01, -0.01, 0.02, -0.02],
      [0.001, -0.001, 0.002, -0.002],
    ]);
    expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    expect(w[1]).toBeGreaterThan(w[0]);
  });

  it('gives equal weight to two identical series', () => {
    const series = [0.01, -0.02, 0.015, 0, -0.005];
    const w = inverseVolWeights([series, [...series]]);
    expect(w[0]).toBeCloseTo(0.5, 10);
    expect(w[1]).toBeCloseTo(0.5, 10);
  });
});

describe('minVarianceWeights', () => {
  it('sums to 1', () => {
    const w = minVarianceWeights([
      [0.01, -0.02, 0.015, -0.005, 0.01],
      [0.002, 0.001, -0.003, 0.004, -0.001],
      [0.03, -0.01, 0.02, -0.025, 0.005],
    ]);
    expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });
});

describe('efficientFrontier', () => {
  it('returns finite risk and at least 2 points', () => {
    const matrix = [
      [0.01, -0.01, 0.02, -0.005, 0.015],
      [0.005, 0.001, -0.002, 0.004, 0.0],
      [-0.01, 0.02, 0.01, -0.015, 0.005],
    ];
    const pts = efficientFrontier(matrix, { points: 5 });
    expect(pts.length).toBe(5);
    for (const p of pts) {
      expect(Number.isFinite(p.risk)).toBe(true);
      expect(Number.isFinite(p.ret)).toBe(true);
      expect(p.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 8);
    }
  });
});
