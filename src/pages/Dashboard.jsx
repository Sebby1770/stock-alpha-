import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Zap, Users, BarChart2,
  ArrowUpRight, Newspaper, ChevronRight, Activity,
} from 'lucide-react';
import { stocks } from '../data/stocks';
import { sectorPerformance, marketNews, indices } from '../data/market';
import { communityPosts } from '../data/community';
import StockCard from '../components/common/StockCard';
import QuantGrade from '../components/common/QuantGrade';
import MiniChart from '../components/common/MiniChart';
import clsx from 'clsx';
import {
  ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

const fmt = (n, d = 2) => (n >= 0 ? '+' : '') + n.toFixed(d);
const fmtBig = (n) => {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  return `$${n}`;
};

const topRated = [...stocks].sort((a, b) => b.quantScore - a.quantScore).slice(0, 6);
const topMomentum = [...stocks].sort((a, b) => b.factors.momentum - a.factors.momentum).slice(0, 5);
const recentPosts = communityPosts.slice(0, 4);

function IndexCard({ idx }) {
  const pos = idx.changePct >= 0;
  return (
    <div className="stat-card glow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{idx.name}</span>
        <span className={clsx('text-xs font-medium', pos ? 'text-brand-green' : 'text-brand-red')}>
          {fmt(idx.changePct)}%
        </span>
      </div>
      <div className="text-xl font-bold font-mono text-slate-100">
        {typeof idx.value === 'number' && idx.value > 1000
          ? idx.value.toLocaleString()
          : idx.value.toFixed(2)}
      </div>
      <div className={clsx('text-xs', pos ? 'text-brand-green' : 'text-brand-red')}>
        {pos ? '+' : ''}{idx.change.toLocaleString()} pts
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const displayedIndices = indices.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-800 via-navy-750 to-navy-800 border border-navy-600 p-6">
        <div className="absolute inset-0 bg-gradient-radial from-brand-blue/8 via-transparent to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-brand-yellow" />
            <span className="text-xs font-semibold text-brand-yellow uppercase tracking-widest">
              Quant-Powered Analysis
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 mb-1">
            AlphaRank Research Platform
          </h1>
          <p className="text-slate-400 text-sm max-w-lg">
            Explore factor-based model ratings, synthetic community research, and screening workflows using a clearly labelled educational dataset.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <button onClick={() => navigate('/screener')} className="btn-primary flex items-center gap-2">
              <BarChart2 size={15} /> Open Screener
            </button>
            <button onClick={() => navigate('/signals')} className="btn-secondary flex items-center gap-2">
              <Activity size={15} /> Signal Lab
            </button>
            <button onClick={() => navigate('/community')} className="btn-secondary flex items-center gap-2">
              <Users size={15} /> Community Picks
            </button>
          </div>
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden xl:flex gap-2 opacity-20">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1 bg-brand-blue rounded-full" style={{ height: 20 + i * 12 }} />
          ))}
        </div>
      </div>

      {/* Market indices */}
      <section>
        <h2 className="section-title mb-3">
          <TrendingUp size={16} className="text-brand-blue" />
          Simulated Market Snapshot
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {displayedIndices.map((idx) => (
            <IndexCard key={idx.symbol} idx={idx} />
          ))}
        </div>
      </section>

      {/* Top Quant Rated */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">
            <Zap size={16} className="text-brand-yellow" />
            Top Quant Rated
          </h2>
          <button
            onClick={() => navigate('/screener')}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            View all <ChevronRight size={13} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topRated.map((stock) => (
            <StockCard key={stock.ticker} stock={stock} />
          ))}
        </div>
      </section>

      {/* Sector performance + Momentum */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Sector heatmap */}
        <section className="card p-5">
          <h2 className="section-title mb-4">
            <BarChart2 size={16} className="text-brand-teal" />
            Sector Performance (YTD)
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={sectorPerformance}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(36,54,89,0.4)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                width={130}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) => [`${v > 0 ? '+' : ''}${v.toFixed(1)}%`, 'YTD Return']}
                contentStyle={{ background: '#0d1526', border: '1px solid #243659', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8', fontSize: 12 }}
                itemStyle={{ color: '#e2e8f0', fontSize: 12 }}
              />
              <Bar dataKey="ytd" radius={[0, 4, 4, 0]}>
                {sectorPerformance.map((entry, i) => (
                  <Cell key={i} fill={entry.ytd >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Momentum leaders */}
        <section className="card p-5">
          <h2 className="section-title mb-4">
            <TrendingUp size={16} className="text-brand-purple" />
            Momentum Leaders
          </h2>
          <div className="space-y-3">
            {topMomentum.map((s, i) => (
              <button
                type="button"
                key={s.ticker}
                className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-navy-750 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                onClick={() => navigate(`/stock/${s.ticker}`)}
              >
                <span className="text-xs font-bold text-slate-500 w-4">{i + 1}</span>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-purple/30 to-brand-blue/20 border border-navy-500 flex items-center justify-center text-xs font-bold text-purple-300">
                  {s.ticker.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-200">{s.ticker}</div>
                  <div className="text-xs text-slate-500 truncate">{s.name}</div>
                </div>
                <div className="flex-1 max-w-[80px]">
                  <MiniChart data={s.priceHistory} positive={s.changePercent >= 0} height={32} />
                </div>
                <div className="text-right">
                  <div className={clsx('text-sm font-bold font-mono', s.changePercent >= 0 ? 'text-brand-green' : 'text-brand-red')}>
                    {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
                  </div>
                  <QuantGrade grade={s.quantGrade} size="xs" />
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Community Analysis + News */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Community */}
        <section className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">
              <Users size={16} className="text-brand-cyan" />
              Synthetic Community
            </h2>
            <button
              type="button"
              onClick={() => navigate('/community')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View all <ChevronRight size={13} />
            </button>
          </div>
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <button
                type="button"
                key={post.id}
                onClick={() => navigate('/community')}
                className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-navy-750 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: post.avatarColor }}
                >
                  {post.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-slate-300">{post.ticker}</span>
                    <span
                      className={clsx(
                        'badge text-xs',
                        post.rating === 'Buy' ? 'bg-brand-green/15 text-brand-green' :
                        post.rating === 'Sell' ? 'bg-brand-red/15 text-brand-red' :
                        'bg-slate-600/30 text-slate-400',
                      )}
                    >
                      {post.rating}
                    </span>
                    {post.priceTarget && (
                      <span className="text-xs text-slate-500">PT: ${post.priceTarget}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span>{post.author}</span>
                    <span>▲ {post.upvotes}</span>
                    <span>💬 {post.comments}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Market news */}
        <section className="card p-5">
          <h2 className="section-title mb-4">
            <Newspaper size={16} className="text-brand-yellow" />
            Market News
          </h2>
          <div className="space-y-3">
            {marketNews.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-start gap-3 py-2 border-b border-navy-700 last:border-0">
                <span
                  className={clsx(
                    'shrink-0 w-1.5 h-1.5 rounded-full mt-1.5',
                    item.sentiment === 'positive' ? 'bg-brand-green' : 'bg-brand-red',
                  )}
                />
                <div>
                  <p className="text-sm text-slate-200 leading-snug">{item.headline}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span>{item.source}</span>
                    <span>·</span>
                    <span>{item.time}</span>
                    {item.tickers.map((t) => (
                      <button
                        key={t}
                        onClick={() => stocks.find((s) => s.ticker === t) && navigate(`/stock/${t}`)}
                        className="text-blue-400 hover:text-blue-300 font-mono"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Full screener preview table */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-navy-700">
          <h2 className="section-title">
            <BarChart2 size={16} className="text-brand-blue" />
            All Covered Stocks
          </h2>
          <button onClick={() => navigate('/screener')} className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
            Full Screener <ArrowUpRight size={13} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-navy-700">
                <th className="text-left px-5 py-3 font-medium">Ticker</th>
                <th className="text-left px-3 py-3 font-medium hidden md:table-cell">Sector</th>
                <th className="text-right px-3 py-3 font-medium">Price</th>
                <th className="text-right px-3 py-3 font-medium">Chg%</th>
                <th className="text-center px-3 py-3 font-medium">Rating</th>
                <th className="text-right px-3 py-3 font-medium hidden lg:table-cell">Mkt Cap</th>
                <th className="text-right px-3 py-3 font-medium hidden xl:table-cell">P/E</th>
                <th className="text-right px-5 py-3 font-medium hidden xl:table-cell">Quant</th>
              </tr>
            </thead>
            <tbody>
              {stocks.slice(0, 10).map((s) => {
                const pos = s.changePercent >= 0;
                return (
                  <tr
                    key={s.ticker}
                    className="table-row text-sm"
                  >
                    <td className="px-5 py-3">
                      <Link
                        to={`/stock/${s.ticker}`}
                        className="block max-w-[140px] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                      >
                        <span className="block font-bold text-slate-200 hover:text-blue-300">{s.ticker}</span>
                        <span className="hidden truncate text-xs text-slate-500 sm:block">{s.name}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-400 hidden md:table-cell">{s.sector}</td>
                    <td className="px-3 py-3 text-right font-mono font-semibold text-slate-200">
                      ${s.price.toFixed(2)}
                    </td>
                    <td className={clsx('px-3 py-3 text-right font-mono text-sm font-semibold', pos ? 'text-brand-green' : 'text-brand-red')}>
                      {pos ? '+' : ''}{s.changePercent.toFixed(2)}%
                    </td>
                    <td className="px-3 py-3 text-center">
                      <QuantGrade grade={s.quantGrade} size="sm" />
                    </td>
                    <td className="px-3 py-3 text-right text-slate-400 text-xs hidden lg:table-cell">
                      {fmtBig(s.marketCap)}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-400 text-xs hidden xl:table-cell">
                      {s.pe.toFixed(1)}x
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-200 hidden xl:table-cell">
                      {s.quantScore.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
