import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitCompare, X, Plus } from 'lucide-react';
import { stocks, getStockByTicker } from '../data/stocks';
import { FACTOR_KEYS, FACTOR_META } from '../lib/quant';
import { useCompare } from '../context/CompareContext';
import QuantGrade from '../components/common/QuantGrade';
import EmptyState from '../components/common/EmptyState';
import { FactorBar } from '../components/common/FactorBar';
import clsx from 'clsx';
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#a855f7'];

export default function Compare() {
  const navigate = useNavigate();
  const { tickers, remove, clear, add, max, canAdd } = useCompare();

  const selected = useMemo(
    () => tickers.map((t) => getStockByTicker(t)).filter(Boolean),
    [tickers],
  );

  const radarData = useMemo(() => {
    return FACTOR_KEYS.map((key) => {
      const row = { subject: FACTOR_META[key].label, fullMark: 5 };
      selected.forEach((s, i) => {
        row[`s${i}`] = s.factors[key];
      });
      return row;
    });
  }, [selected]);

  const barData = useMemo(() => {
    return FACTOR_KEYS.map((key) => {
      const row = { factor: FACTOR_META[key].label };
      selected.forEach((s) => {
        row[s.ticker] = s.factors[key];
      });
      return row;
    });
  }, [selected]);

  const candidates = stocks
    .filter((s) => !tickers.includes(s.ticker))
    .sort((a, b) => b.quantScore - a.quantScore)
    .slice(0, 12);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <GitCompare size={22} className="text-brand-purple" />
            Compare Stocks
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Side-by-side factor radar and bars · select {max} tickers max
          </p>
        </div>
        {tickers.length > 0 && (
          <button type="button" onClick={clear} className="btn-secondary">
            Clear selection
          </button>
        )}
      </div>

      {/* Selection slots */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: max }).map((_, i) => {
          const s = selected[i];
          if (!s) {
            return (
              <div
                key={`empty-${i}`}
                className="card border-dashed p-5 flex flex-col items-center justify-center min-h-[120px] text-slate-500"
              >
                <Plus size={22} className="mb-2 opacity-50" />
                <span className="text-xs">Slot {i + 1} empty</span>
              </div>
            );
          }
          return (
            <div key={s.ticker} className="card p-5 relative glow-card">
              <button
                type="button"
                aria-label={`Remove ${s.ticker} from compare`}
                onClick={() => remove(s.ticker)}
                className="absolute top-3 right-3 p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-navy-700 focus-visible:ring-2 focus-visible:ring-brand-blue/50"
              >
                <X size={14} />
              </button>
              <button
                type="button"
                onClick={() => navigate(`/stock/${s.ticker}`)}
                className="text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50 rounded-lg"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: COLORS[i] + '44', border: `1px solid ${COLORS[i]}` }}
                  >
                    {s.ticker.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-100">{s.ticker}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[140px]">{s.name}</div>
                  </div>
                  <QuantGrade grade={s.quantGrade} size="sm" className="ml-auto" />
                </div>
                <div className="flex items-end justify-between">
                  <div className="font-mono text-lg font-bold text-slate-100">${s.price.toFixed(2)}</div>
                  <div className="font-mono text-sm font-semibold text-slate-300">
                    Score {s.quantScore.toFixed(2)}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {selected.length < 2 ? (
        <div className="card">
          <EmptyState
            icon={GitCompare}
            title="Select 2–3 stocks to compare"
            description="Pick from the list below, or toggle Compare on the screener and stock detail pages."
          />
          {canAdd && (
            <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {candidates.map((s) => (
                <button
                  key={s.ticker}
                  type="button"
                  onClick={() => add(s.ticker)}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-navy-600 hover:border-brand-blue/40 hover:bg-navy-750 transition-colors text-left focus-visible:ring-2 focus-visible:ring-brand-blue/50"
                >
                  <span className="font-bold text-sm text-slate-200">{s.ticker}</span>
                  <QuantGrade grade={s.quantGrade} size="xs" />
                  <span className="ml-auto text-xs font-mono text-slate-500">{s.quantScore.toFixed(2)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="card p-5">
              <h2 className="section-title mb-4">Factor Radar</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(36,54,89,0.6)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#64748b', fontSize: 10 }} />
                  {selected.map((s, i) => (
                    <Radar
                      key={s.ticker}
                      name={s.ticker}
                      dataKey={`s${i}`}
                      stroke={COLORS[i]}
                      fill={COLORS[i]}
                      fillOpacity={0.12}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <h2 className="section-title mb-4">Factor Bars</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(36,54,89,0.4)" />
                  <XAxis dataKey="factor" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 5]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0d1526', border: '1px solid #243659', borderRadius: 8 }}
                    labelStyle={{ color: '#94a3b8' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  {selected.map((s, i) => (
                    <Bar key={s.ticker} dataKey={s.ticker} fill={COLORS[i]} radius={[4, 4, 0, 0]} />
                  ))}
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Metrics table */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-navy-700">
              <h2 className="section-title">Side-by-side metrics</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-navy-700 bg-navy-850">
                    <th className="text-left px-5 py-3 font-medium">Metric</th>
                    {selected.map((s, i) => (
                      <th key={s.ticker} className="text-right px-5 py-3 font-medium" style={{ color: COLORS[i] }}>
                        {s.ticker}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Quant Grade', (s) => s.quantGrade, true],
                    ['Quant Score', (s) => s.quantScore.toFixed(2)],
                    ['Price', (s) => `$${s.price.toFixed(2)}`],
                    ['P/E', (s) => `${s.pe.toFixed(1)}x`],
                    ['Market Cap', (s) => s.marketCap >= 1e12 ? `$${(s.marketCap / 1e12).toFixed(2)}T` : `$${(s.marketCap / 1e9).toFixed(0)}B`],
                    ['Rev Growth', (s) => `${s.revenueGrowth >= 0 ? '+' : ''}${s.revenueGrowth.toFixed(1)}%`],
                    ['ROE', (s) => `${s.roe.toFixed(1)}%`],
                    ...FACTOR_KEYS.map((k) => [FACTOR_META[k].label, (s) => s.factors[k].toFixed(1)]),
                  ].map(([label, getter, isGrade]) => (
                    <tr key={label} className="border-b border-navy-700/50">
                      <td className="px-5 py-3 text-slate-400">{label}</td>
                      {selected.map((s) => (
                        <td key={s.ticker} className="px-5 py-3 text-right font-mono font-semibold text-slate-200">
                          {isGrade ? <QuantGrade grade={s.quantGrade} size="xs" /> : getter(s)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Factor detail cards */}
          <div className={clsx('grid gap-4', selected.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3')}>
            {selected.map((s, i) => (
              <div key={s.ticker} className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <h3 className="font-bold text-slate-100">{s.ticker}</h3>
                </div>
                <div className="space-y-3">
                  {FACTOR_KEYS.map((k) => (
                    <FactorBar key={k} label={k} score={s.factors[k]} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {canAdd && (
            <div className="card p-5">
              <h2 className="section-title mb-3">Add another stock</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {candidates.slice(0, 8).map((s) => (
                  <button
                    key={s.ticker}
                    type="button"
                    onClick={() => add(s.ticker)}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-navy-600 hover:border-brand-purple/40 hover:bg-navy-750 transition-colors text-left focus-visible:ring-2 focus-visible:ring-brand-blue/50"
                  >
                    <span className="font-bold text-sm text-slate-200">{s.ticker}</span>
                    <QuantGrade grade={s.quantGrade} size="xs" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
