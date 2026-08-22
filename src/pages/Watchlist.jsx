import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Search, Star, Trash2, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import { stocks } from '../data/stocks';
import { useResearch } from '../context/ResearchContext';
import QuantGrade from '../components/common/QuantGrade';
import MiniChart from '../components/common/MiniChart';

const formatPercent = (value) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

export default function Watchlist() {
  const navigate = useNavigate();
  const { watchlist, toggleWatchlist } = useResearch();
  const [sortBy, setSortBy] = useState('quantScore');
  const [query, setQuery] = useState('');

  const watchedStocks = useMemo(() => watchlist
    .map((ticker) => stocks.find((stock) => stock.ticker === ticker))
    .filter(Boolean)
    .filter((stock) => {
      const normalized = query.trim().toLowerCase();
      return !normalized || stock.ticker.toLowerCase().includes(normalized) || stock.name.toLowerCase().includes(normalized);
    })
    .sort((a, b) => {
      if (sortBy === 'ticker') return a.ticker.localeCompare(b.ticker);
      return (b[sortBy] ?? 0) - (a[sortBy] ?? 0);
    }), [watchlist, query, sortBy]);

  const allWatched = watchlist
    .map((ticker) => stocks.find((stock) => stock.ticker === ticker))
    .filter(Boolean);
  const averageScore = allWatched.length
    ? allWatched.reduce((sum, stock) => sum + stock.quantScore, 0) / allWatched.length
    : 0;
  const averageUpside = allWatched.length
    ? allWatched.reduce((sum, stock) => sum + ((stock.priceTarget - stock.price) / stock.price) * 100, 0) / allWatched.length
    : 0;
  const strongest = [...allWatched].sort((a, b) => b.quantScore - a.quantScore)[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow"><Star size={13} /> Personal research</div>
          <h1 className="page-title">Watchlist</h1>
          <p className="page-subtitle">A persistent shortlist for the companies you are actively researching.</p>
        </div>
        {watchlist.length > 1 && (
          <button
            className="btn-primary flex items-center justify-center gap-2"
            onClick={() => navigate(`/compare?symbols=${watchlist.slice(0, 4).join(',')}`)}
          >
            <BarChart3 size={15} /> Compare top {Math.min(watchlist.length, 4)}
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="metric-card">
          <span className="metric-label">Tracked companies</span>
          <strong className="metric-value">{watchlist.length}</strong>
          <span className="metric-note">saved on this device</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Average quant score</span>
          <strong className="metric-value text-brand-blue">{averageScore.toFixed(2)}</strong>
          <span className="metric-note">out of 5.00</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Average target upside</span>
          <strong className={clsx('metric-value', averageUpside >= 0 ? 'text-brand-green' : 'text-brand-red')}>
            {formatPercent(averageUpside)}
          </strong>
          <span className="metric-note">strongest: {strongest?.ticker || '—'}</span>
        </div>
      </div>

      {watchlist.length > 0 ? (
        <section className="card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-navy-700 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <label htmlFor="watchlist-search" className="sr-only">Search watchlist</label>
              <input
                id="watchlist-search"
                className="input h-9 pl-9"
                placeholder="Search your watchlist"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              Sort by
              <select className="select h-9 w-auto" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="quantScore">Quant score</option>
                <option value="changePercent">Daily move</option>
                <option value="marketCap">Market cap</option>
                <option value="ticker">Ticker</option>
              </select>
            </label>
          </div>

          <div className="divide-y divide-navy-700/70">
            {watchedStocks.map((stock) => {
              const upside = ((stock.priceTarget - stock.price) / stock.price) * 100;
              return (
                <article
                  key={stock.ticker}
                  className="group grid grid-cols-[1fr_auto] gap-4 p-4 transition-colors hover:bg-navy-750 sm:grid-cols-[1.3fr_.8fr_.7fr_.8fr_auto] sm:items-center"
                >
                  <Link className="flex min-w-0 items-center gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue" to={`/stock/${stock.ticker}`}>
                    <div className="stock-mark">{stock.ticker.slice(0, 2)}</div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-100 group-hover:text-blue-300">{stock.ticker}</div>
                      <div className="truncate text-xs text-slate-400">{stock.name}</div>
                    </div>
                  </Link>
                  <div className="hidden sm:block">
                    <div className="font-mono text-sm font-bold text-slate-200">${stock.price.toFixed(2)}</div>
                    <div className={clsx('text-xs', stock.changePercent >= 0 ? 'text-brand-green' : 'text-brand-red')}>
                      {formatPercent(stock.changePercent)} today
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs text-slate-500">Target upside</div>
                    <div className={clsx('font-mono text-sm font-semibold', upside >= 0 ? 'text-brand-green' : 'text-brand-red')}>
                      {formatPercent(upside)}
                    </div>
                  </div>
                  <div className="hidden items-center gap-3 sm:flex">
                    <QuantGrade grade={stock.quantGrade} size="sm" />
                    <div className="w-20"><MiniChart data={stock.priceHistory.slice(-30)} positive={stock.changePercent >= 0} height={34} /></div>
                  </div>
                  <button
                    className="icon-button text-slate-500 hover:text-brand-red"
                    aria-label={`Remove ${stock.ticker} from watchlist`}
                    title="Remove from watchlist"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleWatchlist(stock.ticker);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </article>
              );
            })}
            {watchedStocks.length === 0 && (
              <div className="p-12 text-center text-sm text-slate-500">No watched companies match “{query}”.</div>
            )}
          </div>
        </section>
      ) : (
        <div className="empty-state">
          <Star size={32} />
          <h2>Your research shortlist is empty</h2>
          <p>Star companies from the screener or a stock detail page to keep them here.</p>
          <button className="btn-primary flex items-center gap-2" onClick={() => navigate('/screener')}>
            Explore the screener <ArrowRight size={14} />
          </button>
        </div>
      )}

      <div className="data-notice">
        <TrendingUp size={15} />
        Prices and targets are deterministic demo data, not live market quotes. Watchlist changes are stored locally in your browser.
      </div>
    </div>
  );
}
