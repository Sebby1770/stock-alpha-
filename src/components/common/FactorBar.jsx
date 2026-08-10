import clsx from 'clsx';
import Tooltip from './Tooltip';
import { FACTOR_META } from '../../lib/quant';

const colorForScore = (score) => {
  if (score >= 4.5) return '#10b981';
  if (score >= 3.5) return '#14b8a6';
  if (score >= 2.5) return '#3b82f6';
  if (score >= 1.5) return '#f59e0b';
  if (score >= 0.8) return '#f97316';
  return '#ef4444';
};

export function FactorBar({ label, score, showLabel = true, compact = false, showTooltip = true }) {
  const pct = Math.min((Number(score) / 5) * 100, 100);
  const color = colorForScore(Number(score));
  const meta = FACTOR_META[label];
  const displayLabel = meta?.label ?? label;

  const bar = (
    <div className={clsx('flex flex-col gap-1', compact ? '' : 'gap-1.5')}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 cursor-help underline decoration-dotted decoration-slate-600 underline-offset-2">
            {displayLabel}
            {meta && (
              <span className="text-slate-600 ml-1">({(meta.weight * 100).toFixed(0)}%)</span>
            )}
          </span>
          <span className="text-xs font-semibold font-mono" style={{ color }}>
            {Number(score).toFixed(1)}
          </span>
        </div>
      )}
      <div
        className="h-1.5 rounded-full bg-navy-600 overflow-hidden"
        role="meter"
        aria-label={`${displayLabel} score`}
        aria-valuenow={Number(score)}
        aria-valuemin={0}
        aria-valuemax={5}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );

  if (!showTooltip || !meta) return bar;

  return (
    <Tooltip
      content={
        <span>
          <strong className="text-slate-100">{meta.label}</strong> ({(meta.weight * 100).toFixed(0)}% weight)
          <br />
          {meta.description}
        </span>
      }
    >
      {bar}
    </Tooltip>
  );
}

export function FactorScores({ factors, compact = false }) {
  const keys = ['value', 'growth', 'momentum', 'profitability', 'revisions'];
  return (
    <div className={clsx('flex flex-col', compact ? 'gap-2' : 'gap-3')}>
      {keys.map((k) => (
        <FactorBar key={k} label={k} score={factors[k]} compact={compact} />
      ))}
    </div>
  );
}
