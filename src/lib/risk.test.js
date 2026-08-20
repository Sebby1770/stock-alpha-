import { describe, it, expect } from 'vitest';
import { maxDrawdown, volatility, sharpe, herfindahl, equityReturns } from './risk.js';

describe('maxDrawdown', () => {
  it('is 0.25 for [100, 120, 90, 95]', () => {
    expect(maxDrawdown([100, 120, 90, 95])).toBe(0.25);
  });

  it('accepts { value } points', () => {
    expect(maxDrawdown([{ value: 100 }, { value: 120 }, { value: 90 }, { value: 95 }])).toBe(0.25);
  });

  it('is 0 for empty or rising series', () => {
    expect(maxDrawdown([])).toBe(0);
    expect(maxDrawdown([10, 11, 12])).toBe(0);
  });
});

describe('volatility', () => {
  it('is sample stdev', () => {
    // [1, 2, 3] mean 2, ss = 2, n-1 = 2 → 1
    expect(volatility([1, 2, 3])).toBeCloseTo(1, 10);
  });

  it('is 0 with fewer than 2 points', () => {
    expect(volatility([])).toBe(0);
    expect(volatility([1])).toBe(0);
  });
});

describe('sharpe', () => {
  it('annualizes mean / vol', () => {
    const rets = [0.01, 0.01, 0.01, 0.01];
    // vol = 0 → sharpe 0 (zero variance)
    expect(sharpe(rets)).toBe(0);
  });

  it('is finite on a mixed series', () => {
    const s = sharpe([0.01, -0.005, 0.002, 0.004, -0.001]);
    expect(Number.isFinite(s)).toBe(true);
  });
});

describe('herfindahl', () => {
  it('sums squared weights', () => {
    expect(herfindahl([0.5, 0.5])).toBeCloseTo(0.5, 10);
    expect(herfindahl([1])).toBe(1);
    expect(herfindahl([])).toBe(0);
  });
});

describe('equityReturns', () => {
  it('emits daily simple returns', () => {
    expect(equityReturns([100, 110, 99])).toEqual([0.1, (99 - 110) / 110]);
  });
});
