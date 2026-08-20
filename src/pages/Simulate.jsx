import { useMemo, useState } from 'react';
import { LineChart as LineChartIcon, RefreshCw } from 'lucide-react';
import { stocks } from '../data/stocks';
import { simulatePaths, equalWeightDailyReturns } from '../lib/montecarlo';
import { fmtMoney } from '../lib/format';
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from 'recharts';

const PATH_OPTS = [100, 200, 400];
const HORIZON_OPTS = [21, 63, 126, 252];

export default function Simulate() {
  const [paths, setPaths] = useState(200);
  const [horizon, setHorizon] = useState(63);
  const [runId, setRunId] = useState(0);
  const start = 100000;

  const returns = useMemo(() => equalWeightDailyReturns(stocks), []);

  const result = useMemo(() => {
    void runId;
    return simulatePaths({ returns, paths, horizon, start });
  }, [returns, paths, horizon, start, runId]);

  const chartData = result.p50.map((mid, i) => ({
    day: i,
    p5: result.p5[i],
    p50: mid,
    p95: result.p95[i],
    span: result.p95[i] - result.p5[i],
  }));

  const last = chartData[chartData.length - 1];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <LineChartIcon size={22} className="text-brand-blue" aria-hidden="true" />
            Simulate
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Bootstrap Monte Carlo on equal-weight mock universe returns
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary flex items-center gap-2"
          onClick={() => setRunId((n) => n + 1)}
        >
          <RefreshCw size={14} /> Resample
        </button>
      </div>

      <div className="card p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="sim-paths" className="block text-xs text-slate-400 mb-1.5">Paths</label>
          <select
            id="sim-paths"
            className="select"
            value={paths}
            onChange={(e) => setPaths(Number(e.target.value))}
          >
            {PATH_OPTS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sim-horizon" className="block text-xs text-slate-400 mb-1.5">Horizon (days)</label>
          <select
            id="sim-horizon"
            className="select"
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
          >
            {HORIZON_OPTS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="block text-xs text-slate-400 mb-1.5">Start equity</div>
          <div className="input flex items-center font-mono text-slate-200">{fmtMoney(start)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs text-slate-400 mb-1">5th percentile</div>
          <div className="text-xl font-extrabold font-mono text-brand-red">
            {last ? fmtMoney(last.p5) : '—'}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-slate-400 mb-1">Median</div>
          <div className="text-xl font-extrabold font-mono text-brand-blue">
            {last ? fmtMoney(last.p50) : '—'}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-slate-400 mb-1">95th percentile</div>
          <div className="text-xl font-extrabold font-mono text-brand-green">
            {last ? fmtMoney(last.p95) : '—'}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="section-title mb-4">Fan chart (p5–p95)</h2>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="mcBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(36,54,89,0.5)" />
            <XAxis
              dataKey="day"
              tick={{ fill: '#64748b', fontSize: 11 }}
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
              itemStyle={{ color: '#e2e8f0' }}
              formatter={(v, name) => [fmtMoney(v), name]}
              labelFormatter={(d) => `Day ${d}`}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            <Area
              type="monotone"
              dataKey="p5"
              name="p5"
              stackId="band"
              stroke="none"
              fill="transparent"
              dot={false}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="span"
              name="p5–p95"
              stackId="band"
              stroke="none"
              fill="url(#mcBand)"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="p50"
              name="median"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        Simulated histories, not live markets. Paths bootstrap equal-weight daily returns from mock
        price histories with replacement. This is an educational fan chart — not a forecast and not
        financial advice.
      </p>
    </div>
  );
}
