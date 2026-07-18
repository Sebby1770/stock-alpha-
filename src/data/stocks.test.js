import { describe, expect, it } from 'vitest';
import { DATA_SNAPSHOT } from './metadata';
import { calcQuantScore, generatePriceHistory, stocks } from './stocks';

describe('simulated stock snapshot invariants', () => {
  it('keeps current quotes aligned with the disclosed snapshot and 52-week range', () => {
    for (const stock of stocks) {
      const latest = stock.priceHistory.at(-1);
      expect(latest.date, stock.ticker).toBe(DATA_SNAPSHOT.date);
      expect(stock.price, stock.ticker).toBe(latest.price);
      expect(stock.price, stock.ticker).toBeGreaterThanOrEqual(stock.weekLow52);
      expect(stock.price, stock.ticker).toBeLessThanOrEqual(stock.weekHigh52);
      expect(stock.weekLow52, stock.ticker).toBeLessThanOrEqual(
        Math.min(...stock.priceHistory.map((point) => point.low)),
      );
      expect(stock.weekHigh52, stock.ticker).toBeGreaterThanOrEqual(
        Math.max(...stock.priceHistory.map((point) => point.high)),
      );
    }
  });

  it('derives every displayed quant score from the documented factor weights', () => {
    for (const stock of stocks) {
      expect(stock.quantScore, stock.ticker).toBe(
        Math.round(calcQuantScore(stock.factors) * 100) / 100,
      );
    }
  });

  it('generates deterministic price histories for repeatable demos and tests', () => {
    expect(generatePriceHistory(100, 'TEST', 10)).toEqual(
      generatePriceHistory(100, 'TEST', 10),
    );
  });
});
