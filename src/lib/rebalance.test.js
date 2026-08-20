import { describe, it, expect } from 'vitest';
import { planRebalance } from './rebalance.js';

describe('planRebalance', () => {
  it('two equal lots at the same price in equal mode produce nearly zero trades', () => {
    const plan = planRebalance({
      holdings: [
        { ticker: 'AAA', shares: 10 },
        { ticker: 'BBB', shares: 10 },
      ],
      cash: 0,
      prices: { AAA: 10, BBB: 10 },
      scores: { AAA: 3, BBB: 3 },
      mode: 'equal',
    });
    expect(plan.trades).toHaveLength(0);
    expect(plan.turnover).toBe(0);
  });

  it('one overweight lot produces a sell', () => {
    const plan = planRebalance({
      holdings: [
        { ticker: 'AAA', shares: 15 },
        { ticker: 'BBB', shares: 5 },
      ],
      cash: 0,
      prices: { AAA: 10, BBB: 10 },
      mode: 'equal',
    });
    const sellAaa = plan.trades.find((t) => t.ticker === 'AAA' && t.side === 'sell');
    expect(sellAaa).toBeTruthy();
    expect(sellAaa.shares).toBeCloseTo(5, 2);
    expect(sellAaa.value).toBeGreaterThanOrEqual(1);
    const buyBbb = plan.trades.find((t) => t.ticker === 'BBB' && t.side === 'buy');
    expect(buyBbb).toBeTruthy();
  });

  it('ignores sub-dollar tickets and rounds shares to 2 decimals', () => {
    const plan = planRebalance({
      holdings: [{ ticker: 'AAA', shares: 1 }],
      cash: 0.4,
      prices: { AAA: 10 },
      mode: 'equal',
    });
    expect(plan.trades.every((t) => t.value >= 1)).toBe(true);
    for (const t of plan.trades) {
      expect(t.shares).toBe(Math.round(t.shares * 100) / 100);
    }
  });
});
