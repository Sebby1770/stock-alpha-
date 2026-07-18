import { describe, expect, it } from 'vitest';
import { stocks } from '../data/stocks';
import {
  buildHistoricalScenario,
  getSignalScore,
  rankSignalCandidates,
} from './analytics';

describe('signal model', () => {
  it('keeps scores calibrated instead of saturating the leaderboard', () => {
    const scores = stocks.map(getSignalScore);
    const roundedScores = new Set(scores.map((score) => score.toFixed(1)));

    expect(Math.max(...scores)).toBeLessThan(90);
    expect(Math.min(...scores)).toBeGreaterThanOrEqual(0);
    expect(scores.filter((score) => score === 100)).toHaveLength(0);
    expect(roundedScores.size).toBeGreaterThanOrEqual(20);
  });

  it('uses ticker order as a deterministic tie-breaker', () => {
    const source = stocks[0];
    const tied = [
      { ...source, ticker: 'ZZZ' },
      { ...source, ticker: 'AAA' },
    ];

    expect(rankSignalCandidates(tied).map((stock) => stock.ticker)).toEqual(['AAA', 'ZZZ']);
    expect(rankSignalCandidates([...tied].reverse()).map((stock) => stock.ticker)).toEqual(['AAA', 'ZZZ']);
  });
});

describe('historical scenario', () => {
  it('is explicitly marked as a hindsight illustration rather than a backtest', () => {
    const result = buildHistoricalScenario(stocks, 'balanced', 5);

    expect(result.isBacktest).toBe(false);
    expect(result.methodology).toMatch(/current snapshot/i);
    expect(result.methodology).toMatch(/not a time-causal backtest/i);
    expect(result.holdings).toHaveLength(5);
    expect(result.curve.length).toBeGreaterThan(1);
  });

  it('handles an empty universe without throwing or returning non-finite values', () => {
    expect(buildHistoricalScenario([], 'balanced')).toEqual({
      curve: [],
      holdings: [],
      totalReturn: 0,
      bestHolding: null,
      isBacktest: false,
      methodology: 'Current snapshot ranking replayed over simulated history; not a time-causal backtest.',
    });
  });
});
