/**
 * Factor backtester over mock price histories.
 * Educational / simulated — not live markets.
 */

import { maxDrawdown } from './risk.js';
import { calcQuantScore } from './quant.js';

function finite(n, fallback = 0) {
  return Number.isFinite(n) ? n : fallback;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Align price histories by inner-joining dates that exist on every series.
 * Falls back to the longest common suffix (by index) if the intersection is empty.
 */
export function alignPriceHistories(stocks) {
  if (!Array.isArray(stocks) || stocks.length === 0) {
    return { dates: [], series: [] };
  }

  const maps = stocks.map((s) => {
    const m = new Map();
    for (const pt of s?.priceHistory ?? []) {
      if (pt && pt.date != null && Number.isFinite(Number(pt.price))) {
        m.set(String(pt.date), Number(pt.price));
      }
    }
    return m;
  });

  if (maps.some((m) => m.size === 0)) {
    return suffixAlign(stocks);
  }

  let dates = [...maps[0].keys()];
  for (let i = 1; i < maps.length; i += 1) {
    const set = maps[i];
    dates = dates.filter((d) => set.has(d));
  }
  dates.sort();

  if (dates.length === 0) return suffixAlign(stocks);

  const series = maps.map((m) => dates.map((d) => m.get(d)));
  return { dates, series };
}

function suffixAlign(stocks) {
  const histories = stocks.map((s) => s?.priceHistory ?? []);
  const n = Math.min(...histories.map((h) => h.length));
  if (!Number.isFinite(n) || n <= 0) return { dates: [], series: [] };
  const longest = histories.reduce((best, h) => (h.length > best.length ? h : best), histories[0]);
  const dates = longest.slice(-n).map((pt) => String(pt.date));
  const series = histories.map((h) => h.slice(-n).map((pt) => Number(pt.price)));
  return { dates, series };
}

const EMPTY_STATS = {
  strategyReturn: 0,
  benchmarkReturn: 0,
  maxDrawdown: 0,
  excessReturn: 0,
};

function staticScore(stock, factor) {
  if (factor === 'composite') {
    const s = calcQuantScore(stock?.factors);
    return Number.isFinite(s) ? s : -Infinity;
  }
  const v = Number(stock?.factors?.[factor]);
  return Number.isFinite(v) ? v : -Infinity;
}

/**
 * Equal-weight factor backtest vs universe buy-and-hold.
 *
 * `momentum` ranks by trailing `lookback` return at each rebalance.
 * Other factors (`value`, `growth`, `profitability`, `revisions`, `composite`)
 * rank by static mock scores (still marked to the same price path vs B&H).
 *
 * @returns {{ equity: Array<{date: string, strategy: number, benchmark: number}>, stats: object }}
 */
export function backtestFactor(stocks, {
  factor = 'momentum',
  topN = 8,
  lookback = 21,
  rebalance = 21,
  startCash = 100000,
} = {}) {
  const lb = Math.max(1, Math.floor(Number(lookback) || 21));
  const rb = Math.max(1, Math.floor(Number(rebalance) || 21));
  const cash0 = Number(startCash);
  const start = Number.isFinite(cash0) && cash0 > 0 ? cash0 : 100000;
  const useMom = factor === 'momentum';

  const list = Array.isArray(stocks) ? stocks : [];
  const { dates, series } = alignPriceHistories(list);
  const nNames = series.length;
  const T = dates.length;

  if (nNames === 0 || T < lb + 2) {
    return { equity: [], stats: { ...EMPTY_STATS } };
  }

  const holdN = Math.max(1, Math.min(Math.floor(Number(topN) || 8), nNames));
  const startIdx = lb;
  const benchStart = series.map((s) => s[startIdx]);
  const frozen = useMom ? null : list.map((s) => staticScore(s, factor));

  let held = [];
  let stratVal = start;
  const equity = [];

  for (let t = startIdx; t < T; t += 1) {
    if ((t - startIdx) % rb === 0) {
      const ranked = series.map((s, i) => {
        if (useMom) {
          const prev = s[t - lb];
          const ret = prev > 0 ? s[t] / prev - 1 : -Infinity;
          return { i, ret };
        }
        return { i, ret: frozen[i] };
      });
      ranked.sort((a, b) => b.ret - a.ret);
      held = ranked.slice(0, holdN).map((x) => x.i);
    }

    if (t > startIdx && held.length) {
      let r = 0;
      for (const i of held) {
        const prev = series[i][t - 1];
        r += prev > 0 ? series[i][t] / prev - 1 : 0;
      }
      stratVal *= 1 + r / held.length;
    }

    let bSum = 0;
    for (let i = 0; i < nNames; i += 1) {
      const p0 = benchStart[i];
      bSum += p0 > 0 ? series[i][t] / p0 : 1;
    }
    const benchVal = start * (bSum / nNames);

    equity.push({
      date: dates[t],
      strategy: round2(stratVal),
      benchmark: round2(benchVal),
    });
  }

  const s0 = equity[0]?.strategy;
  const s1 = equity[equity.length - 1]?.strategy;
  const b0 = equity[0]?.benchmark;
  const b1 = equity[equity.length - 1]?.benchmark;
  const strategyReturn = finite(s0 ? s1 / s0 - 1 : 0);
  const benchmarkReturn = finite(b0 ? b1 / b0 - 1 : 0);
  const dd = finite(maxDrawdown(equity.map((e) => e.strategy)));

  return {
    equity,
    stats: {
      strategyReturn,
      benchmarkReturn,
      maxDrawdown: dd,
      excessReturn: finite(strategyReturn - benchmarkReturn),
    },
  };
}

/**
 * Equal-weight momentum: every `rebalance` days, rank by trailing `lookback`
 * return and hold the top N names until the next rebalance.
 * Benchmark is equal-weight buy-and-hold of the full universe.
 */
export function backtestMomentum(stocks, {
  topN = 8,
  lookback = 21,
  rebalance = 21,
  startCash = 100000,
} = {}) {
  return backtestFactor(stocks, { factor: 'momentum', topN, lookback, rebalance, startCash });
}
