// Seeded RNG for deterministic price history
const createRng = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 >>> 0;
    return s / 4294967296;
  };
};

const tickerSeed = (ticker) =>
  ticker.split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0);

export const generatePriceHistory = (basePrice, ticker, days = 90) => {
  const rng = createRng(tickerSeed(ticker));
  const history = [];
  const endDate = new Date('2026-05-02');
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  let price = basePrice * (0.80 + rng() * 0.28);

  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;

    const drift = 0.0003;
    const vol = 0.018 + rng() * 0.012;
    const change = drift + (rng() - 0.5) * vol * 2;
    price = Math.max(price * (1 + change), 1);
    const p = Math.round(price * 100) / 100;
    const swing = p * (rng() * 0.012 + 0.003);

    history.push({
      date: date.toISOString().split('T')[0],
      price: p,
      open: Math.round((p - swing * (rng() - 0.4)) * 100) / 100,
      high: Math.round((p + swing) * 100) / 100,
      low: Math.round((p - swing) * 100) / 100,
      volume: Math.floor(rng() * 60000000 + 4000000),
    });
  }
  return history;
};

export const gradeFromScore = (score) => {
  if (score >= 4.7) return 'A+';
  if (score >= 4.3) return 'A';
  if (score >= 3.8) return 'A-';
  if (score >= 3.4) return 'B+';
  if (score >= 2.9) return 'B';
  if (score >= 2.4) return 'B-';
  if (score >= 2.0) return 'C+';
  if (score >= 1.5) return 'C';
  if (score >= 1.0) return 'C-';
  if (score >= 0.5) return 'D';
  return 'F';
};

export const calcQuantScore = (factors) => {
  const { value, growth, momentum, profitability, revisions } = factors;
  return (
    value * 0.20 +
    growth * 0.25 +
    momentum * 0.20 +
    profitability * 0.20 +
    revisions * 0.15
  );
};

