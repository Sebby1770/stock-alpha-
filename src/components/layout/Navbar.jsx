import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, Bell, TrendingUp, ChevronRight, X, Moon, Sun, Star, GitCompare,
} from 'lucide-react';
import { searchStocks } from '../../data/stocks';
import { indices } from '../../data/market';
import QuantGrade from '../common/QuantGrade';
import { useTheme } from '../../context/ThemeContext';
import { useWatchlist } from '../../context/WatchlistContext';
import { useCompare } from '../../context/CompareContext';
import { useAlerts } from '../../context/AlertsContext';
import clsx from 'clsx';

const fmt = (v, decimals = 2) => (v >= 0 ? '+' : '') + v.toFixed(decimals);

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();
  const { count: watchCount } = useWatchlist();
  const { count: compareCount } = useCompare();
  const { enabledCount: alertCount } = useAlerts();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setActiveIdx(-1);
      return;
    }
    setResults(searchStocks(query, 6));
    setActiveIdx(-1);
  }, [query]);

  // Keyboard shortcut: `/` focuses search (when not typing in an input)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = document.activeElement?.tagName;
        const editable = document.activeElement?.isContentEditable;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || editable) return;
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        setQuery('');
        setResults([]);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = useCallback((ticker) => {
    setQuery('');
    setResults([]);
    setActiveIdx(-1);
    navigate(`/stock/${ticker}`);
    inputRef.current?.blur();
  }, [navigate]);

  const onSearchKeyDown = (e) => {
    if (!results.length) {
      if (e.key === 'Enter' && query.trim()) {
        const hit = searchStocks(query, 1)[0];
        if (hit) go(hit.ticker);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = activeIdx >= 0 ? results[activeIdx] : results[0];
      if (pick) go(pick.ticker);
    }
  };

  const tickerItems = [...indices, ...indices];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col border-b border-navy-600 glass">
      {/* Ticker tape */}
      <div className="h-8 overflow-hidden border-b border-navy-700 bg-navy-950/60" aria-hidden="true">
        <div className="ticker-tape h-full items-center flex gap-8 px-4">
          {tickerItems.map((idx, i) => (
            <div key={i} className="flex items-center gap-2 whitespace-nowrap text-xs">
              <span className="text-slate-400 font-medium">{idx.symbol}</span>
              <span className="font-mono text-slate-200">{idx.value.toLocaleString()}</span>
              <span
                className={clsx(
                  'font-mono text-xs',
                  idx.changePct >= 0 ? 'text-brand-green' : 'text-brand-red',
                )}
              >
                {fmt(idx.changePct)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main nav */}
      <div className="h-14 flex items-center px-4 gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0 mr-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center">
            <TrendingUp size={16} className="text-white" aria-hidden="true" />
          </div>
          <span className="text-base font-extrabold gradient-text hidden sm:block">AlphaRank</span>
        </Link>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" aria-hidden="true" />
            <input
              ref={inputRef}
              id="global-search"
              type="search"
              role="combobox"
              aria-expanded={focused && results.length > 0}
              aria-controls="search-results"
              aria-autocomplete="list"
              aria-activedescendant={activeIdx >= 0 ? `search-opt-${activeIdx}` : undefined}
              placeholder="Search ticker or company…  (/)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              onKeyDown={onSearchKeyDown}
              className="input pl-9 pr-16 h-9 focus-visible:ring-2 focus-visible:ring-brand-blue/40"
            />
            <kbd className="absolute right-8 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-navy-500 bg-navy-700 text-[10px] text-slate-500 font-mono">
              /
            </kbd>
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50 rounded"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {focused && results.length > 0 && (
            <div
              id="search-results"
              role="listbox"
              className="absolute top-full mt-1 w-full bg-navy-800 border border-navy-500 rounded-xl shadow-card-hover z-50 overflow-hidden animate-fade-in"
            >
              {results.map((s, i) => (
                <button
                  key={s.ticker}
                  id={`search-opt-${i}`}
                  role="option"
                  aria-selected={i === activeIdx}
                  type="button"
                  onMouseDown={() => go(s.ticker)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left focus-visible:outline-none',
                    i === activeIdx ? 'bg-navy-700' : 'hover:bg-navy-700',
                  )}
                >
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-brand-blue/30 to-brand-purple/20 border border-navy-500 flex items-center justify-center text-xs font-bold text-blue-300">
                    {s.ticker.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-200">{s.ticker}</div>
                    <div className="text-xs text-slate-500 truncate">{s.name}</div>
                  </div>
                  <QuantGrade grade={s.quantGrade} size="xs" showTooltip={false} />
                  <ChevronRight size={14} className="text-slate-600" aria-hidden="true" />
                </button>
              ))}
            </div>
          )}

          {focused && query.trim() && results.length === 0 && (
            <div className="absolute top-full mt-1 w-full bg-navy-800 border border-navy-500 rounded-xl shadow-card-hover z-50 px-4 py-3 text-sm text-slate-500">
              No stocks match “{query}”
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          <div className="hidden md:flex items-center gap-1 text-xs bg-brand-green/10 text-brand-green border border-brand-green/20 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse-slow" aria-hidden="true" />
            Market Open
          </div>

          <Link
            to="/watchlist"
            aria-label={`Watchlist, ${watchCount} stocks`}
            className="relative btn-ghost p-2 focus-visible:ring-2 focus-visible:ring-brand-blue/50"
            title="Watchlist"
          >
            <Star size={18} />
            {watchCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-brand-yellow text-[10px] font-bold text-navy-900 flex items-center justify-center">
                {watchCount}
              </span>
            )}
          </Link>

          <Link
            to="/compare"
            aria-label={`Compare, ${compareCount} selected`}
            className="relative btn-ghost p-2 focus-visible:ring-2 focus-visible:ring-brand-blue/50"
            title="Compare"
          >
            <GitCompare size={18} />
            {compareCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-brand-purple text-[10px] font-bold text-white flex items-center justify-center">
                {compareCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Light mode' : 'Dark mode'}
            className="btn-ghost p-2 focus-visible:ring-2 focus-visible:ring-brand-blue/50"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link
            to="/alerts"
            aria-label={`Alerts, ${alertCount} enabled`}
            className="relative btn-ghost p-2 focus-visible:ring-2 focus-visible:ring-brand-blue/50"
            title="Alerts"
          >
            <Bell size={18} />
            {alertCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-brand-blue text-[10px] font-bold text-white flex items-center justify-center">
                {alertCount}
              </span>
            ) : (
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-blue rounded-full" aria-hidden="true" />
            )}
          </Link>
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-xs font-bold text-white"
            aria-hidden="true"
          >
            U
          </div>
        </div>
      </div>
    </header>
  );
}
