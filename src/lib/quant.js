/**
 * AlphaRank pure quant engine.
 * Factor model + grading + screener utilities. No I/O, no React.
 */

/** Factor weights sum to 1.0 */
export const FACTOR_WEIGHTS = {
  value: 0.2,
  growth: 0.25,
  momentum: 0.2,
  profitability: 0.2,
  revisions: 0.15,
};

export const FACTOR_KEYS = Object.keys(FACTOR_WEIGHTS);

export const FACTOR_META = {
  value: {
    label: 'Value',
    weight: FACTOR_WEIGHTS.value,
    description: 'Valuation multiples: P/E, P/S, P/B, EV/EBITDA. Higher = cheaper relative to fundamentals.',
  },
  growth: {
    label: 'Growth',
    weight: FACTOR_WEIGHTS.growth,
    description: 'Top- and bottom-line expansion: revenue growth, EPS growth, and FCF trajectory.',
  },
  momentum: {
    label: 'Momentum',
    weight: FACTOR_WEIGHTS.momentum,
    description: 'Price momentum over 1M / 3M / 6M windows. Captures trend and relative strength.',
  },
  profitability: {
    label: 'Profitability',
    weight: FACTOR_WEIGHTS.profitability,
    description: 'Quality of earnings: ROE, gross margin, and operating margin.',
  },
  revisions: {
    label: 'Revisions',
    weight: FACTOR_WEIGHTS.revisions,
    description: 'Direction of EPS estimate revisions — upward revisions signal improving consensus.',
  },
};

/** Ordered best → worst for grade comparisons */
export const GRADES = [
  'A+', 'A', 'A-',
  'B+', 'B', 'B-',
  'C+', 'C', 'C-',
  'D', 'F',
];

export const GRADE_ORDER = Object.fromEntries(GRADES.map((g, i) => [g, i]));

/** Grade thresholds: first matching (score >= threshold) wins */
export const GRADE_THRESHOLDS = [
  { grade: 'A+', min: 4.7 },
  { grade: 'A', min: 4.3 },
  { grade: 'A-', min: 3.8 },
  { grade: 'B+', min: 3.4 },
  { grade: 'B', min: 2.9 },
  { grade: 'B-', min: 2.4 },
  { grade: 'C+', min: 2.0 },
  { grade: 'C', min: 1.5 },
  { grade: 'C-', min: 1.0 },
  { grade: 'D', min: 0.5 },
  { grade: 'F', min: 0 },
];

/**
 * Map a composite quant score (0–5) to a letter grade.
 * @param {number} score
 * @returns {string}
 */
export function gradeFromScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return 'F';
  for (const { grade, min } of GRADE_THRESHOLDS) {
    if (n >= min) return grade;
  }
  return 'F';
}

/**
 * Weighted composite score from factor object.
 * Weights: Value 20%, Growth 25%, Momentum 20%, Profitability 20%, Revisions 15%.
 * @param {{ value: number, growth: number, momentum: number, profitability: number, revisions: number }} factors
 * @returns {number} rounded to 2 decimals
 */
export function calcQuantScore(factors = {}) {
  let total = 0;
  let weightSum = 0;
  for (const key of FACTOR_KEYS) {
    const w = FACTOR_WEIGHTS[key];
    const v = Number(factors[key]);
    if (Number.isFinite(v)) {
      total += v * w;
      weightSum += w;
    }
  }
  if (weightSum === 0) return 0;
  // Normalize if some factors missing
  const score = weightSum < 1 ? total / weightSum : total;
  return Math.round(score * 100) / 100;
}

/**
 * Score a stock object: returns quantScore + quantGrade (+ optional factors passthrough).
 * Pure — does not mutate input.
 * @param {object} stock - must include `factors` map
 * @returns {{ quantScore: number, quantGrade: string, factors: object }}
 */
export function scoreStock(stock) {
  const factors = stock?.factors ?? {};
  const quantScore = calcQuantScore(factors);
  const quantGrade = gradeFromScore(quantScore);
  return { quantScore, quantGrade, factors };
}

/**
 * Compare two grades: negative if a is better, positive if b is better, 0 if equal.
 * Lower GRADE_ORDER index = better grade.
 */
