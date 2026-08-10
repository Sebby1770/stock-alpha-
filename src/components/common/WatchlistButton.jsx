import { Star } from 'lucide-react';
import clsx from 'clsx';
import { useWatchlist } from '../../context/WatchlistContext';

export default function WatchlistButton({
  ticker,
  size = 16,
  className,
  showLabel = false,
  stopPropagation = true,
}) {
  const { isWatched, toggle } = useWatchlist();
  const watched = isWatched(ticker);

  return (
    <button
      type="button"
      aria-label={watched ? `Remove ${ticker} from watchlist` : `Add ${ticker} to watchlist`}
      aria-pressed={watched}
      title={watched ? 'Remove from watchlist' : 'Add to watchlist'}
      onClick={(e) => {
        if (stopPropagation) {
          e.preventDefault();
          e.stopPropagation();
        }
        toggle(ticker);
      }}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-lg p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50',
        watched
          ? 'text-brand-yellow hover:bg-brand-yellow/10'
          : 'text-slate-500 hover:text-brand-yellow hover:bg-navy-700',
        className,
      )}
    >
      <Star size={size} fill={watched ? 'currentColor' : 'none'} strokeWidth={watched ? 0 : 2} />
      {showLabel && (
        <span className="text-xs font-medium">{watched ? 'Watching' : 'Watch'}</span>
      )}
    </button>
  );
}
