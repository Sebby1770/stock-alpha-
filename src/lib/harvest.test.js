import { describe, it, expect } from 'vitest';
import { harvestCandidates } from './harvest.js';

describe('harvestCandidates', () => {
  const priceOf = (t) => ({ LOSS: 90, WIN: 110, TINY: 96, DEEP: 70 }[t]);

  it('keeps lots that meet dollar and percent loss floors', () => {
    const rows = harvestCandidates(
      [
        { ticker: 'LOSS', shares: 10, entryPrice: 100 },
        { ticker: 'WIN', shares: 10, entryPrice: 100 },
        { ticker: 'TINY', shares: 1, entryPrice: 100 },
      ],
      priceOf,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].ticker).toBe('LOSS');
    expect(rows[0].loss).toBe(100);
    expect(rows[0].lossPct).toBeCloseTo(0.1, 10);
    expect(rows[0].price).toBe(90);
  });

  it('sorts by loss descending', () => {
    const rows = harvestCandidates(
      [
        { ticker: 'LOSS', shares: 10, entryPrice: 100 },
        { ticker: 'DEEP', shares: 10, entryPrice: 100 },
      ],
      priceOf,
    );
    expect(rows.map((r) => r.ticker)).toEqual(['DEEP', 'LOSS']);
    expect(rows[0].loss).toBeGreaterThan(rows[1].loss);
  });

  it('returns [] when nothing clears the 5% floor', () => {
    expect(harvestCandidates(
      [{ ticker: 'TINY', shares: 1, entryPrice: 100 }],
      priceOf,
    )).toEqual([]);
  });
});
