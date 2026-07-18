const FACTOR_KEYS = ['value', 'growth', 'momentum', 'profitability', 'revisions'];

export const DEFAULT_POSITIONS = [
  { ticker: 'NVDA', shares: 50, entryPrice: 620 },
  { ticker: 'MSFT', shares: 120, entryPrice: 385 },
  { ticker: 'META', shares: 80, entryPrice: 470 },
  { ticker: 'AAPL', shares: 200, entryPrice: 172 },
  { ticker: 'AVGO', shares: 100, entryPrice: 135 },
  { ticker: 'LLY', shares: 30, entryPrice: 750 },
  { ticker: 'GOOGL', shares: 150, entryPrice: 145 },
  { ticker: 'V', shares: 80, entryPrice: 250 },
  { ticker: 'JPM', shares: 100, entryPrice: 185 },
  { ticker: 'COST', shares: 25, entryPrice: 820 },
];

const asPositiveNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const normalizeTicker = (value) => String(value || '').trim().toUpperCase();

export function validatePosition(position, availableTickers = []) {
  const ticker = normalizeTicker(position?.ticker);
  const shares = asPositiveNumber(position?.shares);
  const entryPrice = asPositiveNumber(position?.entryPrice);
  const tickerSet = new Set(availableTickers.map(normalizeTicker));
  const errors = {};

  if (!ticker) {
    errors.ticker = 'Choose a stock.';
  } else if (tickerSet.size && !tickerSet.has(ticker)) {
    errors.ticker = `${ticker} is not in the research universe.`;
  }

  if (shares === null) errors.shares = 'Shares must be greater than zero.';
  if (entryPrice === null) errors.entryPrice = 'Entry price must be greater than zero.';

  return {
    errors,
    valid: Object.keys(errors).length === 0,
    value: { ticker, shares, entryPrice },
  };
}

export function addPosition(positions, position) {
  const { valid, value } = validatePosition(position);
  if (!valid) return Array.isArray(positions) ? [...positions] : [];

  const current = Array.isArray(positions) ? positions : [];
  const existing = current.find((item) => normalizeTicker(item.ticker) === value.ticker);
  if (!existing) return [...current, value];

  const combinedShares = existing.shares + value.shares;
  const weightedEntry = (
    existing.shares * existing.entryPrice + value.shares * value.entryPrice
  ) / combinedShares;

  return current.map((item) => (
    normalizeTicker(item.ticker) === value.ticker
      ? { ...value, shares: combinedShares, entryPrice: weightedEntry }
      : item
  ));
}

export function updatePosition(positions, ticker, position) {
  const normalizedTicker = normalizeTicker(ticker);
  const { valid, value } = validatePosition({ ...position, ticker: normalizedTicker });
  if (!valid) return Array.isArray(positions) ? [...positions] : [];

  return (Array.isArray(positions) ? positions : []).map((item) => (
    normalizeTicker(item.ticker) === normalizedTicker ? value : item
  ));
}

export function removePosition(positions, ticker) {
  const normalizedTicker = normalizeTicker(ticker);
  return (Array.isArray(positions) ? positions : []).filter(
    (item) => normalizeTicker(item.ticker) !== normalizedTicker,
  );
}

export function sanitizePositions(value, availableTickers = []) {
  if (!Array.isArray(value)) return [];

  return value.reduce((positions, position) => {
    const result = validatePosition(position, availableTickers);
    return result.valid ? addPosition(positions, result.value) : positions;
  }, []);
}

export function buildPortfolioHoldings(positions, stockUniverse) {
  const stocksByTicker = new Map(stockUniverse.map((stock) => [stock.ticker, stock]));

  return positions.flatMap((position) => {
    const stock = stocksByTicker.get(position.ticker);
    if (!stock) return [];

    const currentVal = stock.price * position.shares;
    const costBasis = position.entryPrice * position.shares;
    const gain = currentVal - costBasis;

    return [{
      ...position,
      stock,
      currentVal,
      costBasis,
      gain,
      gainPct: costBasis ? (gain / costBasis) * 100 : 0,
    }];
  });
}

export function getPortfolioSummary(holdings) {
  const totalValue = holdings.reduce((sum, holding) => sum + holding.currentVal, 0);
  const totalCost = holdings.reduce((sum, holding) => sum + holding.costBasis, 0);
  const totalGain = totalValue - totalCost;
  const dailyPnL = holdings.reduce(
    (sum, holding) => sum + (holding.stock.change || 0) * holding.shares,
    0,
  );
  const weightedQuantScore = totalValue
    ? holdings.reduce(
      (sum, holding) => sum + holding.stock.quantScore * holding.currentVal,
      0,
    ) / totalValue
    : 0;

  const sectorValues = holdings.reduce((groups, holding) => {
    const sector = holding.stock.sector || 'Other';
    groups[sector] = (groups[sector] || 0) + holding.currentVal;
    return groups;
  }, {});

  const sectors = Object.entries(sectorValues)
    .map(([name, value]) => ({
      name,
      value,
      weight: totalValue ? (value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const factorScores = Object.fromEntries(FACTOR_KEYS.map((factor) => [
    factor,
    totalValue
      ? holdings.reduce(
        (sum, holding) => sum + holding.stock.factors[factor] * holding.currentVal,
        0,
      ) / totalValue
      : 0,
  ]));

  const largestPosition = totalValue
    ? holdings.reduce((largest, holding) => (
      !largest || holding.currentVal > largest.currentVal ? holding : largest
    ), null)
    : null;

  return {
    totalValue,
    totalCost,
    totalGain,
    totalGainPct: totalCost ? (totalGain / totalCost) * 100 : 0,
    dailyPnL,
    weightedQuantScore,
    factorScores,
    sectors,
    largestPosition,
    largestWeight: largestPosition ? (largestPosition.currentVal / totalValue) * 100 : 0,
  };
}

export function buildEquityCurve(holdings) {
  if (!holdings.length) return [];

  const priceMaps = holdings.map((holding) => new Map(
    (holding.stock.priceHistory || []).map((point) => [point.date, point.price]),
  ));
  const candidateDates = holdings[0].stock.priceHistory?.map((point) => point.date) || [];

  return candidateDates.flatMap((date) => {
    if (!priceMaps.every((prices) => prices.has(date))) return [];
    const value = holdings.reduce(
      (sum, holding, index) => sum + priceMaps[index].get(date) * holding.shares,
      0,
    );
    return [{ date, value: Math.round(value * 100) / 100 }];
  });
}

export function buildAllocation(holdings) {
  const totalValue = holdings.reduce((sum, holding) => sum + holding.currentVal, 0);
  if (!totalValue) return [];

  return [...holdings]
    .sort((a, b) => b.currentVal - a.currentVal)
    .map((holding) => ({
      name: holding.ticker,
      value: holding.currentVal,
      weight: (holding.currentVal / totalValue) * 100,
    }));
}
