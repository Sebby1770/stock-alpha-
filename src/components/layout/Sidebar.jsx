import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  SlidersHorizontal,
  Users,
  Briefcase,
  Star,
  Settings,
  TrendingUp,
  Activity,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/screener', icon: SlidersHorizontal, label: 'Screener' },
  { to: '/signals', icon: Activity, label: 'Signals' },
  { to: '/community', icon: Users, label: 'Community' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/ops', icon: Settings, label: 'Production Ops' },
];

const secondaryItems = [
  { to: '/signals', icon: Star, label: 'Saved Signals' },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-[88px] bottom-0 w-56 flex flex-col border-r border-navy-600 bg-navy-900/80 backdrop-blur-sm z-40 hidden lg:flex">
      <nav className="flex flex-col p-3 gap-0.5 flex-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-3 py-2">
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
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-blue" />
                )}
              </>
            )}
          </NavLink>
        ))}

        <div className="my-2 h-px bg-navy-700" />

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-3 py-2">
          Tools
        </p>
        {secondaryItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={label}
            to={to}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-navy-700 transition-all"
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom card */}
      <div className="p-3">
        <div className="rounded-xl bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 border border-brand-blue/20 p-3 text-xs">
          <div className="flex items-center gap-1.5 mb-1.5 text-blue-300 font-semibold">
            <TrendingUp size={13} />
            Educational Demo
          </div>
          <p className="text-slate-400 leading-relaxed">
            Synthetic snapshot data only. No live feed, brokerage connection, or investment recommendation.
          </p>
        </div>
      </div>
    </aside>
  );
}
