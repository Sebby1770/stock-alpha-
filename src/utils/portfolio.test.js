import { describe, expect, it } from 'vitest';
import {
  addPosition,
  buildAllocation,
  buildEquityCurve,
  buildPortfolioHoldings,
  getPortfolioSummary,
  sanitizePositions,
  updatePosition,
  validatePosition,
} from './portfolio';

const stock = (overrides = {}) => ({
  ticker: 'AAA',
  price: 20,
  change: 2,
  quantScore: 4,
  sector: 'Technology',
  factors: { value: 3, growth: 4, momentum: 5, profitability: 4, revisions: 3 },
  priceHistory: [
    { date: '2026-01-01', price: 10 },
    { date: '2026-01-02', price: 20 },
  ],
  ...overrides,
});

describe('portfolio position validation', () => {
  it('normalizes valid inputs and reports invalid fields', () => {
    expect(validatePosition(
      { ticker: ' aaa ', shares: '2.5', entryPrice: '10' },
      ['AAA'],
    )).toEqual({
      valid: true,
      errors: {},
      value: { ticker: 'AAA', shares: 2.5, entryPrice: 10 },
    });

    const invalid = validatePosition({ ticker: 'ZZZ', shares: 0, entryPrice: -1 }, ['AAA']);
    expect(invalid.valid).toBe(false);
    expect(invalid.errors).toEqual({
      ticker: 'ZZZ is not in the research universe.',
      shares: 'Shares must be greater than zero.',
      entryPrice: 'Entry price must be greater than zero.',
    });
  });

  it('drops corrupt records and combines duplicate lots by weighted entry price', () => {
    const result = sanitizePositions([
      { ticker: 'AAA', shares: 2, entryPrice: 10 },
      { ticker: 'aaa', shares: 1, entryPrice: 16 },
      { ticker: 'BBB', shares: -5, entryPrice: 4 },
    ], ['AAA', 'BBB']);

    expect(result).toEqual([{ ticker: 'AAA', shares: 3, entryPrice: 12 }]);
  });
});

describe('portfolio position mutations', () => {
  it('adds to an existing position using weighted average cost', () => {
    expect(addPosition(
      [{ ticker: 'AAA', shares: 2, entryPrice: 10 }],
      { ticker: 'AAA', shares: 3, entryPrice: 20 },
    )).toEqual([{ ticker: 'AAA', shares: 5, entryPrice: 16 }]);
  });

  it('updates a position without mutating other entries', () => {
    const result = updatePosition([
      { ticker: 'AAA', shares: 2, entryPrice: 10 },
      { ticker: 'BBB', shares: 5, entryPrice: 4 },
    ], 'AAA', { shares: 8, entryPrice: 12 });

    expect(result).toEqual([
      { ticker: 'AAA', shares: 8, entryPrice: 12 },
      { ticker: 'BBB', shares: 5, entryPrice: 4 },
    ]);
  });
});

describe('portfolio analytics', () => {
  it('calculates value-weighted totals, quality, sectors, and factors', () => {
    const holdings = buildPortfolioHoldings([
      { ticker: 'AAA', shares: 2, entryPrice: 10 },
      { ticker: 'BBB', shares: 1, entryPrice: 30 },
    ], [
      stock(),
      stock({
        ticker: 'BBB',
        price: 60,
        change: -3,
        quantScore: 2,
        sector: 'Healthcare',
        factors: { value: 5, growth: 2, momentum: 1, profitability: 3, revisions: 4 },
      }),
    ]);
    const summary = getPortfolioSummary(holdings);

    expect(summary.totalValue).toBe(100);
    expect(summary.totalCost).toBe(50);
    expect(summary.totalGainPct).toBe(100);
    expect(summary.dailyPnL).toBe(1);
    expect(summary.weightedQuantScore).toBeCloseTo(2.8);
    expect(summary.factorScores.value).toBeCloseTo(4.2);
    expect(summary.sectors.map(({ name, weight }) => [name, weight])).toEqual([
      ['Healthcare', 60],
      ['Technology', 40],
    ]);
    expect(summary.largestPosition.ticker).toBe('BBB');
    expect(summary.largestWeight).toBe(60);
  });

  it('returns finite zero metrics for an empty portfolio', () => {
    expect(getPortfolioSummary([])).toMatchObject({
      totalValue: 0,
      totalCost: 0,
      totalGain: 0,
      totalGainPct: 0,
      weightedQuantScore: 0,
      largestPosition: null,
      largestWeight: 0,
    });
    expect(buildAllocation([])).toEqual([]);
    expect(buildEquityCurve([])).toEqual([]);
  });

  it('aligns equity history by date instead of treating missing quotes as zero', () => {
    const holdings = buildPortfolioHoldings([
      { ticker: 'AAA', shares: 2, entryPrice: 10 },
      { ticker: 'BBB', shares: 1, entryPrice: 10 },
    ], [
      stock(),
      stock({
        ticker: 'BBB',
        price: 30,
        priceHistory: [
          { date: '2026-01-02', price: 30 },
          { date: '2026-01-03', price: 40 },
        ],
      }),
    ]);

    expect(buildEquityCurve(holdings)).toEqual([
      { date: '2026-01-02', value: 70 },
    ]);
  });
});
