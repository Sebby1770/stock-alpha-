import { useMemo } from 'react';
import { Grid3x3 } from 'lucide-react';
import { stocks } from '../data/stocks';
import { correlationMatrix } from '../lib/correlation';
import clsx from 'clsx';

function cellStyle(v) {
  if (!Number.isFinite(v)) return { backgroundColor: 'transparent', color: '#64748b' };
  const mag = Math.min(1, Math.abs(v));
  if (v >= 0) {
    return {
      backgroundColor: `rgba(16, 185, 129, ${0.06 + mag * 0.5})`,
      color: v > 0.45 ? '#d1fae5' : '#94a3b8',
    };
  }
  return {
    backgroundColor: `rgba(239, 68, 68, ${0.06 + mag * 0.5})`,
    color: v < -0.45 ? '#fecaca' : '#94a3b8',
  };
}

const fmt = (v) => (Number.isFinite(v) ? v.toFixed(2) : '—');

export default function Matrix() {
  const { tickers, matrix } = useMemo(() => correlationMatrix(stocks), []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
          <Grid3x3 size={22} className="text-brand-blue" aria-hidden="true" />
          Correlation matrix
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Pearson pairwise on daily returns from aligned mock histories · −1 to +1
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-navy-700 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="section-title">Heatmap</h2>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.45)' }}>−1</span>
            <span>anti</span>
            <span className="px-2 py-0.5 rounded bg-navy-700">0</span>
            <span>none</span>
            <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(16,185,129,0.45)' }}>+1</span>
            <span>perfect</span>
          </div>
        </div>
        <div className="overflow-auto max-h-[70vh]">
          <table className="text-[11px] font-mono border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-20 bg-navy-850 text-left px-2 py-2 text-slate-500 font-medium border-b border-navy-700">
                  {' '}
                </th>
                {tickers.map((t) => (
                  <th
                    key={t}
                    className="sticky top-0 z-10 bg-navy-850 px-1.5 py-2 text-slate-400 font-medium border-b border-navy-700"
                    title={t}
                  >
                    <span className="inline-block origin-bottom-left -rotate-45 translate-y-2 min-w-[2.4rem]">
                      {t}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickers.map((rowTicker, i) => (
                <tr key={rowTicker}>
                  <th className="sticky left-0 z-10 bg-navy-800 text-left px-2 py-1 text-slate-300 font-bold border-r border-navy-700">
                    {rowTicker}
                  </th>
                  {tickers.map((colTicker, j) => {
                    const v = matrix[i]?.[j];
                    return (
                      <td
                        key={colTicker}
                        className={clsx(
                          'px-1 py-1 text-center min-w-[2.6rem]',
                          i === j && 'font-bold',
                        )}
                        style={cellStyle(v)}
                        title={`${rowTicker} × ${colTicker} = ${fmt(v)}`}
                      >
                        {fmt(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        Simulated histories, not live markets. Pairwise Pearson on mock daily returns is for education only — not financial advice.
      </p>
    </div>
  );
}
