export const MAX_SHARES = 1_000_000_000;
export const MAX_ENTRY_PRICE = 1_000_000_000;

const finitePositive = (value, maximum = Number.MAX_VALUE) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 && number <= maximum;
};

export const DEFAULT_POSITIONS = [
  { ticker: 'NVDA', shares: 20, entryPrice: 620 },
  { ticker: 'MSFT', shares: 35, entryPrice: 385 },
  { ticker: 'META', shares: 25, entryPrice: 470 },
  { ticker: 'GOOGL', shares: 60, entryPrice: 145 },
  { ticker: 'JPM', shares: 35, entryPrice: 185 },
];

export const DEFAULT_WATCHLIST = ['NVDA', 'MSFT', 'META', 'GOOGL', 'JPM'];

export function sanitizePositions(value, knownTickers = []) {
  if (!Array.isArray(value)) return DEFAULT_POSITIONS;
  const allowed = new Set(knownTickers);
  const byTicker = new Map();

  value.forEach((position) => {
    const ticker = String(position?.ticker || '').trim().toUpperCase();
    if (!ticker || (allowed.size && !allowed.has(ticker))) return;
    if (!finitePositive(position?.shares, MAX_SHARES) ||
        !finitePositive(position?.entryPrice, MAX_ENTRY_PRICE)) return;
    const shares = Number(position.shares);
    const entryPrice = Number(position.entryPrice);
    const existing = byTicker.get(ticker);
    if (!existing) {
      byTicker.set(ticker, { ticker, shares, entryPrice });
      return;
    }
    const combinedShares = existing.shares + shares;
    if (!Number.isFinite(combinedShares) || combinedShares > MAX_SHARES) return;
    byTicker.set(ticker, {
      ticker,
      shares: combinedShares,
      entryPrice: ((existing.shares * existing.entryPrice) + (shares * entryPrice)) / combinedShares,
    });
  });

  return [...byTicker.values()];
}

export function sanitizeWatchlist(value, knownTickers = []) {
  if (!Array.isArray(value)) return DEFAULT_WATCHLIST;
  const allowed = new Set(knownTickers);
  return [...new Set(value
    .map((ticker) => String(ticker || '').trim().toUpperCase())
    .filter((ticker) => ticker && (!allowed.size || allowed.has(ticker))))];
}

export function buildHoldings(positions, stockUniverse) {
  const stocksByTicker = new Map(stockUniverse.map((stock) => [stock.ticker, stock]));
  return positions.flatMap((position) => {
    const stock = stocksByTicker.get(position.ticker);
    if (!stock || !finitePositive(position.shares, MAX_SHARES) ||
        !finitePositive(position.entryPrice, MAX_ENTRY_PRICE)) return [];
    const currentValue = stock.price * position.shares;
    const costBasis = position.entryPrice * position.shares;
    const gain = currentValue - costBasis;
    return [{
      ...position,
      stock,
      currentValue,
      costBasis,
      gain,
      gainPercent: costBasis ? (gain / costBasis) * 100 : 0,
      dayChange: stock.change * position.shares,
    }];
  });
}

export function buildEquityCurve(holdings) {
  const dates = [...new Set(holdings.flatMap((holding) =>
    holding.stock.priceHistory.map((point) => point.date)))].sort();
  const historyByTicker = new Map(holdings.map((holding) => [
    holding.ticker,
    new Map(holding.stock.priceHistory.map((point) => [point.date, point.price])),
  ]));
  const lastPrice = new Map();

  return dates.map((date) => {
    const value = holdings.reduce((total, holding) => {
      const price = historyByTicker.get(holding.ticker)?.get(date);
      if (price !== undefined) lastPrice.set(holding.ticker, price);
      return total + (lastPrice.get(holding.ticker) || 0) * holding.shares;
    }, 0);
    return { date, value: Math.round(value * 100) / 100 };
  }).filter((point) => point.value > 0);
}

