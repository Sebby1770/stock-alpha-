import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { Search, TrendingUp, ChevronRight, Menu, X } from 'lucide-react';
import { stocks } from '../../data/stocks';
import { indices } from '../../data/market';
import { DATA_SNAPSHOT } from '../../data/metadata';
import QuantGrade from '../common/QuantGrade';
import clsx from 'clsx';

const fmt = (v, decimals = 2) => (v >= 0 ? '+' : '') + v.toFixed(decimals);

const mobileNavItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/screener', label: 'Screener' },
  { to: '/signals', label: 'Signals' },
  { to: '/community', label: 'Community' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/ops', label: 'Production Ops' },
];

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [focused, setFocused] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const inputRef = useRef(null);
  const mobileNavButtonRef = useRef(null);
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

  useEffect(() => {
    if (!mobileNavOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setMobileNavOpen(false);
        mobileNavButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileNavOpen]);

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
      <div className="flex h-8 border-b border-navy-700 bg-navy-950/60">
        <div className="z-10 flex shrink-0 items-center border-r border-yellow-500/30 bg-yellow-500/10 px-3 text-[10px] font-bold uppercase tracking-wider text-yellow-300 sm:text-xs">
          <span className="sm:hidden">Simulated · {DATA_SNAPSHOT.date}</span>
          <span className="hidden sm:inline">{DATA_SNAPSHOT.mode} · Snapshot {DATA_SNAPSHOT.label}</span>
        </div>
        <div className="min-w-0 flex-1 overflow-hidden" aria-label="Simulated market snapshot">
          <div className="ticker-tape flex h-full items-center gap-8 px-4">
            {tickerItems.map((idx, i) => (
              <div key={`${idx.symbol}-${i}`} className="flex items-center gap-2 whitespace-nowrap text-xs">
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
      </div>

      {/* Main nav */}
      <div className="h-14 flex items-center gap-2 px-4 sm:gap-4">
        {/* Logo */}
        <Link to="/" className="mr-0 flex shrink-0 items-center gap-2 sm:mr-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="text-base font-extrabold gradient-text hidden sm:block">AlphaRank</span>
        </Link>

        {/* Search */}
        <div className="relative min-w-0 flex-1 max-w-md">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search ticker or company..."
              aria-label="Search ticker or company"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              className="input pl-9 pr-8 h-9"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setResults([]); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                aria-label="Clear stock search"
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
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => go(s.ticker)}
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
          <div className="hidden md:flex items-center gap-1 text-xs bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-300" />
            Demo Snapshot
          </div>
          <button
            ref={mobileNavButtonRef}
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg border border-navy-500 text-slate-300 transition-colors hover:border-brand-blue/40 hover:bg-navy-700 hover:text-white lg:hidden"
            aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-controls="mobile-navigation"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileNavOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Primary navigation"
          className="absolute left-3 right-3 top-full grid grid-cols-2 gap-1 rounded-xl border border-navy-500 bg-navy-800 p-2 shadow-card-hover lg:hidden"
        >
          {mobileNavItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) => clsx(
                'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-blue/10 text-brand-blue'
                  : 'text-slate-300 hover:bg-navy-700 hover:text-white',
              )}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
