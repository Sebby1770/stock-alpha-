import { useId, useState } from 'react';
import clsx from 'clsx';

/**
 * Accessible hover/focus tooltip.
 */
export default function Tooltip({ content, children, side = 'top', className }) {
  const id = useId();
  const [open, setOpen] = useState(false);

  if (!content) return children;

  return (
    <span
      className={clsx('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={clsx(
            'absolute z-50 w-56 rounded-lg border border-navy-500 bg-navy-800 px-3 py-2 text-xs text-slate-300 shadow-card-hover leading-relaxed pointer-events-none',
            side === 'top' && 'bottom-full left-1/2 -translate-x-1/2 mb-2',
            side === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-2',
            side === 'left' && 'right-full top-1/2 -translate-y-1/2 mr-2',
            side === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-2',
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
