import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DATA_AS_OF,
  calcQuantScore,
  generatePriceHistory,
  gradeFromScore,
  stocks,
} from '../src/data/stocks.js';
import {
  buildHoldings,
  calculatePortfolioAnalytics,
  MAX_SHARES,
  sanitizePositions,
  sanitizeWatchlist,
} from '../src/lib/portfolio.js';

test('price histories are deterministic, complete, and anchored to the quote', () => {
  const first = generatePriceHistory(123.45, 'TEST', 252);
  const second = generatePriceHistory(123.45, 'TEST', 252);

  assert.deepEqual(first, second);
  assert.equal(first.length, 252);
  assert.equal(first.at(-1).date, DATA_AS_OF);
  assert.equal(first.at(-1).price, 123.45);
  assert.ok(first.every((point) => point.low > 0 && point.high >= point.price));
  stocks.forEach((stock) => {
    assert.equal(stock.priceHistory.length, 252);
    assert.equal(stock.weekHigh52, Math.max(...stock.priceHistory.map((point) => point.high)));
    assert.equal(stock.weekLow52, Math.min(...stock.priceHistory.map((point) => point.low)));
  });
});

test('quant score uses documented weights and grade boundaries', () => {
  const score = calcQuantScore({ value: 4, growth: 5, momentum: 3, profitability: 4, revisions: 2 });
  assert.equal(score, 3.75);
  assert.equal(gradeFromScore(4.7), 'A+');
  assert.equal(gradeFromScore(3.8), 'A-');
  assert.equal(gradeFromScore(0.49), 'F');
});

test('persisted workspace input is sanitized and duplicate positions are combined', () => {
  const positions = sanitizePositions([
    { ticker: 'nvda', shares: 2, entryPrice: 100 },
    { ticker: 'NVDA', shares: 1, entryPrice: 160 },
    { ticker: 'NOPE', shares: 1, entryPrice: 5 },
    { ticker: 'MSFT', shares: -2, entryPrice: 100 },
    { ticker: 'META', shares: 1e308, entryPrice: 1e308 },
  ], stocks.map((stock) => stock.ticker));

  assert.equal(positions.length, 1);
  assert.equal(positions[0].ticker, 'NVDA');
  assert.equal(positions[0].shares, 3);
  assert.equal(positions[0].entryPrice, 120);
  assert.deepEqual(sanitizeWatchlist(['nvda', 'NVDA', 'NOPE'], stocks.map((stock) => stock.ticker)), ['NVDA']);

  const boundedDuplicate = sanitizePositions([
    { ticker: 'NVDA', shares: MAX_SHARES, entryPrice: 100 },
    { ticker: 'NVDA', shares: 1, entryPrice: 200 },
  ], stocks.map((stock) => stock.ticker));
  assert.equal(boundedDuplicate[0].shares, MAX_SHARES);
  assert.equal(boundedDuplicate[0].entryPrice, 100);
});

test('portfolio analytics are value weighted and remain finite for empty portfolios', () => {
  const holdings = buildHoldings([
    { ticker: 'NVDA', shares: 2, entryPrice: 500 },
    { ticker: 'MSFT', shares: 1, entryPrice: 300 },
  ], stocks);
  const analytics = calculatePortfolioAnalytics(holdings);

  assert.equal(holdings.length, 2);
  assert.ok(analytics.totalValue > 0);
  assert.ok(analytics.equityCurve.length >= 252);
  assert.ok(analytics.weightedQuantScore >= 0 && analytics.weightedQuantScore <= 5);
  assert.ok(Number.isFinite(analytics.annualizedVolatility));
  assert.ok(analytics.maxDrawdown <= 0);

  const empty = calculatePortfolioAnalytics([]);
  assert.equal(empty.totalValue, 0);
  assert.equal(empty.weightedQuantScore, 0);
  assert.equal(empty.annualizedVolatility, 0);
});
