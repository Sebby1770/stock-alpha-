import { SearchX } from 'lucide-react';
import clsx from 'clsx';

export default function EmptyState({
  icon: Icon = SearchX,
  title = 'No results',
  description = 'Try adjusting your filters or search query.',
  action,
  className,
}) {
  return (
    <div
      role="status"
      className={clsx(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className,
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-navy-700 border border-navy-600 flex items-center justify-center mb-4">
        <Icon size={28} className="text-slate-500" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-slate-200 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