const weightedAverage = (holdings, selector, totalValue) => {
  if (!totalValue) return 0;
  return holdings.reduce((total, holding) =>
    total + selector(holding) * (holding.currentValue / totalValue), 0);
};

export function calculatePortfolioAnalytics(holdings) {
  const totalValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
  const totalCost = holdings.reduce((sum, holding) => sum + holding.costBasis, 0);
  const totalGain = totalValue - totalCost;
  const dailyPnL = holdings.reduce((sum, holding) => sum + holding.dayChange, 0);
  const equityCurve = buildEquityCurve(holdings);
  const returns = equityCurve.slice(1).map((point, index) => {
    const previous = equityCurve[index].value;
    return previous ? (point.value - previous) / previous : 0;
  });
  const meanReturn = returns.length
    ? returns.reduce((sum, value) => sum + value, 0) / returns.length
    : 0;
  const variance = returns.length > 1
    ? returns.reduce((sum, value) => sum + ((value - meanReturn) ** 2), 0) / (returns.length - 1)
    : 0;
  const annualizedVolatility = Math.sqrt(variance) * Math.sqrt(252) * 100;

  let peak = 0;
  let maxDrawdown = 0;
  equityCurve.forEach(({ value }) => {
    peak = Math.max(peak, value);
    if (peak) maxDrawdown = Math.min(maxDrawdown, ((value - peak) / peak) * 100);
  });

  const allocations = holdings
    .map((holding) => ({ ...holding, weight: totalValue ? (holding.currentValue / totalValue) * 100 : 0 }))
    .sort((a, b) => b.weight - a.weight);

  const sectorMap = new Map();
  allocations.forEach((holding) => {
    sectorMap.set(holding.stock.sector, (sectorMap.get(holding.stock.sector) || 0) + holding.weight);
  });
  const sectors = [...sectorMap.entries()]
    .map(([name, weight]) => ({ name, weight }))
    .sort((a, b) => b.weight - a.weight);

  const effectivePositions = allocations.length
    ? 1 / allocations.reduce((sum, holding) => sum + ((holding.weight / 100) ** 2), 0)
    : 0;

  return {
    totalValue,
    totalCost,
    totalGain,
    totalGainPercent: totalCost ? (totalGain / totalCost) * 100 : 0,
    dailyPnL,
    dailyPnLPercent: totalValue - dailyPnL ? (dailyPnL / (totalValue - dailyPnL)) * 100 : 0,
    weightedQuantScore: weightedAverage(holdings, (holding) => holding.stock.quantScore, totalValue),
    annualizedVolatility,
    maxDrawdown,
    effectivePositions,
    topPositionWeight: allocations[0]?.weight || 0,
    topSectorWeight: sectors[0]?.weight || 0,
    allocations,
    sectors,
    equityCurve,
  };
}

export function portfolioInsights(analytics) {
  if (!analytics.totalValue) return [];
  const insights = [];
  if (analytics.topPositionWeight > 30) {
    insights.push({ level: 'warning', text: `Largest position is ${analytics.topPositionWeight.toFixed(0)}% of the portfolio.` });
  } else {
    insights.push({ level: 'positive', text: `Largest position is contained at ${analytics.topPositionWeight.toFixed(0)}%.` });
  }
  if (analytics.topSectorWeight > 50) {
    insights.push({ level: 'warning', text: `Top sector exposure is ${analytics.topSectorWeight.toFixed(0)}%; consider concentration risk.` });
  } else {
    insights.push({ level: 'positive', text: `Sector concentration is below 50%.` });
  }
  if (analytics.weightedQuantScore < 3) {
    insights.push({ level: 'warning', text: `Weighted quant score is ${analytics.weightedQuantScore.toFixed(2)} / 5.` });
  } else {
    insights.push({ level: 'positive', text: `Weighted quant quality is ${analytics.weightedQuantScore.toFixed(2)} / 5.` });
  }
  return insights;
}
