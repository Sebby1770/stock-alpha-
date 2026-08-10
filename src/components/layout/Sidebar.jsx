import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  SlidersHorizontal,
  Users,
  Briefcase,
  Star,
  GitCompare,
  TrendingUp,
} from 'lucide-react';
import clsx from 'clsx';
import { useWatchlist } from '../../context/WatchlistContext';
import { useCompare } from '../../context/CompareContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/screener', icon: SlidersHorizontal, label: 'Screener' },
  { to: '/watchlist', icon: Star, label: 'Watchlist', badge: 'watch' },
  { to: '/compare', icon: GitCompare, label: 'Compare', badge: 'compare' },
  { to: '/community', icon: Users, label: 'Community' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
];

export default function Sidebar() {
  const { count: watchCount } = useWatchlist();
  const { count: compareCount } = useCompare();

  const badgeFor = (key) => {
    if (key === 'watch' && watchCount > 0) return watchCount;
    if (key === 'compare' && compareCount > 0) return compareCount;
    return null;
  };

  return (
    <aside
      className="fixed left-0 top-[88px] bottom-0 w-56 flex flex-col border-r border-navy-600 bg-navy-900/80 backdrop-blur-sm z-40 hidden lg:flex"
      aria-label="Main navigation"
    >
      <nav className="flex flex-col p-3 gap-0.5 flex-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-3 py-2">
          Research
        </p>
        {navItems.map(({ to, icon: Icon, label, end, badge }) => {
          const n = badgeFor(badge);
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50',
                  isActive
                    ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-700',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? 'text-brand-blue' : ''} aria-hidden="true" />
                  {label}
                  {n != null && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-navy-600 text-slate-300">
                      {n}
                    </span>
                  )}
                  {n == null && isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-blue" aria-hidden="true" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3">
        <div className="rounded-xl bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 border border-brand-blue/20 p-3 text-xs">
          <div className="flex items-center gap-1.5 mb-1.5 text-blue-300 font-semibold">
            <TrendingUp size={13} aria-hidden="true" />
            AlphaRank
          </div>
          <p className="text-slate-400 leading-relaxed">
            Educational mock data only. Not financial advice. Factor scores are simulated for demo purposes.
          </p>
        </div>
      </div>
    </aside>
  );
}