export function compareGrades(a, b) {
  const ao = GRADE_ORDER[a] ?? 99;
  const bo = GRADE_ORDER[b] ?? 99;
  return ao - bo;
}

/**
 * True if stockGrade is at least as good as minGrade (e.g. A+ is better than B).
 */
export function meetsMinGrade(stockGrade, minGrade) {
  if (!minGrade || minGrade === 'All') return true;
  return (GRADE_ORDER[stockGrade] ?? 99) <= (GRADE_ORDER[minGrade] ?? 99);
}

/**
 * Filter stocks by screener criteria.
 * @param {Array} stocks
 * @param {object} filters
 * @param {string} [filters.query]
 * @param {string} [filters.sector] - 'All' or sector name
 * @param {number} [filters.minMarketCap]
 * @param {number} [filters.maxMarketCap]
 * @param {string} [filters.minGrade]
 * @param {number} [filters.minScore]
 * @param {string[]} [filters.tickers] - whitelist
 * @returns {Array}
 */
export function filterScreener(stocks, filters = {}) {
  const {
    query = '',
    sector = 'All',
    minMarketCap = 0,
    maxMarketCap = Infinity,
    minGrade = 'All',
    minScore = 0,
    tickers = null,
  } = filters;

  const q = String(query).trim().toLowerCase();
  const tickerSet = tickers ? new Set(tickers.map((t) => String(t).toUpperCase())) : null;

  return stocks.filter((s) => {
    if (tickerSet && !tickerSet.has(s.ticker?.toUpperCase())) return false;

    if (q) {
      const ticker = (s.ticker ?? '').toLowerCase();
      const name = (s.name ?? '').toLowerCase();
      if (!ticker.includes(q) && !name.includes(q)) return false;
    }

    if (sector && sector !== 'All' && s.sector !== sector) return false;

    const mcap = Number(s.marketCap) || 0;
    if (mcap < minMarketCap || mcap > maxMarketCap) return false;

    if (!meetsMinGrade(s.quantGrade, minGrade)) return false;

    if (Number(s.quantScore) < Number(minScore)) return false;

    return true;
  });
}

/**
 * Sort stocks by key and direction.
 * @param {Array} stocks
 * @param {string} sortKey - field or factor name
 * @param {'asc'|'desc'} [sortDir='desc']
 * @returns {Array} new sorted array
 */
export function sortStocks(stocks, sortKey = 'quantScore', sortDir = 'desc') {
  const factorKeys = FACTOR_KEYS;
  const dir = sortDir === 'asc' ? 1 : -1;

  return [...stocks].sort((a, b) => {
    let av;
    let bv;

    if (sortKey === 'quantGrade') {
      av = GRADE_ORDER[a.quantGrade] ?? 99;
      bv = GRADE_ORDER[b.quantGrade] ?? 99;
      // lower grade order = better, so invert for natural "desc = best first"
      return sortDir === 'asc' ? bv - av : av - bv;
    }

    if (factorKeys.includes(sortKey)) {
      av = a.factors?.[sortKey] ?? 0;
      bv = b.factors?.[sortKey] ?? 0;
    } else {
      av = a[sortKey];
      bv = b[sortKey];
    }

    if (typeof av === 'string' || typeof bv === 'string') {
      return dir * String(av ?? '').localeCompare(String(bv ?? ''));
    }

    const na = Number(av) || 0;
    const nb = Number(bv) || 0;
    return dir * (na - nb);
  });
}

/**
 * Build CSV string from stocks for export.
 * @param {Array} stocks
 * @param {string[]} [columns]
 * @returns {string}
 */
export function stocksToCsv(stocks, columns = null) {
  const cols = columns ?? [
    'ticker', 'name', 'sector', 'price', 'changePercent',
    'quantGrade', 'quantScore',
    'value', 'growth', 'momentum', 'profitability', 'revisions',
    'marketCap', 'pe', 'dividendYield',
  ];

  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const getVal = (s, col) => {
    if (FACTOR_KEYS.includes(col)) return s.factors?.[col];
    return s[col];
  };

  const header = cols.join(',');
  const rows = stocks.map((s) => cols.map((c) => escape(getVal(s, c))).join(','));
  return [header, ...rows].join('\n');
}
