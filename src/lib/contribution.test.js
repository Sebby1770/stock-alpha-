import { describe, it, expect } from 'vitest';
import { holdingContribution } from './contribution.js';

describe('holdingContribution', () => {
  it('winner has positive shareOfPnl when total pnl > 0', () => {
    const holdings = [
      { ticker: 'WIN', shares: 10, entryPrice: 10 },
      { ticker: 'LOS', shares: 10, entryPrice: 10 },
    ];
    const priceOf = (t) => (t === 'WIN' ? 20 : 5);
    const rows = holdingContribution(holdings, priceOf);
    const totalPnl = rows.reduce((s, r) => s + r.pnl, 0);
    expect(totalPnl).toBeGreaterThan(0);
    expect(rows[0].ticker).toBe('WIN');
    expect(rows[0].pnl).toBeGreaterThan(0);
    expect(rows[0].shareOfPnl).toBeGreaterThan(0);
    expect(rows.find((r) => r.ticker === 'LOS').pnl).toBeLessThan(0);
  });

  it('sorts by pnl descending', () => {
    const rows = holdingContribution(
      [
        { ticker: 'B', shares: 1, entryPrice: 10 },
        { ticker: 'A', shares: 1, entryPrice: 10 },
      ],
      { A: 12, B: 11 },
    );
    expect(rows.map((r) => r.ticker)).toEqual(['A', 'B']);
  });
});
