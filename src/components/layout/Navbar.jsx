import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Bell, TrendingUp, ChevronRight, X } from 'lucide-react';
import { stocks } from '../../data/stocks';
import { indices } from '../../data/market';
import QuantGrade from '../common/QuantGrade';
import clsx from 'clsx';

const fmt = (v, decimals = 2) => (v >= 0 ? '+' : '') + v.toFixed(decimals);

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
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
    navigate(`/stock/${ticker}`);
    inputRef.current?.blur();
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
        <Link to="/" className="flex items-center gap-2 shrink-0 mr-2">
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
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              className="input pl-9 pr-8 h-9"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setResults([]); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {focused && results.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-navy-800 border border-navy-500 rounded-xl shadow-card-hover z-50 overflow-hidden animate-fade-in">
              {results.map((s) => (
                <button
                  key={s.ticker}
                  onMouseDown={() => go(s.ticker)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-navy-700 transition-colors text-left"
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
          <div className="hidden md:flex items-center gap-1 text-xs bg-brand-green/10 text-brand-green border border-brand-green/20 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse-slow" />
            Market Open
          </div>
          <button className="relative btn-ghost p-2">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-brand-blue rounded-full" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-xs font-bold text-white cursor-pointer">
            U
          </div>
        </div>
      </div>
    </header>
  );
}
