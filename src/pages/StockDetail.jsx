import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowLeft, TrendingUp, TrendingDown, Target, Users,
  BarChart2, DollarSign, Star, ChevronUp, ChevronDown,
} from 'lucide-react';
import { getStockByTicker } from '../data/stocks';
import { communityPosts } from '../data/community';
import QuantGrade from '../components/common/QuantGrade';
import { FactorScores } from '../components/common/FactorBar';
import clsx from 'clsx';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const fmt = (n, d = 2) => (n === null || n === undefined ? '—' : n.toFixed(d));
const fmtBig = (n) => {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  return `$${n}`;
};
const fmtDate = (str) => {
  const d = new Date(str);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ratingColor = {
  'Strong Buy': '#10b981',
  'Buy': '#34d399',
  'Hold': '#f59e0b',
  'Sell': '#f97316',
  'Strong Sell': '#ef4444',
};

function StatBox({ label, value, sub, color }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-xl font-bold font-mono" style={{ color: color ?? '#e2e8f0' }}>
        {value}
      </div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

const PERIODS = ['1M', '3M', '6M', 'YTD', '1Y'];

export default function StockDetail() {
  const { ticker } = useParams();
  const navigate = useNavigate();
  const stock = getStockByTicker(ticker);
  const [period, setPeriod] = useState('3M');
  const [activeTab, setActiveTab] = useState('overview');

  if (!stock) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <BarChart2 size={48} className="mb-4 opacity-30" />
        <p className="text-lg font-semibold">Stock not found: {ticker}</p>
        <button onClick={() => navigate('/')} className="mt-4 btn-secondary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const pos = stock.changePercent >= 0;

  // Slice price history by period
  const periodDays = { '1M': 21, '3M': 63, '6M': 126, 'YTD': 85, '1Y': 252 };
  const chartData = stock.priceHistory.slice(-Math.min(periodDays[period], stock.priceHistory.length));

  // Radar data
  const radarData = [
    { subject: 'Value', A: stock.factors.value, fullMark: 5 },
    { subject: 'Growth', A: stock.factors.growth, fullMark: 5 },
    { subject: 'Momentum', A: stock.factors.momentum, fullMark: 5 },
    { subject: 'Profit.', A: stock.factors.profitability, fullMark: 5 },
    { subject: 'Revisions', A: stock.factors.revisions, fullMark: 5 },
  ];

  const relatedPosts = communityPosts.filter((p) => p.ticker === stock.ticker);
  const allPosts = [...relatedPosts, ...communityPosts.slice(0, 2 - relatedPosts.length)];

  const communityTotal = stock.community.buy + stock.community.hold + stock.community.sell;
  const buyPct = ((stock.community.buy / communityTotal) * 100).toFixed(0);
  const holdPct = ((stock.community.hold / communityTotal) * 100).toFixed(0);
  const sellPct = ((stock.community.sell / communityTotal) * 100).toFixed(0);

  const upside = (((stock.priceTarget - stock.price) / stock.price) * 100).toFixed(1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Hero header */}
      <div className="card p-6 glow-card">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Left: identity */}
          <div className="flex items-center gap-4 flex-1">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-blue/30 to-brand-purple/20 border border-navy-500 flex items-center justify-center text-2xl font-extrabold text-blue-300">
              {stock.ticker.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-slate-100">{stock.ticker}</h1>
                <QuantGrade grade={stock.quantGrade} size="lg" showGlow />
              </div>
              <p className="text-slate-400 text-sm">{stock.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="badge bg-navy-600 text-slate-400">{stock.sector}</span>
                <span className="badge bg-navy-600 text-slate-400">{stock.industry}</span>
              </div>
            </div>
          </div>

          {/* Center: price */}
          <div className="text-center lg:text-right">
            <div className="text-4xl font-extrabold font-mono text-slate-100">
              ${fmt(stock.price)}
            </div>
            <div className={clsx('flex items-center justify-center lg:justify-end gap-1 mt-1 text-lg font-semibold', pos ? 'text-brand-green' : 'text-brand-red')}>
              {pos ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              {pos ? '+' : ''}{fmt(stock.change)} ({pos ? '+' : ''}{fmt(stock.changePercent)}%)
            </div>
            <p className="text-xs text-slate-500 mt-1">Simulated • Delayed 15min</p>
          </div>

          {/* Right: analyst target */}
          <div className="card p-4 min-w-[160px] text-center bg-navy-700">
            <div className="flex items-center justify-center gap-1.5 mb-1 text-xs text-slate-400">
              <Target size={12} /> Analyst Target
            </div>
            <div className="text-2xl font-extrabold font-mono text-slate-100">${stock.priceTarget}</div>
            <div className={clsx('text-sm font-semibold mt-0.5', parseFloat(upside) >= 0 ? 'text-brand-green' : 'text-brand-red')}>
              {upside >= 0 ? '+' : ''}{upside}% upside
            </div>
            <div
              className="mt-2 text-xs font-bold px-2 py-1 rounded-md"
              style={{ color: ratingColor[stock.analystRating] ?? '#94a3b8', background: `${ratingColor[stock.analystRating]}18` }}
            >
              {stock.analystRating}
            </div>
          </div>
        </div>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatBox label="Market Cap" value={fmtBig(stock.marketCap)} />
        <StatBox label="P/E Ratio" value={`${fmt(stock.pe, 1)}x`} />
        <StatBox label="P/S Ratio" value={`${fmt(stock.ps, 1)}x`} />
        <StatBox label="EV/EBITDA" value={`${fmt(stock.evEbitda, 1)}x`} />
        <StatBox label="Div. Yield" value={`${fmt(stock.dividendYield, 2)}%`} />
        <StatBox
          label="52W Range"
          value={`$${stock.weekLow52.toFixed(0)}–$${stock.weekHigh52.toFixed(0)}`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-navy-700">
        {['overview', 'financials', 'community'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
              activeTab === tab
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-slate-400 hover:text-slate-200',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Price chart */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">
                <TrendingUp size={16} className="text-brand-blue" /> Price Chart
              </h2>
              <div className="flex gap-1">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={clsx(
                      'px-2.5 py-1 text-xs rounded font-medium transition-colors',
                      period === p
                        ? 'bg-brand-blue text-white'
                        : 'text-slate-400 hover:bg-navy-700',
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={pos ? '#10b981' : '#ef4444'} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={pos ? '#10b981' : '#ef4444'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(36,54,89,0.5)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={fmtDate}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(v) => `$${v.toFixed(0)}`}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                  width={60}
                />
                <Tooltip
                  contentStyle={{ background: '#0d1526', border: '1px solid #243659', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8', fontSize: 12 }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(v) => [`$${v.toFixed(2)}`, stock.ticker]}
                  labelFormatter={fmtDate}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={pos ? '#10b981' : '#ef4444'}
                  strokeWidth={2}
                  fill="url(#priceGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: pos ? '#10b981' : '#ef4444' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quant Ratings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h2 className="section-title mb-5">
                <Star size={16} className="text-brand-yellow" /> Quant Rating Breakdown
              </h2>
              <div className="flex items-center gap-6 mb-6">
                <div className="text-center">
                  <QuantGrade grade={stock.quantGrade} size="xl" showGlow />
                  <p className="text-xs text-slate-500 mt-2">Overall Grade</p>
                </div>
                <div className="flex-1">
                  <div className="text-3xl font-extrabold font-mono text-slate-100">
                    {stock.quantScore.toFixed(2)}
                    <span className="text-slate-500 text-lg"> / 5.00</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Weighted composite of Value (20%), Growth (25%), Momentum (20%), Profitability (20%), Revisions (15%)
                  </p>
                </div>
              </div>
              <FactorScores factors={stock.factors} />
            </div>

            <div className="card p-5">
              <h2 className="section-title mb-4">
                <BarChart2 size={16} className="text-brand-purple" /> Factor Radar
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(36,54,89,0.6)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 5]}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                  />
                  <Radar
                    name="Score"
                    dataKey="A"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Description */}
          <div className="card p-5">
            <h2 className="section-title mb-3">About {stock.ticker}</h2>
            <p className="text-slate-300 text-sm leading-relaxed">{stock.description}</p>
          </div>
        </div>
      )}

      {activeTab === 'financials' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5 space-y-3">
            <h2 className="section-title mb-2">
              <DollarSign size={16} className="text-brand-green" /> Growth Metrics
            </h2>
            {[
              ['Revenue Growth (YoY)', `${stock.revenueGrowth >= 0 ? '+' : ''}${fmt(stock.revenueGrowth)}%`, stock.revenueGrowth],
              ['EPS Growth (YoY)', `${stock.epsGrowth >= 0 ? '+' : ''}${fmt(stock.epsGrowth)}%`, stock.epsGrowth],
              ['Return on Equity', `${fmt(stock.roe)}%`, stock.roe],
              ['Gross Margin', `${fmt(stock.grossMargin)}%`, stock.grossMargin],
              ['Operating Margin', `${fmt(stock.operatingMargin)}%`, stock.operatingMargin],
            ].map(([label, val, n]) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-navy-700 last:border-0">
                <span className="text-sm text-slate-400">{label}</span>
                <span className={clsx('text-sm font-bold font-mono', n >= 0 ? 'text-brand-green' : 'text-brand-red')}>
                  {val}
                </span>
              </div>
            ))}
          </div>

          <div className="card p-5 space-y-3">
            <h2 className="section-title mb-2">
              <BarChart2 size={16} className="text-brand-blue" /> Valuation Metrics
            </h2>
            {[
              ['Price / Earnings', `${fmt(stock.pe, 1)}x`],
              ['Price / Sales', `${fmt(stock.ps, 1)}x`],
              ['Price / Book', `${fmt(stock.pb, 1)}x`],
              ['EV / EBITDA', `${fmt(stock.evEbitda, 1)}x`],
              ['Dividend Yield', `${fmt(stock.dividendYield, 2)}%`],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-navy-700 last:border-0">
                <span className="text-sm text-slate-400">{label}</span>
                <span className="text-sm font-bold font-mono text-slate-200">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'community' && (
        <div className="space-y-6">
          {/* Community sentiment */}
          <div className="card p-5">
            <h2 className="section-title mb-4">
              <Users size={16} className="text-brand-cyan" /> Community Sentiment
            </h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-3 rounded-full overflow-hidden flex">
                <div
                  className="bg-brand-green h-full transition-all"
                  style={{ width: `${buyPct}%` }}
                />
                <div
                  className="bg-yellow-500 h-full transition-all"
                  style={{ width: `${holdPct}%` }}
                />
                <div
                  className="bg-brand-red h-full transition-all"
                  style={{ width: `${sellPct}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 text-center gap-3">
              <div>
                <div className="text-xl font-extrabold text-brand-green">{buyPct}%</div>
                <div className="text-xs text-slate-500">Buy ({stock.community.buy})</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-yellow-400">{holdPct}%</div>
                <div className="text-xs text-slate-500">Hold ({stock.community.hold})</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-brand-red">{sellPct}%</div>
                <div className="text-xs text-slate-500">Sell ({stock.community.sell})</div>
              </div>
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {allPosts.slice(0, 3).map((post) => (
              <div key={post.id} className="card p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: post.avatarColor }}
                  >
                    {post.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-200">{post.author}</span>
                      <span
                        className={clsx(
                          'badge',
                          post.rating === 'Buy' ? 'bg-brand-green/15 text-brand-green' :
                          post.rating === 'Sell' ? 'bg-brand-red/15 text-brand-red' :
                          'bg-slate-600/30 text-slate-400',
                        )}
                      >
                        {post.rating}
                      </span>
                      {post.priceTarget && (
                        <span className="badge bg-navy-600 text-slate-400">PT: ${post.priceTarget}</span>
                      )}
                      <span className="text-xs text-slate-500 ml-auto">
                        {new Date(post.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-100 mt-1">{post.title}</h3>
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed line-clamp-4">
                  {post.body.split('\n')[0]}
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  <button className="flex items-center gap-1 hover:text-brand-green transition-colors">
                    ▲ {post.upvotes}
                  </button>
                  <span>💬 {post.comments} comments</span>
                  {post.tags.map((t) => (
                    <span key={t} className="badge bg-navy-600 text-slate-500">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
