export const indices = [
  { symbol: 'SPX', name: 'S&P 500', value: 5224.62, change: 48.35, changePct: 0.93 },
  { symbol: 'NDX', name: 'NASDAQ 100', value: 18205.40, change: 182.44, changePct: 1.01 },
  { symbol: 'DJI', name: 'Dow Jones', value: 38675.55, change: -82.22, changePct: -0.21 },
  { symbol: 'RUT', name: 'Russell 2000', value: 2025.18, change: 12.45, changePct: 0.62 },
  { symbol: 'VIX', name: 'CBOE VIX', value: 18.42, change: -1.22, changePct: -6.21 },
  { symbol: 'DXY', name: 'US Dollar', value: 104.58, change: 0.38, changePct: 0.36 },
  { symbol: 'GOLD', name: 'Gold', value: 2312.40, change: 8.25, changePct: 0.36 },
  { symbol: 'OIL', name: 'Crude Oil', value: 78.45, change: -0.85, changePct: -1.07 },
  { symbol: 'BTC', name: 'Bitcoin', value: 62548, change: 1284, changePct: 2.09 },
  { symbol: 'T10Y', name: '10Y Treasury', value: 4.48, change: 0.03, changePct: 0.67 },
];

export const sectorPerformance = [
  { name: 'Technology', ytd: 12.4, oneMonth: 4.2, oneWeek: 1.8, color: '#3b82f6' },
  { name: 'Communication Services', ytd: 8.6, oneMonth: 3.5, oneWeek: 1.2, color: '#8b5cf6' },
  { name: 'Healthcare', ytd: 2.1, oneMonth: -1.4, oneWeek: 0.4, color: '#10b981' },
  { name: 'Financial Services', ytd: 9.8, oneMonth: 2.8, oneWeek: 0.9, color: '#06b6d4' },
  { name: 'Consumer Cyclical', ytd: -4.2, oneMonth: -2.1, oneWeek: -0.8, color: '#f97316' },
  { name: 'Consumer Defensive', ytd: 3.4, oneMonth: 1.2, oneWeek: 0.5, color: '#84cc16' },
  { name: 'Energy', ytd: -2.8, oneMonth: -3.5, oneWeek: -1.4, color: '#eab308' },
  { name: 'Industrials', ytd: 6.2, oneMonth: 1.8, oneWeek: 0.7, color: '#64748b' },
  { name: 'Materials', ytd: 1.5, oneMonth: 0.8, oneWeek: 0.2, color: '#a16207' },
  { name: 'Real Estate', ytd: -5.8, oneMonth: -2.4, oneWeek: -0.6, color: '#dc2626' },
  { name: 'Utilities', ytd: 4.2, oneMonth: 2.1, oneWeek: 0.8, color: '#7c3aed' },
];

export const marketNews = [
  {
    id: 1,
    headline: 'Fed signals potential rate cuts later in 2026 as inflation nears 2% target',
    source: 'Reuters',
    time: '2h ago',
    sentiment: 'positive',
    tickers: ['SPX', 'NDX'],
  },
  {
    id: 2,
    headline: "NVIDIA's Blackwell Ultra chips oversubscribed for 2026, raising data center revenue estimates",
    source: 'Bloomberg',
    time: '3h ago',
    sentiment: 'positive',
    tickers: ['NVDA'],
  },
  {
    id: 3,
    headline: 'Apple Intelligence adoption accelerates; Services revenue beats on App Store growth',
    source: 'WSJ',
    time: '5h ago',
    sentiment: 'positive',
    tickers: ['AAPL'],
  },
  {
    id: 4,
    headline: 'Tesla Q1 deliveries miss estimates by 10%; price cuts failing to stimulate demand',
    source: 'CNBC',
    time: '6h ago',
    sentiment: 'negative',
    tickers: ['TSLA'],
  },
  {
    id: 5,
    headline: 'Eli Lilly Zepbound secures new obesity label; TAM expands to $150B by 2030',
    source: 'FT',
    time: '8h ago',
    sentiment: 'positive',
    tickers: ['LLY'],
  },
  {
    id: 6,
    headline: 'Oil prices drop on rising OPEC+ supply expectations and demand concerns',
    source: 'Reuters',
    time: '10h ago',
    sentiment: 'negative',
    tickers: ['XOM', 'CVX'],
  },
  {
    id: 7,
    headline: 'Meta Platforms unveils Llama 4; open-source AI strategy gaining enterprise traction',
    source: 'TechCrunch',
    time: '12h ago',
    sentiment: 'positive',
    tickers: ['META'],
  },
];

export const marketStatus = {
  isOpen: true,
  session: 'Regular Trading',
  nextEvent: 'Market closes at 4:00 PM ET',
  lastUpdate: new Date().toISOString(),
};