const raw = [
  {
    ticker: 'NVDA', name: 'NVIDIA Corporation', price: 875.40, sector: 'Technology',
    industry: 'Semiconductors', marketCap: 2150e9,
    pe: 64.2, ps: 28.5, pb: 36.8, evEbitda: 52.3, dividendYield: 0.03,
    revenueGrowth: 122.4, epsGrowth: 168.3, roe: 91.5, grossMargin: 74.6, operatingMargin: 52.3,
    factors: { value: 2.1, growth: 5.0, momentum: 4.9, profitability: 5.0, revisions: 5.0 },
    priceTarget: 1050, analystRating: 'Strong Buy',
    community: { buy: 312, hold: 48, sell: 14 },
    description: 'NVIDIA designs GPUs for gaming, data centers, and AI. Dominant in the AI accelerator market with H100/H200/Blackwell chips powering major cloud providers and AI labs worldwide.',
    weekHigh52: 974.00, weekLow52: 435.20,
  },
  {
    ticker: 'MSFT', name: 'Microsoft Corporation', price: 418.35, sector: 'Technology',
    industry: 'Software—Infrastructure', marketCap: 3110e9,
    pe: 35.8, ps: 13.2, pb: 13.5, evEbitda: 26.4, dividendYield: 0.73,
    revenueGrowth: 16.0, epsGrowth: 20.8, roe: 38.5, grossMargin: 69.4, operatingMargin: 44.7,
    factors: { value: 3.0, growth: 4.5, momentum: 4.4, profitability: 5.0, revisions: 4.6 },
    priceTarget: 500, analystRating: 'Strong Buy',
    community: { buy: 284, hold: 62, sell: 18 },
    description: 'Microsoft is a global software and cloud leader. Azure cloud computing and Copilot AI integration across Office 365, Dynamics, and GitHub drive compounding growth.',
    weekHigh52: 468.35, weekLow52: 309.45,
  },
  {
    ticker: 'META', name: 'Meta Platforms Inc.', price: 564.20, sector: 'Communication Services',
    industry: 'Internet Content & Information', marketCap: 1430e9,
    pe: 28.4, ps: 9.8, pb: 8.6, evEbitda: 18.2, dividendYield: 0.38,
    revenueGrowth: 22.1, epsGrowth: 73.2, roe: 34.8, grossMargin: 81.5, operatingMargin: 38.9,
    factors: { value: 3.8, growth: 4.7, momentum: 4.5, profitability: 4.8, revisions: 4.7 },
    priceTarget: 680, analystRating: 'Strong Buy',
    community: { buy: 256, hold: 71, sell: 22 },
    description: 'Meta operates Facebook, Instagram, WhatsApp, and Threads. AI-driven ad targeting improvements and Llama model investments underpin strong earnings growth.',
    weekHigh52: 611.00, weekLow52: 352.15,
  },
  {
    ticker: 'AAPL', name: 'Apple Inc.', price: 189.25, sector: 'Technology',
    industry: 'Consumer Electronics', marketCap: 2920e9,
    pe: 29.4, ps: 7.8, pb: 48.5, evEbitda: 22.1, dividendYield: 0.53,
    revenueGrowth: 5.1, epsGrowth: 10.8, roe: 157.4, grossMargin: 45.9, operatingMargin: 29.8,
    factors: { value: 2.8, growth: 3.5, momentum: 3.8, profitability: 5.0, revisions: 4.0 },
    priceTarget: 230, analystRating: 'Buy',
    community: { buy: 198, hold: 94, sell: 41 },
    description: 'Apple designs iPhones, Macs, iPads, wearables, and services. High-margin Services segment (App Store, iCloud, Apple Pay) drives margin expansion and recurring revenue.',
    weekHigh52: 237.23, weekLow52: 164.08,
  },
  {
    ticker: 'AVGO', name: 'Broadcom Inc.', price: 162.80, sector: 'Technology',
    industry: 'Semiconductors', marketCap: 765e9,
    pe: 35.2, ps: 9.2, pb: 9.8, evEbitda: 20.4, dividendYield: 1.48,
    revenueGrowth: 44.0, epsGrowth: 22.5, roe: 30.2, grossMargin: 68.8, operatingMargin: 28.4,
    factors: { value: 3.2, growth: 4.8, momentum: 4.3, profitability: 4.6, revisions: 4.5 },
    priceTarget: 210, analystRating: 'Strong Buy',
    community: { buy: 178, hold: 54, sell: 12 },
    description: 'Broadcom is a semiconductor and infrastructure software company. Custom AI accelerators for hyperscalers and the VMware acquisition significantly expand its addressable market.',
    weekHigh52: 185.16, weekLow52: 107.80,
  },
  {
    ticker: 'LLY', name: 'Eli Lilly and Company', price: 891.55, sector: 'Healthcare',
    industry: 'Drug Manufacturers', marketCap: 842e9,
    pe: 68.5, ps: 18.7, pb: 62.3, evEbitda: 55.2, dividendYield: 0.64,
    revenueGrowth: 36.0, epsGrowth: 102.5, roe: 89.4, grossMargin: 80.1, operatingMargin: 28.5,
    factors: { value: 1.8, growth: 5.0, momentum: 4.6, profitability: 4.5, revisions: 4.9 },
    priceTarget: 1100, analystRating: 'Strong Buy',
    community: { buy: 211, hold: 67, sell: 29 },
    description: 'Eli Lilly leads in GLP-1 drugs (Mounjaro, Zepbound) for diabetes and obesity. Pipeline depth in Alzheimer\'s and oncology supports multi-year revenue expansion.',
    weekHigh52: 972.53, weekLow52: 621.48,
  },
  {
    ticker: 'GOOGL', name: 'Alphabet Inc.', price: 167.90, sector: 'Communication Services',
    industry: 'Internet Content & Information', marketCap: 2080e9,
    pe: 23.5, ps: 5.8, pb: 6.2, evEbitda: 15.3, dividendYield: 0.00,
    revenueGrowth: 14.4, epsGrowth: 31.4, roe: 29.5, grossMargin: 57.0, operatingMargin: 27.4,
    factors: { value: 4.0, growth: 4.0, momentum: 3.9, profitability: 4.5, revisions: 3.8 },
    priceTarget: 210, analystRating: 'Buy',
    community: { buy: 189, hold: 78, sell: 31 },
    description: 'Alphabet operates Google Search, YouTube, and Google Cloud. Gemini AI integration and Cloud growth rate acceleration offset ad market cyclicality concerns.',
    weekHigh52: 207.05, weekLow52: 131.61,
  },
  {
    ticker: 'AMZN', name: 'Amazon.com Inc.', price: 198.30, sector: 'Consumer Cyclical',
    industry: 'Internet Retail', marketCap: 2100e9,
    pe: 45.8, ps: 3.4, pb: 8.8, evEbitda: 20.5, dividendYield: 0.00,
    revenueGrowth: 11.0, epsGrowth: 94.2, roe: 18.5, grossMargin: 47.5, operatingMargin: 8.5,
    factors: { value: 3.4, growth: 4.4, momentum: 3.8, profitability: 3.8, revisions: 4.2 },
    priceTarget: 240, analystRating: 'Buy',
    community: { buy: 201, hold: 82, sell: 28 },
    description: 'Amazon operates e-commerce, AWS cloud, advertising, and Prime. AWS margin expansion and ad revenue growth drive compounding free cash flow.',
    weekHigh52: 242.52, weekLow52: 151.61,
  },
  {
    ticker: 'V', name: 'Visa Inc.', price: 279.45, sector: 'Financial Services',
    industry: 'Credit Services', marketCap: 565e9,
    pe: 31.2, ps: 16.8, pb: 14.6, evEbitda: 24.8, dividendYield: 0.78,
    revenueGrowth: 10.2, epsGrowth: 13.8, roe: 48.5, grossMargin: 79.8, operatingMargin: 66.5,
    factors: { value: 3.5, growth: 3.8, momentum: 3.7, profitability: 5.0, revisions: 3.9 },
    priceTarget: 330, analystRating: 'Buy',
    community: { buy: 167, hold: 88, sell: 19 },
    description: 'Visa is the world\'s largest payment network. Near-monopoly economics, rising cross-border volumes, and emerging market penetration support durable compounding.',
    weekHigh52: 290.96, weekLow52: 230.34,
  },
  {
    ticker: 'MA', name: 'Mastercard Inc.', price: 484.20, sector: 'Financial Services',
    industry: 'Credit Services', marketCap: 453e9,
    pe: 38.5, ps: 17.4, pb: 62.8, evEbitda: 28.4, dividendYield: 0.58,
    revenueGrowth: 11.4, epsGrowth: 16.2, roe: 184.5, grossMargin: 76.2, operatingMargin: 56.8,
    factors: { value: 3.2, growth: 3.9, momentum: 3.8, profitability: 4.9, revisions: 4.0 },
    priceTarget: 560, analystRating: 'Buy',
    community: { buy: 154, hold: 79, sell: 16 },
    description: 'Mastercard operates a global payment network competing closely with Visa. Strong capital returns, share buybacks, and value-added services growth are key investment theses.',
    weekHigh52: 530.11, weekLow52: 385.02,
  },
  {
    ticker: 'JPM', name: 'JPMorgan Chase & Co.', price: 218.60, sector: 'Financial Services',
    industry: 'Banks—Diversified', marketCap: 624e9,
    pe: 11.8, ps: 3.6, pb: 2.0, evEbitda: 9.4, dividendYield: 2.14,
    revenueGrowth: 12.5, epsGrowth: 18.4, roe: 17.4, grossMargin: 58.2, operatingMargin: 34.5,
    factors: { value: 4.5, growth: 3.5, momentum: 3.6, profitability: 4.0, revisions: 3.8 },
    priceTarget: 255, analystRating: 'Buy',
    community: { buy: 143, hold: 91, sell: 28 },
    description: 'JPMorgan is America\'s largest bank by assets. Investment banking revenue, net interest income, and disciplined risk management under Jamie Dimon make it a financial bellwether.',
    weekHigh52: 280.25, weekLow52: 158.48,
  },
  {
    ticker: 'COST', name: 'Costco Wholesale Corp.', price: 908.45, sector: 'Consumer Defensive',
    industry: 'Discount Stores', marketCap: 402e9,
    pe: 52.4, ps: 1.4, pb: 17.8, evEbitda: 30.5, dividendYield: 0.55,
    revenueGrowth: 8.5, epsGrowth: 12.3, roe: 35.8, grossMargin: 12.9, operatingMargin: 3.7,
    factors: { value: 2.5, growth: 3.6, momentum: 4.1, profitability: 4.2, revisions: 3.8 },
    priceTarget: 1000, analystRating: 'Buy',
    community: { buy: 132, hold: 84, sell: 22 },
    description: 'Costco\'s membership model delivers predictable, high-quality revenue with extraordinary member loyalty. Expansion into new markets and digital channels provide growth runway.',
    weekHigh52: 1007.90, weekLow52: 658.06,
  },
  {
    ticker: 'XOM', name: 'Exxon Mobil Corporation', price: 108.75, sector: 'Energy',
    industry: 'Oil & Gas Integrated', marketCap: 468e9,
    pe: 13.5, ps: 1.4, pb: 1.9, evEbitda: 7.2, dividendYield: 3.48,
    revenueGrowth: -2.5, epsGrowth: -8.4, roe: 14.2, grossMargin: 38.5, operatingMargin: 12.8,
    factors: { value: 4.8, growth: 2.2, momentum: 2.8, profitability: 3.5, revisions: 2.5 },
    priceTarget: 130, analystRating: 'Buy',
    community: { buy: 98, hold: 112, sell: 44 },
    description: 'ExxonMobil is a global integrated energy company. Pioneer acquisition enhances Permian Basin position. Strong balance sheet and commitment to dividend growth appeal to income investors.',
    weekHigh52: 126.34, weekLow52: 95.77,
  },
  {
    ticker: 'BRK.B', name: 'Berkshire Hathaway B', price: 448.30, sector: 'Financial Services',
    industry: 'Insurance—Diversified', marketCap: 970e9,
    pe: 9.8, ps: 2.1, pb: 1.6, evEbitda: 8.5, dividendYield: 0.00,
    revenueGrowth: 3.5, epsGrowth: 21.5, roe: 15.4, grossMargin: 28.4, operatingMargin: 14.5,
    factors: { value: 4.8, growth: 2.8, momentum: 3.0, profitability: 3.8, revisions: 3.2 },
    priceTarget: 510, analystRating: 'Buy',
    community: { buy: 118, hold: 98, sell: 15 },
    description: 'Berkshire Hathaway is Warren Buffett\'s conglomerate holding GEICO, BNSF, and major equity stakes. Record cash reserves position it for opportunistic acquisitions.',
    weekHigh52: 496.72, weekLow52: 334.18,
  },
  {
    ticker: 'CRM', name: 'Salesforce Inc.', price: 276.80, sector: 'Technology',
    industry: 'Software—Application', marketCap: 268e9,
    pe: 42.5, ps: 7.2, pb: 4.5, evEbitda: 22.8, dividendYield: 0.68,
    revenueGrowth: 9.4, epsGrowth: 24.8, roe: 10.5, grossMargin: 77.2, operatingMargin: 17.5,
    factors: { value: 2.6, growth: 3.2, momentum: 2.8, profitability: 3.5, revisions: 3.0 },
    priceTarget: 320, analystRating: 'Hold',
    community: { buy: 89, hold: 118, sell: 38 },
    description: 'Salesforce leads CRM software globally. Agentforce AI is the next product cycle bet. Slowing top-line growth and high valuation remain key investor concerns.',
    weekHigh52: 368.91, weekLow52: 212.00,
  },
  {
    ticker: 'NFLX', name: 'Netflix Inc.', price: 682.40, sector: 'Communication Services',
    industry: 'Entertainment', marketCap: 294e9,
    pe: 44.8, ps: 8.8, pb: 24.5, evEbitda: 28.2, dividendYield: 0.00,
    revenueGrowth: 15.0, epsGrowth: 61.4, roe: 32.5, grossMargin: 43.5, operatingMargin: 26.7,
    factors: { value: 2.2, growth: 4.0, momentum: 3.5, profitability: 3.8, revisions: 3.5 },
    priceTarget: 750, analystRating: 'Buy',
    community: { buy: 112, hold: 95, sell: 42 },
    description: 'Netflix leads global streaming with 270M+ subscribers. Ad-supported tier growth and live events (NFL, WWE) open new monetization paths as password sharing is eliminated.',
    weekHigh52: 1065.00, weekLow52: 538.01,
  },
  {
    ticker: 'AMD', name: 'Advanced Micro Devices', price: 155.20, sector: 'Technology',
    industry: 'Semiconductors', marketCap: 251e9,
    pe: 118.5, ps: 7.8, pb: 3.4, evEbitda: 45.2, dividendYield: 0.00,
    revenueGrowth: 17.6, epsGrowth: 158.2, roe: 3.2, grossMargin: 53.0, operatingMargin: 4.8,
    factors: { value: 1.8, growth: 4.2, momentum: 2.4, profitability: 2.8, revisions: 3.2 },
    priceTarget: 200, analystRating: 'Buy',
    community: { buy: 134, hold: 108, sell: 52 },
    description: 'AMD competes in CPUs (Ryzen, EPYC) and GPUs (Instinct MI300). MI300X AI accelerator demand is strong but NVIDIA\'s CUDA ecosystem remains the key competitive moat to overcome.',
    weekHigh52: 227.30, weekLow52: 117.46,
  },
  {
    ticker: 'UNH', name: 'UnitedHealth Group Inc.', price: 478.50, sector: 'Healthcare',
    industry: 'Healthcare Plans', marketCap: 442e9,
    pe: 19.8, ps: 0.6, pb: 5.8, evEbitda: 12.4, dividendYield: 1.80,
    revenueGrowth: 8.2, epsGrowth: -12.5, roe: 29.5, grossMargin: 22.5, operatingMargin: 6.8,
    factors: { value: 3.8, growth: 2.5, momentum: 1.8, profitability: 3.4, revisions: 1.5 },
    priceTarget: 560, analystRating: 'Hold',
    community: { buy: 87, hold: 134, sell: 68 },
    description: 'UnitedHealth is the largest U.S. health insurer. Near-term headwinds from medical cost inflation and DOJ investigation are weighing on estimates and sentiment.',
    weekHigh52: 630.75, weekLow52: 410.00,
  },
  {
    ticker: 'TSLA', name: 'Tesla Inc.', price: 248.80, sector: 'Consumer Cyclical',
    industry: 'Auto Manufacturers', marketCap: 796e9,
    pe: 68.5, ps: 7.8, pb: 11.5, evEbitda: 42.5, dividendYield: 0.00,
    revenueGrowth: -1.1, epsGrowth: -25.5, roe: 14.5, grossMargin: 17.9, operatingMargin: 5.5,
    factors: { value: 1.2, growth: 2.0, momentum: 2.2, profitability: 2.4, revisions: 1.8 },
    priceTarget: 260, analystRating: 'Hold',
    community: { buy: 145, hold: 102, sell: 98 },
    description: 'Tesla makes electric vehicles, energy storage, and solar products. Brand challenges and EV competition from BYD, NIO weigh on near-term volumes while Robotaxi/FSD timelines remain uncertain.',
    weekHigh52: 488.54, weekLow52: 138.80,
  },
  {
    ticker: 'JNJ', name: 'Johnson & Johnson', price: 155.40, sector: 'Healthcare',
    industry: 'Drug Manufacturers', marketCap: 374e9,
    pe: 22.4, ps: 4.2, pb: 5.8, evEbitda: 14.5, dividendYield: 3.20,
    revenueGrowth: 4.5, epsGrowth: -1.2, roe: 23.5, grossMargin: 68.5, operatingMargin: 22.5,
    factors: { value: 3.5, growth: 2.2, momentum: 1.8, profitability: 3.6, revisions: 2.0 },
    priceTarget: 175, analystRating: 'Hold',
    community: { buy: 78, hold: 145, sell: 44 },
    description: 'J&J focuses on pharmaceuticals and MedTech after the Kenvue consumer spinoff. Talc litigation overhang and patent cliffs for key drugs (Stelara) are key near-term risks.',
    weekHigh52: 168.72, weekLow52: 143.13,
  },
  {
    ticker: 'WMT', name: 'Walmart Inc.', price: 88.45, sector: 'Consumer Defensive',
    industry: 'Discount Stores', marketCap: 712e9,
    pe: 38.5, ps: 0.9, pb: 8.5, evEbitda: 20.5, dividendYield: 1.12,
    revenueGrowth: 5.0, epsGrowth: 14.2, roe: 22.5, grossMargin: 24.5, operatingMargin: 4.2,
    factors: { value: 2.4, growth: 2.8, momentum: 3.5, profitability: 2.8, revisions: 3.0 },
    priceTarget: 98, analystRating: 'Hold',
    community: { buy: 94, hold: 128, sell: 38 },
    description: 'Walmart is the world\'s largest retailer. Advertising and membership revenue growth improve its business mix, but the stock\'s elevated valuation limits near-term upside.',
    weekHigh52: 105.30, weekLow52: 59.31,
  },
  {
    ticker: 'HD', name: 'The Home Depot Inc.', price: 342.60, sector: 'Consumer Cyclical',
    industry: 'Home Improvement Retail', marketCap: 340e9,
    pe: 24.5, ps: 2.1, pb: 312.5, evEbitda: 16.5, dividendYield: 2.58,
    revenueGrowth: -0.8, epsGrowth: 1.5, roe: 145.8, grossMargin: 33.4, operatingMargin: 13.8,
    factors: { value: 3.4, growth: 2.4, momentum: 2.8, profitability: 4.2, revisions: 2.8 },
    priceTarget: 395, analystRating: 'Hold',
    community: { buy: 88, hold: 124, sell: 45 },
    description: 'Home Depot is the leading home improvement retailer. Housing market sluggishness dampens near-term same-store sales; SRS Distribution acquisition adds professional contractor exposure.',
    weekHigh52: 395.00, weekLow52: 285.88,
  },
  {
    ticker: 'PG', name: 'Procter & Gamble Co.', price: 162.30, sector: 'Consumer Defensive',
    industry: 'Household & Personal Products', marketCap: 382e9,
    pe: 26.5, ps: 4.8, pb: 8.5, evEbitda: 18.2, dividendYield: 2.38,
    revenueGrowth: 2.1, epsGrowth: 5.8, roe: 33.5, grossMargin: 51.5, operatingMargin: 22.4,
    factors: { value: 3.0, growth: 1.8, momentum: 2.2, profitability: 3.8, revisions: 2.2 },
    priceTarget: 178, analystRating: 'Hold',
    community: { buy: 68, hold: 148, sell: 38 },
    description: 'P&G owns Tide, Pampers, Gillette, and 50+ other global consumer brands. Volume recovery after pricing-led growth phase is proving slower than consensus expected.',
    weekHigh52: 180.00, weekLow52: 149.37,
  },
  {
    ticker: 'PLTR', name: 'Palantir Technologies', price: 27.85, sector: 'Technology',
    industry: 'Software—Application', marketCap: 59e9,
    pe: 218.4, ps: 16.5, pb: 12.5, evEbitda: 145.8, dividendYield: 0.00,
    revenueGrowth: 21.5, epsGrowth: 180.5, roe: 5.8, grossMargin: 80.5, operatingMargin: 7.5,
    factors: { value: 0.4, growth: 3.8, momentum: 3.5, profitability: 1.5, revisions: 2.5 },
    priceTarget: 22, analystRating: 'Sell',
    community: { buy: 156, hold: 82, sell: 95 },
    description: 'Palantir builds AI/data analytics platforms for government and commercial clients. AIP momentum is real but the stock\'s extreme valuation requires multi-decade execution to justify.',
    weekHigh52: 49.49, weekLow52: 14.89,
  },
  {
    ticker: 'CVX', name: 'Chevron Corporation', price: 148.20, sector: 'Energy',
    industry: 'Oil & Gas Integrated', marketCap: 275e9,
    pe: 12.8, ps: 1.5, pb: 1.7, evEbitda: 7.5, dividendYield: 4.15,
    revenueGrowth: -5.2, epsGrowth: -15.4, roe: 13.2, grossMargin: 35.8, operatingMargin: 11.5,
    factors: { value: 4.5, growth: 1.8, momentum: 2.2, profitability: 3.2, revisions: 2.0 },
    priceTarget: 168, analystRating: 'Hold',
    community: { buy: 88, hold: 118, sell: 42 },
    description: 'Chevron is a global integrated energy company with Permian Basin and LNG exposure. Hess acquisition battle with Exxon creates near-term uncertainty around Guyana assets.',
    weekHigh52: 174.66, weekLow52: 128.52,
  },
];

// Attach computed fields and price history
export const stocks = raw.map((s) => {
  const quantScore = Math.round(calcQuantScore(s.factors) * 100) / 100;
  const quantGrade = gradeFromScore(quantScore);
  const priceHistory = generatePriceHistory(s.price, s.ticker, 90);
  const lastClose = priceHistory[priceHistory.length - 1]?.price ?? s.price;
  const prevClose = priceHistory[priceHistory.length - 2]?.price ?? s.price;
  const change = Math.round((lastClose - prevClose) * 100) / 100;
  const changePercent = Math.round((change / prevClose) * 10000) / 100;

  return {
    ...s,
    quantScore,
    quantGrade,
    priceHistory,
    price: lastClose,
    change,
    changePercent,
  };
});

export const getStockByTicker = (ticker) =>
  stocks.find((s) => s.ticker === ticker?.toUpperCase());

export const sectors = [...new Set(stocks.map((s) => s.sector))].sort();
