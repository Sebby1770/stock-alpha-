import { useMemo, useState } from 'react';
import { FlaskConical, TrendingUp, Timer, Layers } from 'lucide-react';
import { stocks } from '../data/stocks';
import { backtestMomentum } from '../lib/backtest';
import clsx from 'clsx';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from 'recharts';

const LOOKBACKS = [5, 10, 21, 42, 63];
const TOP_N = [3, 5, 8, 10, 15];
const REBALANCE = [5, 10, 21, 42];

const fmtPct = (n) => {
  if (!Number.isFinite(n)) return '—';
  const pct = n * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
};

const fmtBig = (n) => {
  if (!Number.isFinite(n)) return '—';
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

export default function Lab() {
  const [lookback, setLookback] = useState(21);
  const [topN, setTopN] = useState(8);
  const [rebalance, setRebalance] = useState(21);
  const startCash = 100000;

  const result = useMemo(
    () => backtestMomentum(stocks, { topN, lookback, rebalance, startCash }),
    [topN, lookback, rebalance, startCash],
  );

  const { equity, stats } = result;
  const last = equity[equity.length - 1];

  const cards = [
    { label: 'Strategy return', value: fmtPct(stats.strategyReturn), pos: stats.strategyReturn >= 0 },
    { label: 'Benchmark return', value: fmtPct(stats.benchmarkReturn), pos: stats.benchmarkReturn >= 0 },
    { label: 'Excess return', value: fmtPct(stats.excessReturn), pos: stats.excessReturn >= 0 },
    { label: 'Max drawdown', value: fmtPct(-Math.abs(stats.maxDrawdown)), pos: false },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
          <FlaskConical size={22} className="text-brand-blue" aria-hidden="true" />
          Lab
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Momentum factor backtest on simulated price histories · not live markets
        </p>
      </div>

      <div className="card p-5">
        <h2 className="section-title mb-4">
          <Layers size={16} className="text-brand-purple" aria-hidden="true" /> Factor proxy
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="lab-lookback" className="block text-xs text-slate-400 mb-1.5">
              Momentum lookback (days)
            </label>
            <select
              id="lab-lookback"
              className="select"
              value={lookback}
              onChange={(e) => setLookback(Number(e.target.value))}
            >
              {LOOKBACKS.map((n) => (
                <option key={n} value={n}>{n} trading days</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lab-topn" className="block text-xs text-slate-400 mb-1.5">
              Top N names
            </label>
            <select
              id="lab-topn"
              className="select"
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
            >
              {TOP_N.map((n) => (
                <option key={n} value={n}>{n} equal-weight</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lab-rebalance" className="block text-xs text-slate-400 mb-1.5">
              Rebalance
            </label>
            <select
              id="lab-rebalance"
              className="select"
              value={rebalance}
              onChange={(e) => setRebalance(Number(e.target.value))}
            >
              {REBALANCE.map((n) => (
                <option key={n} value={n}>Every {n} days</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Rank the universe by trailing lookback return, hold the top N equal-weight until the next rebalance.
          Benchmark is equal-weight buy-and-hold of the full mock universe. Start cash {fmtBig(startCash)}.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <div className="text-xs text-slate-400">{c.label}</div>
            <div className={clsx('text-xl font-extrabold font-mono', c.pos ? 'text-brand-green' : 'text-brand-red')}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h2 className="section-title mb-4">
          <TrendingUp size={16} className="text-brand-green" aria-hidden="true" /> Strategy vs benchmark
        </h2>
        {equity.length === 0 ? (
          <p className="text-sm text-slate-500 py-12 text-center">
            Not enough overlapping history for this lookback.
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={equity} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(36,54,89,0.5)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(s) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{ background: '#0d1526', border: '1px solid #243659', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8', fontSize: 12 }}
                  formatter={(v, name) => [fmtBig(v), name]}
                  labelFormatter={(s) => new Date(s).toLocaleDateString()}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                <Line
                  type="monotone"
                  dataKey="strategy"
                  name="Momentum"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#10b981' }}
                />
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  name="Equal-weight B&H"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
            {last && (
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Timer size={12} aria-hidden="true" />
                  {equity[0].date} → {last.date} · {equity.length} sessions
                </span>
                <span>Momentum {fmtBig(last.strategy)}</span>
                <span>Benchmark {fmtBig(last.benchmark)}</span>
              </div>
            )}
          </>
        )}
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        Simulated histories, not live markets. Seeded mock paths and equal-weight rebalances are for education only — not financial advice, not a live backtest of real fills.
      </p>
    </div>
  );
}
