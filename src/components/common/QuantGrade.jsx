import clsx from 'clsx';
import Tooltip from './Tooltip';
import { FACTOR_META, GRADE_THRESHOLDS } from '../../lib/quant';

const gradeConfig = {
  'A+': { bg: 'bg-emerald-500', text: 'text-white', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.5)]' },
  A: { bg: 'bg-green-500', text: 'text-white', glow: 'shadow-[0_0_12px_rgba(34,197,94,0.4)]' },
  'A-': { bg: 'bg-green-400', text: 'text-white', glow: 'shadow-[0_0_10px_rgba(74,222,128,0.35)]' },
  'B+': { bg: 'bg-teal-500', text: 'text-white', glow: '' },
  B: { bg: 'bg-blue-500', text: 'text-white', glow: '' },
  'B-': { bg: 'bg-blue-400', text: 'text-white', glow: '' },
  'C+': { bg: 'bg-yellow-400', text: 'text-gray-900', glow: '' },
  C: { bg: 'bg-amber-400', text: 'text-gray-900', glow: '' },
  'C-': { bg: 'bg-orange-400', text: 'text-gray-900', glow: '' },
  'D+': { bg: 'bg-orange-500', text: 'text-white', glow: '' },
  D: { bg: 'bg-red-400', text: 'text-white', glow: '' },
  'D-': { bg: 'bg-red-500', text: 'text-white', glow: '' },
  F: { bg: 'bg-red-600', text: 'text-white', glow: '' },
};

const sizes = {
  xs: 'text-xs w-8 h-6 rounded',
  sm: 'text-sm w-9 h-7 rounded',
  md: 'text-sm w-10 h-8 rounded-md font-bold',
  lg: 'text-xl w-14 h-12 rounded-lg font-extrabold',
  xl: 'text-3xl w-20 h-16 rounded-xl font-extrabold',
};

function gradeTooltip(grade) {
  const threshold = GRADE_THRESHOLDS.find((t) => t.grade === grade);
  const factors = Object.values(FACTOR_META)
    .map((f) => `${f.label} ${(f.weight * 100).toFixed(0)}%`)
    .join(' · ');
  const min = threshold ? threshold.min : 0;
  return (
    <span>
      <strong className="text-slate-100">Grade {grade}</strong>
      {threshold && (
        <>
          {' '}
          · composite ≥ {min.toFixed(1)}
        </>
      )}
      <br />
      Weighted factors: {factors}. Educational mock model — not investment advice.
    </span>
  );
}

export default function QuantGrade({
  grade,
  size = 'md',
  showGlow = false,
  showTooltip = true,
  className,
}) {
  const cfg = gradeConfig[grade] ?? { bg: 'bg-slate-600', text: 'text-white', glow: '' };

  const badge = (
    <span
      className={clsx(
        'inline-flex items-center justify-center font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
        cfg.bg,
        cfg.text,
        sizes[size],
        showGlow && cfg.glow,
        className,
      )}
      tabIndex={showTooltip ? 0 : undefined}
      aria-label={`Quant grade ${grade}`}
    >
      {grade}
    </span>
  );

  if (!showTooltip) return badge;

  return (
    <Tooltip content={gradeTooltip(grade)} side="top">
      {badge}
    </Tooltip>
  );
}
