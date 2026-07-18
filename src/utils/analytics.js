const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const average = (values) => (
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
);

export const toPercent = (value, digits = 1) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`;

export const getHistoryReturn = (stock) => {
  const history = stock.priceHistory || [];
  const first = history[0]?.price || stock.price;
  const last = history[history.length - 1]?.price || stock.price;
  return ((last - first) / Math.max(first, 0.01)) * 100;
};

export const getVolatility = (stock) => {
  const history = stock.priceHistory || [];
  if (history.length < 3) return 0;

  const returns = history.slice(1).map((point, index) => {
    const previous = history[index]?.price || point.price;
    return (point.price - previous) / Math.max(previous, 0.01);
  });
  const mean = average(returns);
  const variance = average(returns.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
};

export const getMaxDrawdown = (stock) => {
  let peak = 0;
  let drawdown = 0;
  (stock.priceHistory || []).forEach((point) => {
    peak = Math.max(peak, point.price);
    if (peak > 0) {
      drawdown = Math.min(drawdown, ((point.price - peak) / peak) * 100);
    }
  });
  return Math.abs(drawdown);
};

export const getUpside = (stock) =>
  ((stock.priceTarget - stock.price) / Math.max(stock.price, 0.01)) * 100;

export const getCommunityBullishness = (stock) => {
  const total = stock.community.buy + stock.community.hold + stock.community.sell;
  return total ? ((stock.community.buy - stock.community.sell) / total) * 100 : 0;
};

export const getRiskScore = (stock) => {
  const valuationPenalty = clamp((stock.pe - 25) * 0.8, 0, 30);
  const drawdownPenalty = getMaxDrawdown(stock) * 1.35;
  const volatilityPenalty = getVolatility(stock) * 0.7;
  const balance = (5 - stock.factors.profitability) * 5 + (5 - stock.factors.value) * 3;
  return clamp(valuationPenalty + drawdownPenalty + volatilityPenalty + balance, 0, 100);
};

export const getSignalScore = (stock) => {
  const upside = getUpside(stock);
  const risk = getRiskScore(stock);
  const community = getCommunityBullishness(stock);
  const quality =
    (stock.quantScore / 5) * 48 +
    (stock.factors.momentum / 5) * 12 +
    (stock.factors.profitability / 5) * 10 +
    (stock.factors.revisions / 5) * 8;
  const upsideContribution = (clamp(upside, -25, 50) / 50) * 10;
  const communityContribution = (clamp(community, -100, 100) / 100) * 5;
  const riskPenalty = (risk / 100) * 22;

  return clamp(quality + upsideContribution + communityContribution - riskPenalty, 0, 100);
};

export const getSignalLabel = (score) => {
  if (score >= 72) return 'Model leader';
  if (score >= 60) return 'Positive';
  if (score >= 48) return 'Watch';
  if (score >= 36) return 'Neutral';
  return 'Caution';
};

export const enrichStock = (stock) => {
  const riskScore = getRiskScore(stock);
  const signalScore = getSignalScore(stock);

  return {
    ...stock,
    riskScore,
    signalScore,
    signalLabel: getSignalLabel(signalScore),
    upside: getUpside(stock),
    volatility: getVolatility(stock),
    drawdown: getMaxDrawdown(stock),
    trailingReturn: getHistoryReturn(stock),
    communityBullishness: getCommunityBullishness(stock),
  };
};

export const rankSignalCandidates = (stocks) =>
  stocks.map(enrichStock).sort((a, b) => (
    b.signalScore - a.signalScore || a.ticker.localeCompare(b.ticker)
  ));

const STRATEGY_SORTERS = {
  balanced: (a, b) => b.signalScore - a.signalScore || a.ticker.localeCompare(b.ticker),
  quant: (a, b) => b.quantScore - a.quantScore || a.ticker.localeCompare(b.ticker),
  momentum: (a, b) => b.factors.momentum - a.factors.momentum || a.ticker.localeCompare(b.ticker),
  value: (a, b) => b.factors.value - a.factors.value || a.ticker.localeCompare(b.ticker),
};

export const STRATEGIES = [
  { id: 'balanced', label: 'Balanced Signal' },
  { id: 'quant', label: 'Pure Quant' },
  { id: 'momentum', label: 'Momentum' },
  { id: 'value', label: 'Value' },
];

export const buildHistoricalScenario = (stocks, strategyId = 'balanced', size = 5) => {
  const enriched = rankSignalCandidates(stocks);
  const sorter = STRATEGY_SORTERS[strategyId] || STRATEGY_SORTERS.balanced;
  const holdings = [...enriched]
    .filter((stock) => stock.priceHistory?.length)
    .sort(sorter)
    .slice(0, Math.max(0, size));
  const length = holdings.length
    ? Math.min(...holdings.map((stock) => stock.priceHistory.length))
    : 0;
  const curve = [];

  for (let index = 0; index < length; index += 1) {
    const returns = holdings.map((stock) => {
      const start = stock.priceHistory[0].price;
      const current = stock.priceHistory[index].price;
      return current / Math.max(start, 0.01);
    });
    curve.push({
      date: holdings[0].priceHistory[index].date,
      value: Math.round(10000 * average(returns) * 100) / 100,
    });
  }

  const start = curve[0]?.value || 10000;
  const end = curve[curve.length - 1]?.value || start;
  const totalReturn = ((end - start) / start) * 100;
  const bestHolding = holdings.length
    ? holdings.reduce((best, stock) => (
      getHistoryReturn(stock) > getHistoryReturn(best) ? stock : best
    ), holdings[0])
    : null;

  return {
    curve,
    holdings,
    totalReturn,
    bestHolding,
    isBacktest: false,
    methodology: 'Current snapshot ranking replayed over simulated history; not a time-causal backtest.',
  };
};

export const getSectorSignalSummary = (stocks) => {
  const groups = stocks.reduce((acc, stock) => {
    const enriched = enrichStock(stock);
    acc[stock.sector] ||= [];
    acc[stock.sector].push(enriched);
    return acc;
  }, {});

  return Object.entries(groups)
    .map(([sector, items]) => ({
      sector,
      signal: average(items.map((item) => item.signalScore)),
      upside: average(items.map((item) => item.upside)),
      risk: average(items.map((item) => item.riskScore)),
      count: items.length,
    }))
    .sort((a, b) => b.signal - a.signal);
};
