import { useMemo, useState } from 'react';
import { PieChart } from 'lucide-react';
import { stocks } from '../data/stocks';
import { returnMatrix, inverseVolWeights, minVarianceWeights, efficientFrontier } from '../lib/optimize';
import clsx from 'clsx';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from 'recharts';

const UNIVERSE = [5, 8, 10, 15, 25];

const fmtPct = (w) => `${(Number(w) * 100).toFixed(2)}%`;

function WeightTable({ title, tickers, weights }) {
  const rows = tickers
    .map((ticker, i) => ({ ticker, weight: weights[i] ?? 0 }))
    .sort((a, b) => b.weight - a.weight || a.ticker.localeCompare(b.ticker));

  return (
    <div className="card overflow-hidden">
      <div className="p-5 border-b border-navy-700">
        <h2 className="section-title">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-sm text-slate-500 text-center">No overlapping mock history.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-navy-700 bg-navy-850">
                <th className="text-left px-5 py-2 font-medium">Ticker</th>
                <th className="text-right px-5 py-2 font-medium">Weight</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.ticker} className="border-b border-navy-700/50">
                  <td className="px-5 py-2 font-bold text-slate-200">{r.ticker}</td>
                  <td className={clsx(
                    'px-5 py-2 text-right font-mono',
                    r.weight < 0 ? 'text-brand-red' : 'text-slate-200',
                  )}
                  >
                    {fmtPct(r.weight)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Optimize() {
  const [topN, setTopN] = useState(10);

  const universe = useMemo(
    () => [...stocks].sort((a, b) => b.quantScore - a.quantScore).slice(0, topN),
    [topN],
  );

  const { tickers, matrix } = useMemo(() => returnMatrix(universe), [universe]);
  const inv = useMemo(() => inverseVolWeights(matrix), [matrix]);
  const minv = useMemo(() => minVarianceWeights(matrix), [matrix]);
  const frontier = useMemo(() => efficientFrontier(matrix), [matrix]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
          <PieChart size={22} className="text-brand-blue" aria-hidden="true" />
          Optimize
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Inverse-vol and min-variance weights on mock histories — educational, not advice
        </p>
      </div>

      <div className="card p-5">
        <div className="max-w-xs">
          <label htmlFor="opt-topn" className="block text-xs text-slate-400 mb-1.5">
            Universe (top N by quantScore)
          </label>
          <select
            id="opt-topn"
            className="select"
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
          >
            {UNIVERSE.map((n) => (
              <option key={n} value={n}>{n} names</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WeightTable title="Inverse-vol weights" tickers={tickers} weights={inv} />
        <WeightTable title="Min-variance weights" tickers={tickers} weights={minv} />
      </div>

      <div className="card p-5">
        <h2 className="section-title mb-4">Efficient frontier</h2>
        {frontier.length === 0 ? (
          <p className="text-sm text-slate-500 py-12 text-center">
            Not enough overlapping history for a frontier.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={frontier} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(36,54,89,0.5)" />
              <XAxis
                dataKey="risk"
                type="number"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(v) => `${(v * 100).toFixed(2)}%`}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <YAxis
                dataKey="ret"
                type="number"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(v) => `${(v * 100).toFixed(3)}%`}
                axisLine={false}
                tickLine={false}
                width={60}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{ background: '#0d1526', border: '1px solid #243659', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8', fontSize: 12 }}
                formatter={(v, name) => [`${(Number(v) * 100).toFixed(4)}%`, name]}
                labelFormatter={(v) => `Risk ${(Number(v) * 100).toFixed(4)}%`}
              />
              <Line
                type="linear"
                dataKey="ret"
                name="Mean daily return"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3, fill: '#3b82f6' }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        Educational mock data only. Inverse-vol, min-variance, and the frontier are solved on aligned
        simulated histories — not live markets and not financial advice.
      </p>
    </div>
  );
}
