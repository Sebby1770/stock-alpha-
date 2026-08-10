import { describe, it, expect } from 'vitest';
import {
  FACTOR_WEIGHTS,
  FACTOR_KEYS,
  GRADES,
  GRADE_THRESHOLDS,
  gradeFromScore,
  calcQuantScore,
  scoreStock,
  filterScreener,
  sortStocks,
  meetsMinGrade,
  compareGrades,
  stocksToCsv,
} from './quant.js';

describe('FACTOR_WEIGHTS', () => {
  it('sums to 1.0', () => {
    const sum = Object.values(FACTOR_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it('matches documented allocation', () => {
    expect(FACTOR_WEIGHTS.value).toBe(0.2);
    expect(FACTOR_WEIGHTS.growth).toBe(0.25);
    expect(FACTOR_WEIGHTS.momentum).toBe(0.2);
    expect(FACTOR_WEIGHTS.profitability).toBe(0.2);
    expect(FACTOR_WEIGHTS.revisions).toBe(0.15);
  });
});

describe('calcQuantScore', () => {
  it('computes weighted composite', () => {
    const factors = {
      value: 5,
      growth: 5,
      momentum: 5,
      profitability: 5,
      revisions: 5,
    };
    expect(calcQuantScore(factors)).toBe(5);
  });

  it('weights growth highest', () => {
    const highGrowth = calcQuantScore({
      value: 0, growth: 5, momentum: 0, profitability: 0, revisions: 0,
    });
    const highValue = calcQuantScore({
      value: 5, growth: 0, momentum: 0, profitability: 0, revisions: 0,
    });
    expect(highGrowth).toBe(1.25); // 5 * 0.25
    expect(highValue).toBe(1); // 5 * 0.20
    expect(highGrowth).toBeGreaterThan(highValue);
  });

  it('matches hand-calculated NVDA-like factors', () => {
    // 2.1*0.2 + 5*0.25 + 4.9*0.2 + 5*0.2 + 5*0.15
    // = 0.42 + 1.25 + 0.98 + 1.0 + 0.75 = 4.40
    const score = calcQuantScore({
      value: 2.1, growth: 5.0, momentum: 4.9, profitability: 5.0, revisions: 5.0,
    });
    expect(score).toBe(4.4);
  });

  it('returns 0 for empty factors', () => {
    expect(calcQuantScore({})).toBe(0);
    expect(calcQuantScore()).toBe(0);
  });

  it('rounds to 2 decimals', () => {
    const score = calcQuantScore({
      value: 1, growth: 1, momentum: 1, profitability: 1, revisions: 1,
    });
    expect(score).toBe(1);
  });
});

describe('gradeFromScore', () => {
  const cases = [
    [5.0, 'A+'],
    [4.7, 'A+'],
    [4.69, 'A'],
    [4.3, 'A'],
    [4.29, 'A-'],
    [3.8, 'A-'],
    [3.79, 'B+'],
    [3.4, 'B+'],
    [3.39, 'B'],
    [2.9, 'B'],
    [2.89, 'B-'],
    [2.4, 'B-'],
    [2.39, 'C+'],
    [2.0, 'C+'],
    [1.99, 'C'],
    [1.5, 'C'],
    [1.49, 'C-'],
    [1.0, 'C-'],
    [0.99, 'D'],
    [0.5, 'D'],
    [0.49, 'F'],
    [0, 'F'],
    [-1, 'F'],
  ];

  it.each(cases)('score %s → grade %s', (score, grade) => {
    expect(gradeFromScore(score)).toBe(grade);
  });

  it('handles non-finite as F', () => {
    expect(gradeFromScore(NaN)).toBe('F');
    expect(gradeFromScore(undefined)).toBe('F');
    expect(gradeFromScore(null)).toBe('F');
  });

  it('thresholds cover A+ through F', () => {
    const grades = GRADE_THRESHOLDS.map((t) => t.grade);
    expect(grades).toContain('A+');
    expect(grades).toContain('F');
    expect(GRADES.length).toBeGreaterThanOrEqual(11);
  });
});

describe('scoreStock', () => {
  it('returns score + grade without mutating input', () => {
    const stock = {
      ticker: 'TEST',
      factors: { value: 4, growth: 4, momentum: 4, profitability: 4, revisions: 4 },
    };
    const result = scoreStock(stock);
    expect(result.quantScore).toBe(4);
    // 4.0 is ≥ 3.8 → A- (A requires ≥ 4.3)
    expect(result.quantGrade).toBe('A-');
    expect(stock.quantScore).toBeUndefined();
  });

  it('handles missing factors', () => {
    const result = scoreStock({});
    expect(result.quantScore).toBe(0);
    expect(result.quantGrade).toBe('F');
  });
});

describe('meetsMinGrade / compareGrades', () => {
  it('A+ meets min A', () => {
    expect(meetsMinGrade('A+', 'A')).toBe(true);
    expect(meetsMinGrade('B', 'A')).toBe(false);
    expect(meetsMinGrade('A', 'All')).toBe(true);
  });

  it('compareGrades orders best first as negative', () => {
    expect(compareGrades('A+', 'B')).toBeLessThan(0);
    expect(compareGrades('F', 'A')).toBeGreaterThan(0);
    expect(compareGrades('B', 'B')).toBe(0);
  });
});

const sampleStocks = [
  {
    ticker: 'AAA', name: 'Alpha Co', sector: 'Technology', marketCap: 500e9,
    quantScore: 4.5, quantGrade: 'A', price: 100, pe: 20, dividendYield: 1,
    factors: { value: 4, growth: 5, momentum: 4, profitability: 4, revisions: 4 },
  },
  {
    ticker: 'BBB', name: 'Beta Inc', sector: 'Healthcare', marketCap: 50e9,
    quantScore: 2.5, quantGrade: 'B-', price: 50, pe: 15, dividendYield: 2,
    factors: { value: 3, growth: 2, momentum: 2, profitability: 3, revisions: 2 },
  },
  {
    ticker: 'CCC', name: 'Gamma LLC', sector: 'Technology', marketCap: 5e9,
    quantScore: 1.2, quantGrade: 'C-', price: 10, pe: 40, dividendYield: 0,
    factors: { value: 1, growth: 1, momentum: 1, profitability: 2, revisions: 1 },
  },
];

describe('filterScreener', () => {
  it('returns all with empty filters', () => {
    expect(filterScreener(sampleStocks, {}).length).toBe(3);
  });

  it('filters by query ticker/name', () => {
    expect(filterScreener(sampleStocks, { query: 'aaa' })).toHaveLength(1);
    expect(filterScreener(sampleStocks, { query: 'beta' })[0].ticker).toBe('BBB');
    expect(filterScreener(sampleStocks, { query: 'zzz' })).toHaveLength(0);
  });

  it('filters by sector', () => {
    expect(filterScreener(sampleStocks, { sector: 'Technology' })).toHaveLength(2);
    expect(filterScreener(sampleStocks, { sector: 'Energy' })).toHaveLength(0);
  });

  it('filters by market cap range', () => {
    expect(filterScreener(sampleStocks, { minMarketCap: 100e9 })).toHaveLength(1);
    expect(filterScreener(sampleStocks, { maxMarketCap: 10e9 })).toHaveLength(1);
  });

  it('filters by min grade', () => {
    expect(filterScreener(sampleStocks, { minGrade: 'B-' })).toHaveLength(2);
    expect(filterScreener(sampleStocks, { minGrade: 'A' })).toHaveLength(1);
  });

  it('filters by min score', () => {
    expect(filterScreener(sampleStocks, { minScore: 4 })).toHaveLength(1);
    expect(filterScreener(sampleStocks, { minScore: 3 })).toHaveLength(1);
  });

  it('filters by ticker whitelist', () => {
    expect(filterScreener(sampleStocks, { tickers: ['BBB', 'CCC'] })).toHaveLength(2);
  });
});

describe('sortStocks', () => {
  it('sorts by quantScore desc by default', () => {
    const sorted = sortStocks(sampleStocks, 'quantScore', 'desc');
    expect(sorted.map((s) => s.ticker)).toEqual(['AAA', 'BBB', 'CCC']);
  });

  it('sorts by quantScore asc', () => {
    const sorted = sortStocks(sampleStocks, 'quantScore', 'asc');
    expect(sorted.map((s) => s.ticker)).toEqual(['CCC', 'BBB', 'AAA']);
  });

  it('sorts by factor key', () => {
    const sorted = sortStocks(sampleStocks, 'growth', 'desc');
    expect(sorted[0].ticker).toBe('AAA');
  });

  it('sorts by grade best-first on desc', () => {
    const sorted = sortStocks(sampleStocks, 'quantGrade', 'desc');
    expect(sorted[0].quantGrade).toBe('A');
    expect(sorted[sorted.length - 1].quantGrade).toBe('C-');
  });

  it('does not mutate original array', () => {
    const copy = [...sampleStocks];
    sortStocks(sampleStocks, 'price', 'asc');
    expect(sampleStocks.map((s) => s.ticker)).toEqual(copy.map((s) => s.ticker));
  });
});

describe('stocksToCsv', () => {
  it('includes header and rows', () => {
    const csv = stocksToCsv(sampleStocks.slice(0, 1));
    const lines = csv.split('\n');
    expect(lines[0]).toContain('ticker');
    expect(lines[1]).toContain('AAA');
    expect(lines[1]).toContain('Technology');
  });

  it('escapes commas in fields', () => {
    const csv = stocksToCsv([
      { ...sampleStocks[0], name: 'Alpha, Co' },
    ]);
    expect(csv).toContain('"Alpha, Co"');
  });
});

describe('FACTOR_KEYS', () => {
  it('has five factors', () => {
    expect(FACTOR_KEYS).toEqual([
      'value', 'growth', 'momentum', 'profitability', 'revisions',
    ]);
  });
});
