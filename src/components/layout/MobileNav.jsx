import { NavLink } from 'react-router-dom';
import { BarChart3, Briefcase, LayoutDashboard, SlidersHorizontal, Star, Users } from 'lucide-react';
import clsx from 'clsx';

const items = [
  { to: '/', icon: LayoutDashboard, label: 'Home', end: true },
  { to: '/screener', icon: SlidersHorizontal, label: 'Screen' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/watchlist', icon: Star, label: 'Watch' },
  { to: '/compare', icon: BarChart3, label: 'Compare' },
  { to: '/community', icon: Users, label: 'Community' },
];

export default function MobileNav() {
  return (
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-navy-600 bg-navy-900/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="grid h-16 grid-cols-6">
        {items.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => clsx(
              'flex min-w-0 flex-col items-center justify-center gap-1 text-[9px] font-semibold transition-colors',
              isActive ? 'text-blue-400' : 'text-slate-400',
            )}
          >
            <Icon size={17} />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
