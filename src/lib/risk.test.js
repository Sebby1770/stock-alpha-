import { describe, it, expect } from 'vitest';
import {
  maxDrawdown, volatility, sharpe, herfindahl, equityReturns,
  downsideDeviation, sortino, calmar, beta, trackingError, informationRatio, monthlyReturns,
} from './risk.js';

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

describe('downsideDeviation', () => {
  it('is sample stdev of min(r − mar, 0)', () => {
    // [0, -0.1] mean -0.05, ss = 0.005, n-1 = 1 → √0.005
    expect(downsideDeviation([0.1, -0.1])).toBeCloseTo(Math.sqrt(0.005), 10);
  });

  it('is 0 with fewer than 2 returns or no downside', () => {
    expect(downsideDeviation([])).toBe(0);
    expect(downsideDeviation([0.01])).toBe(0);
    expect(downsideDeviation([0.01, 0.02, 0.03])).toBe(0);
  });
});

describe('sortino', () => {
  it('is 0 when downside deviation is 0', () => {
    expect(sortino([0.01, 0.01, 0.01])).toBe(0);
  });

  it('annualizes (mean − rf/periods) / downside × √periods', () => {
    const rets = [0.02, -0.01, 0.01, -0.02];
    const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
    const dd = downsideDeviation(rets);
    const expected = (mean / dd) * Math.sqrt(252);
    expect(sortino(rets)).toBeCloseTo(expected, 10);
  });
});

describe('calmar', () => {
  it('is annualized return over max drawdown', () => {
    const curve = [100, 120, 90, 95];
    const dd = 0.25;
    const ann = (95 / 100) ** (252 / 3) - 1;
    expect(calmar(curve)).toBeCloseTo(ann / dd, 10);
  });

  it('is 0 when max drawdown is 0 or the curve is empty', () => {
    expect(calmar([])).toBe(0);
    expect(calmar([10, 11, 12])).toBe(0);
  });
});

describe('beta', () => {
  it('is 2 when the asset is a 2× scaled benchmark', () => {
    const bench = [0.01, -0.01, 0.02, -0.02, 0.005];
    const asset = bench.map((x) => 2 * x);
    expect(beta(asset, bench)).toBeCloseTo(2, 10);
  });

  it('is 0 when benchmark variance is 0', () => {
    expect(beta([0.01, 0.02, 0.03], [0.01, 0.01, 0.01])).toBe(0);
  });
});

describe('trackingError', () => {
  it('is 0 when the series match', () => {
    const xs = [0.01, -0.005, 0.002];
    expect(trackingError(xs, xs)).toBe(0);
  });

  it('annualizes sample stdev of the difference', () => {
    const asset = [0.02, -0.01, 0.01];
    const bench = [0.01, 0.00, 0.00];
    const diffs = [0.01, -0.01, 0.01];
    const te = volatility(diffs) * Math.sqrt(252);
    expect(trackingError(asset, bench)).toBeCloseTo(te, 10);
  });
});

describe('informationRatio', () => {
  it('is mean excess / stdev excess × √periods', () => {
    const asset = [0.02, -0.01, 0.015, 0.00];
    const bench = [0.01, 0.00, 0.005, -0.005];
    const diffs = asset.map((x, i) => x - bench[i]);
    const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const vol = volatility(diffs);
    expect(informationRatio(asset, bench)).toBeCloseTo((mean / vol) * Math.sqrt(252), 10);
  });

  it('is 0 when tracking error is 0', () => {
    expect(informationRatio([0.01, 0.02], [0.01, 0.02])).toBe(0);
  });
});

describe('monthlyReturns', () => {
  it('groups { date, value } by YYYY-MM using first and last', () => {
    const curve = [
      { date: '2024-01-02', value: 100 },
      { date: '2024-01-31', value: 110 },
      { date: '2024-02-01', value: 110 },
      { date: '2024-02-29', value: 99 },
    ];
    const rows = monthlyReturns(curve);
    expect(rows).toHaveLength(2);
    expect(rows[0].month).toBe('2024-01');
    expect(rows[0].ret).toBeCloseTo(0.1, 10);
    expect(rows[1].month).toBe('2024-02');
    expect(rows[1].ret).toBeCloseTo(99 / 110 - 1, 10);
  });

  it('accepts { date, price } and skips months with fewer than 2 points', () => {
    const curve = [
      { date: '2024-01-15', price: 100 },
      { date: '2024-02-01', price: 100 },
      { date: '2024-02-28', price: 120 },
    ];
    const rows = monthlyReturns(curve);
    expect(rows).toHaveLength(1);
    expect(rows[0].month).toBe('2024-02');
    expect(rows[0].ret).toBeCloseTo(0.2, 10);
  });

  it('returns [] for a numeric series', () => {
    expect(monthlyReturns([100, 110, 120])).toEqual([]);
  });
});
