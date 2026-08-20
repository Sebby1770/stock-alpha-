import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, LayoutDashboard, SlidersHorizontal, FlaskConical, Bell,
  Grid3x3, Briefcase, Star, GitCompare, TrendingUp, LineChart,
} from 'lucide-react';
import { stocks } from '../../data/stocks';
import clsx from 'clsx';

const ROUTES = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Screener', to: '/screener', icon: SlidersHorizontal },
  { label: 'Lab', to: '/lab', icon: FlaskConical },
  { label: 'Alerts', to: '/alerts', icon: Bell },
  { label: 'Matrix', to: '/matrix', icon: Grid3x3 },
  { label: 'Simulate', to: '/simulate', icon: LineChart },
  { label: 'Portfolio', to: '/portfolio', icon: Briefcase },
  { label: 'Watchlist', to: '/watchlist', icon: Star },
  { label: 'Compare', to: '/compare', icon: GitCompare },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIdx(0);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const metaK = (e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K');
      if (metaK) {
        e.preventDefault();
        setOpen((v) => {
          const next = !v;
          if (!next) {
            setQuery('');
            setActiveIdx(0);
          }
          return next;
        });
        return;
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  useEffect(() => {
    if (open) {
      setActiveIdx(0);
      const t = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(t);
    }
    return undefined;
  }, [open]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const routes = ROUTES
      .filter((r) => !q || r.label.toLowerCase().includes(q) || r.to.toLowerCase().includes(q))
      .map((r) => ({ kind: 'route', ...r }));
    const tickers = stocks
      .filter((s) => {
        if (!q) return true;
        return (
          s.ticker.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q)
        );
      })
      .slice(0, q ? 12 : 8)
      .map((s) => ({
        kind: 'stock',
        label: s.ticker,
        sub: s.name,
        to: `/stock/${s.ticker}`,
        icon: TrendingUp,
      }));
    return [...routes, ...tickers];
  }, [query]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  const go = useCallback((item) => {
    if (!item) return;
    navigate(item.to);
    close();
  }, [navigate, close]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (items.length ? (i <= 0 ? items.length - 1 : i - 1) : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = items[activeIdx] ?? items[0];
      go(pick);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <button
        type="button"
        className="absolute inset-0 bg-navy-950/70 backdrop-blur-sm"
        aria-label="Close command palette"
        onClick={close}
      />
      <div className="relative w-full max-w-lg card overflow-hidden shadow-card-hover">
        <div className="relative border-b border-navy-700">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" aria-hidden="true" />
          <input
            ref={inputRef}
            className="input border-0 rounded-none pl-9 pr-16 h-11 focus:ring-0 focus:border-transparent"
            placeholder="Jump to a page or ticker…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            aria-autocomplete="list"
            aria-controls="cmdk-results"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-navy-500 bg-navy-700 text-[10px] text-slate-500 font-mono">
            Esc
          </kbd>
        </div>
        <ul id="cmdk-results" role="listbox" className="max-h-80 overflow-y-auto py-1">
          {items.length === 0 && (
            <li className="px-4 py-6 text-sm text-slate-500 text-center">No matches</li>
          )}
          {items.map((item, i) => {
            const Icon = item.icon;
            const active = i === activeIdx;
            return (
              <li key={`${item.kind}-${item.to}-${item.label}`} role="option" aria-selected={active}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => go(item)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-2 text-left text-sm',
                    active ? 'bg-navy-700 text-slate-100' : 'text-slate-300 hover:bg-navy-750',
                  )}
                >
                  <Icon size={15} className={item.kind === 'route' ? 'text-brand-blue' : 'text-slate-500'} aria-hidden="true" />
                  <span className="font-semibold">{item.label}</span>
                  {item.sub && <span className="text-xs text-slate-500 truncate">{item.sub}</span>}
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-600">
                    {item.kind === 'route' ? 'Page' : 'Ticker'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="px-4 py-2 border-t border-navy-700 text-[10px] text-slate-500 flex items-center gap-3">
          <span>↑↓ navigate</span>
          <span>Enter open</span>
          <span className="ml-auto font-mono">⌘K / Ctrl+K</span>
        </div>
      </div>
    </div>
  );
}
