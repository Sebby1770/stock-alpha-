import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  SlidersHorizontal,
  Users,
  Briefcase,
  Star,
  Settings,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import clsx from 'clsx';
import { useResearch } from '../../context/ResearchContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/screener', icon: SlidersHorizontal, label: 'Screener' },
  { to: '/community', icon: Users, label: 'Community' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/watchlist', icon: Star, label: 'Watchlist' },
  { to: '/compare', icon: BarChart3, label: 'Compare' },
];

const secondaryItems = [
  { to: '#', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { watchlist } = useResearch();
  return (
    <aside className="fixed left-0 top-[88px] bottom-0 w-56 flex flex-col border-r border-navy-600 bg-navy-900/80 backdrop-blur-sm z-40 hidden lg:flex">
      <nav className="flex flex-col p-3 gap-0.5 flex-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-3 py-2">
          Research
        </p>
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-navy-700',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-brand-blue' : ''} />
                {label}
                {label === 'Watchlist' && watchlist.length > 0 && !isActive && (
                  <span className="ml-auto rounded-full bg-navy-600 px-2 py-0.5 text-[10px] text-slate-400">{watchlist.length}</span>
                )}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-blue" />
                )}
              </>
            )}
          </NavLink>
        ))}

        <div className="my-2 h-px bg-navy-700" />

        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-3 py-2">
          Tools
        </p>
        {secondaryItems.map(({ to, icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            disabled
            title="Settings are not available in this demo"
            className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600"
          >
            <Icon size={17} />
            {label}
            <span className="ml-auto text-[9px] uppercase tracking-wider">Soon</span>
          </button>
        ))}
      </nav>

      {/* Bottom card */}
      <div className="p-3">
        <div className="rounded-xl bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 border border-brand-blue/20 p-3 text-xs">
          <div className="flex items-center gap-1.5 mb-1.5 text-blue-300 font-semibold">
            <TrendingUp size={13} />
            AlphaRank Pro
          </div>
          <p className="text-slate-400 leading-relaxed">
            This open demo uses deterministic sample data. Connect a licensed market-data provider before production use.
          </p>
          <div className="mt-2.5 rounded-md bg-navy-800/70 px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-blue-300">
            Demo workspace
          </div>
        </div>
      </div>
    </aside>
  );
}
