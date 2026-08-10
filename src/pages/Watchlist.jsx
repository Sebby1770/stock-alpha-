import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Trash2, ArrowRight } from 'lucide-react';
import { stocks } from '../data/stocks';
import { useWatchlist } from '../context/WatchlistContext';
import { useCompare } from '../context/CompareContext';
import StockCard from '../components/common/StockCard';
import QuantGrade from '../components/common/QuantGrade';
import EmptyState from '../components/common/EmptyState';
import WatchlistButton from '../components/common/WatchlistButton';
import MiniChart from '../components/common/MiniChart';
import clsx from 'clsx';

export default function Watchlist() {
  const navigate = useNavigate();
  const { tickers, clear, count } = useWatchlist();
  const { toggle: toggleCompare, isSelected, canAdd } = useCompare();

  const watched = useMemo(
    () => tickers.map((t) => stocks.find((s) => s.ticker === t)).filter(Boolean),
    [tickers],
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Star size={22} className="text-brand-yellow" />
            Watchlist
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {count} stock{count === 1 ? '' : 's'} · saved in this browser
          </p>
        </div>
        <div className="flex items-center gap-2">
          {count > 0 && (
            <button
              type="button"
              onClick={clear}
              className="btn-secondary flex items-center gap-2 text-brand-red/90"
            >
              <Trash2 size={14} /> Clear all
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/screener')}
            className="btn-primary flex items-center gap-2"
          >
            Find stocks <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {watched.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Star}
            title="Your watchlist is empty"
            description="Star stocks from the dashboard, screener, or detail pages. Your list is saved in localStorage."
            action={
              <button type="button" onClick={() => navigate('/screener')} className="btn-primary">
                Open Screener
              </button>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {watched.map((stock) => (
              <StockCard key={stock.ticker} stock={stock} />
            ))}
          </div>

          <div className="card overflow-hidden">
            <div className="p-5 border-b border-navy-700">
              <h2 className="section-title">Watchlist table</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-navy-700 bg-navy-850">
                    <th className="text-left px-5 py-3 font-medium">Ticker</th>
                    <th className="text-right px-3 py-3 font-medium">Price</th>
                    <th className="text-right px-3 py-3 font-medium">Chg%</th>
                    <th className="text-center px-3 py-3 font-medium">Grade</th>
                    <th className="text-right px-3 py-3 font-medium">Score</th>
                    <th className="text-center px-3 py-3 font-medium hidden md:table-cell">30D</th>
                    <th className="text-right px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {watched.map((s) => {
                    const pos = s.changePercent >= 0;
                    return (
                      <tr
                        key={s.ticker}
                        className="table-row text-sm border-b border-navy-700/50"
                        onClick={() => navigate(`/stock/${s.ticker}`)}
                      >
                        <td className="px-5 py-3">
                          <div className="font-bold text-slate-200">{s.ticker}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[140px]">{s.name}</div>
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-semibold text-slate-200">
                          ${s.price.toFixed(2)}
                        </td>
                        <td
                          className={clsx(
                            'px-3 py-3 text-right font-mono font-semibold',
                            pos ? 'text-brand-green' : 'text-brand-red',
                          )}
                        >
                          {pos ? '+' : ''}
                          {s.changePercent.toFixed(2)}%
                        </td>
                        <td className="px-3 py-3 text-center">
                          <QuantGrade grade={s.quantGrade} size="sm" />
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-slate-200">
                          {s.quantScore.toFixed(2)}
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <div className="w-16 mx-auto">
                            <MiniChart data={s.priceHistory} positive={pos} height={28} />
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <WatchlistButton ticker={s.ticker} />
                            <button
                              type="button"
                              disabled={!isSelected(s.ticker) && !canAdd}
                              onClick={() => toggleCompare(s.ticker)}
                              className={clsx(
                                'text-xs px-2 py-1 rounded-md border transition-colors focus-visible:ring-2 focus-visible:ring-brand-blue/50',
                                isSelected(s.ticker)
                                  ? 'border-brand-purple/40 bg-brand-purple/15 text-brand-purple'
                                  : 'border-navy-500 text-slate-400 hover:text-slate-200',
                              )}
                            >
                              {isSelected(s.ticker) ? 'In compare' : 'Compare'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
