import { describe, it, expect } from 'vitest';
import { factorAttribution } from './attribution.js';
import { FACTOR_KEYS } from './quant.js';

const universe = [
  { ticker: 'AAA', price: 10, factors: { value: 5, growth: 1, momentum: 1, profitability: 1, revisions: 1 } },
  { ticker: 'BBB', price: 10, factors: { value: 1, growth: 5, momentum: 1, profitability: 1, revisions: 1 } },
];

describe('factorAttribution', () => {
  it('value-weights holdings vs equal-weight universe', () => {
    const holdings = [
      { ticker: 'AAA', shares: 3 },
      { ticker: 'BBB', shares: 1 },
    ];
    const px = (t) => 10;
    const { portfolio, universe: uni, delta } = factorAttribution(holdings, universe, px);

    // Universe equal-weight value = (5+1)/2 = 3
    expect(uni.value).toBe(3);
    // Portfolio MV: AAA 30, BBB 10 → value = 0.75*5 + 0.25*1 = 4
    expect(portfolio.value).toBe(4);
    expect(delta.value).toBe(1);

    for (const k of FACTOR_KEYS) {
      expect(Number.isFinite(portfolio[k])).toBe(true);
      expect(Number.isFinite(uni[k])).toBe(true);
      expect(Number.isFinite(delta[k])).toBe(true);
    }
  });
});
