import clsx from 'clsx';

const colorForScore = (score) => {
  if (score >= 4.5) return '#10b981';
  if (score >= 3.5) return '#14b8a6';
  if (score >= 2.5) return '#3b82f6';
  if (score >= 1.5) return '#f59e0b';
  if (score >= 0.8) return '#f97316';
  return '#ef4444';
};

const labelForFactor = {
  value: 'Value',
  growth: 'Growth',
  momentum: 'Momentum',
  profitability: 'Profitability',
  revisions: 'Revisions',
};

export function FactorBar({ label, score, showLabel = true, compact = false }) {
  const pct = Math.min((score / 5) * 100, 100);
  const color = colorForScore(score);

  return (
    <div className={clsx('flex flex-col gap-1', compact ? '' : 'gap-1.5')}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{labelForFactor[label] ?? label}</span>
          <span className="text-xs font-semibold font-mono" style={{ color }}>
            {score.toFixed(1)}
          </span>
        </div>
      )}
      <div className="h-1.5 rounded-full bg-navy-600 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
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
