import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, TrendingUp, ChevronRight, X, Star, Database } from 'lucide-react';
import { stocks } from '../../data/stocks';
import { indices } from '../../data/market';
import QuantGrade from '../common/QuantGrade';
import clsx from 'clsx';
import { useResearch } from '../../context/ResearchContext';

const fmt = (v, decimals = 2) => (v >= 0 ? '+' : '') + v.toFixed(decimals);

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [focused, setFocused] = useState(false);
  const [activeResult, setActiveResult] = useState(-1);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { watchlist } = useResearch();

  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === 'Escape' && document.activeElement === inputRef.current) {
        setQuery('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    setActiveResult(-1);
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase();
    setResults(
      stocks
        .filter(
          (s) =>
            s.ticker.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q),
        )
        .slice(0, 6),
    );
  }, [query]);

  const go = (ticker) => {
    setQuery('');
    setResults([]);
    setActiveResult(-1);
    navigate(`/stock/${ticker}`);
    inputRef.current?.blur();
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown' && results.length) {
      event.preventDefault();
      setActiveResult((current) => (current + 1) % results.length);
    } else if (event.key === 'ArrowUp' && results.length) {
      event.preventDefault();
      setActiveResult((current) => (current <= 0 ? results.length - 1 : current - 1));
    } else if (event.key === 'Enter' && activeResult >= 0) {
      event.preventDefault();
      go(results[activeResult].ticker);
    } else if (event.key === 'Escape') {
      setFocused(false);
      setActiveResult(-1);
    }
  };

  const tickerItems = [...indices, ...indices]; // double for seamless loop

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col border-b border-navy-600 glass">
      {/* Ticker tape */}
      <div className="h-8 overflow-hidden border-b border-navy-700 bg-navy-950/60">
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
        {/* Logo */}
        <Link to="/" aria-label="AlphaRank home" className="flex items-center gap-2 shrink-0 mr-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="text-base font-extrabold gradient-text hidden sm:block">AlphaRank</span>
        </Link>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search ticker or company..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              className="input pl-9 pr-8 h-9"
              role="combobox"
              aria-label="Search stocks"
              aria-expanded={focused && results.length > 0}
              aria-controls="stock-search-results"
              aria-autocomplete="list"
              aria-activedescendant={activeResult >= 0 && results[activeResult]
                ? `stock-result-${results[activeResult].ticker}`
                : undefined}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setResults([]); setActiveResult(-1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {focused && results.length > 0 && (
            <div id="stock-search-results" role="listbox" className="absolute top-full mt-1 w-full bg-navy-800 border border-navy-500 rounded-xl shadow-card-hover z-50 overflow-hidden animate-fade-in">
              {results.map((s, index) => (
                <button
                  key={s.ticker}
                  id={`stock-result-${s.ticker}`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => go(s.ticker)}
                  onMouseEnter={() => setActiveResult(index)}
                  role="option"
                  aria-selected={activeResult === index}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-2.5 hover:bg-navy-700 transition-colors text-left',
                    activeResult === index && 'bg-navy-700',
                  )}
                >
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-brand-blue/30 to-brand-purple/20 border border-navy-500 flex items-center justify-center text-xs font-bold text-blue-300">
                    {s.ticker.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-200">{s.ticker}</div>
                    <div className="text-xs text-slate-500 truncate">{s.name}</div>
                  </div>
                  <QuantGrade grade={s.quantGrade} size="xs" />
                  <ChevronRight size={14} className="text-slate-600" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="hidden md:flex items-center gap-1.5 text-xs bg-brand-blue/10 text-blue-300 border border-brand-blue/20 rounded-full px-3 py-1">
            <Database size={11} />
            Demo data
          </div>
          <Link to="/watchlist" className="relative btn-ghost flex items-center gap-1.5 p-2" aria-label={`Open watchlist with ${watchlist.length} companies`}>
            <Star size={17} />
            <span className="hidden text-xs sm:block">{watchlist.length}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
