import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, Plus, X } from 'lucide-react';
import clsx from 'clsx';
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { stocks } from '../data/stocks';
import QuantGrade from '../components/common/QuantGrade';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];
const DEFAULT_SYMBOLS = ['NVDA', 'MSFT', 'GOOGL'];

const validSymbols = (value) => [...new Set(String(value || '')
  .split(',')
  .map((ticker) => ticker.trim().toUpperCase())
  .filter((ticker) => stocks.some((stock) => stock.ticker === ticker)))]
  .slice(0, 4);

const formatMetric = (value, suffix = '', decimals = 1) => Number.isFinite(value)
  ? `${value.toFixed(decimals)}${suffix}`
  : '—';

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSymbols = validSymbols(searchParams.get('symbols'));
  const [symbols, setSymbols] = useState(initialSymbols.length ? initialSymbols : DEFAULT_SYMBOLS);
  const [candidate, setCandidate] = useState('');

  useEffect(() => {
    setSearchParams({ symbols: symbols.join(',') }, { replace: true });
  }, [symbols, setSearchParams]);

  const selected = symbols.map((ticker) => stocks.find((stock) => stock.ticker === ticker)).filter(Boolean);
  const available = stocks.filter((stock) => !symbols.includes(stock.ticker));
  const factorData = ['value', 'growth', 'momentum', 'profitability', 'revisions'].map((factor) => ({
    factor: factor === 'profitability' ? 'Profitability' : factor[0].toUpperCase() + factor.slice(1),
    ...Object.fromEntries(selected.map((stock) => [stock.ticker, stock.factors[factor]])),
  }));

  const rows = useMemo(() => [
    { label: 'Quant grade', render: (stock) => <QuantGrade grade={stock.quantGrade} size="sm" /> },
    { label: 'Quant score', render: (stock) => formatMetric(stock.quantScore, ' / 5', 2), winner: (stock) => stock.quantScore },
    { label: 'Target upside', render: (stock) => formatMetric(((stock.priceTarget - stock.price) / stock.price) * 100, '%'), winner: (stock) => ((stock.priceTarget - stock.price) / stock.price) * 100 },
    { label: 'Revenue growth', render: (stock) => formatMetric(stock.revenueGrowth, '%'), winner: (stock) => stock.revenueGrowth },
    { label: 'EPS growth', render: (stock) => formatMetric(stock.epsGrowth, '%'), winner: (stock) => stock.epsGrowth },
    { label: 'P/E', render: (stock) => formatMetric(stock.pe, 'x'), winner: (stock) => -stock.pe },
    { label: 'EV / EBITDA', render: (stock) => formatMetric(stock.evEbitda, 'x'), winner: (stock) => -stock.evEbitda },
    { label: 'ROE', render: (stock) => formatMetric(stock.roe, '%'), winner: (stock) => stock.roe },
    { label: 'Operating margin', render: (stock) => formatMetric(stock.operatingMargin, '%'), winner: (stock) => stock.operatingMargin },
    { label: 'Dividend yield', render: (stock) => formatMetric(stock.dividendYield, '%', 2), winner: (stock) => stock.dividendYield },
  ], []);

  const addCandidate = () => {
    if (!candidate || symbols.length >= 4) return;
    setSymbols((current) => [...current, candidate]);
    setCandidate('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <div className="eyebrow"><BarChart3 size={13} /> Decision workspace</div>
        <h1 className="page-title">Compare stocks</h1>
        <p className="page-subtitle">Put valuation, growth, quality, momentum, and target upside on one scorecard.</p>
      </header>

      <section className="card p-4">
        <div className="flex flex-wrap items-center gap-2">
          {selected.map((stock, index) => (
            <span key={stock.ticker} className="comparison-chip" style={{ '--chip-color': COLORS[index] }}>
              <span className="h-2 w-2 rounded-full" style={{ background: COLORS[index] }} />
              {stock.ticker}
              <button
                aria-label={`Remove ${stock.ticker} from comparison`}
                onClick={() => setSymbols((current) => current.filter((ticker) => ticker !== stock.ticker))}
              ><X size={13} /></button>
            </span>
          ))}
          {symbols.length < 4 && (
            <div className="flex items-center gap-2">
              <label htmlFor="compare-add" className="sr-only">Add stock to comparison</label>
              <select id="compare-add" className="select h-9 w-56" value={candidate} onChange={(event) => setCandidate(event.target.value)}>
                <option value="">Add a company…</option>
                {available.map((stock) => <option key={stock.ticker} value={stock.ticker}>{stock.ticker} — {stock.name}</option>)}
              </select>
              <button className="btn-secondary flex h-9 items-center gap-1.5 py-1" disabled={!candidate} onClick={addCandidate}>
                <Plus size={14} /> Add
              </button>
            </div>
          )}
          <span className="ml-auto text-xs text-slate-500">Up to four companies · URL is shareable</span>
        </div>
      </section>

      {selected.length ? (
        <>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[.9fr_1.1fr]">
            <section className="card p-5">
              <h2 className="section-title mb-2">Factor fingerprint</h2>
              <p className="mb-3 text-xs text-slate-500">Higher scores are stronger. Factors use a consistent 0–5 scale.</p>
              <ResponsiveContainer width="100%" height={330}>
                <RadarChart data={factorData} outerRadius="70%">
                  <PolarGrid stroke="#243659" />
                  <PolarAngleAxis dataKey="factor" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                  {selected.map((stock, index) => (
                    <Radar
                      key={stock.ticker}
                      name={stock.ticker}
                      dataKey={stock.ticker}
                      stroke={COLORS[index]}
                      fill={COLORS[index]}
                      fillOpacity={0.08}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#0d1526', border: '1px solid #243659', borderRadius: 8 }} />
                </RadarChart>
              </ResponsiveContainer>
            </section>

            <section className="card overflow-hidden">
              <div className="border-b border-navy-700 p-5">
                <h2 className="section-title">Research scorecard</h2>
                <p className="mt-1 text-xs text-slate-500">Best value in each comparable row is highlighted.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-navy-700 bg-navy-850">
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Metric</th>
                      {selected.map((stock) => <th key={stock.ticker} className="px-4 py-3 text-right text-sm font-bold text-slate-200">{stock.ticker}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const best = row.winner ? Math.max(...selected.map(row.winner)) : null;
                      return (
                        <tr key={row.label} className="border-b border-navy-700/60 last:border-0">
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">{row.label}</th>
                          {selected.map((stock) => {
                            const isBest = row.winner && row.winner(stock) === best;
                            return (
                              <td key={stock.ticker} className={clsx('px-4 py-3 text-right font-mono text-slate-300', isBest && 'bg-brand-green/5 font-bold text-brand-green')}>
                                <span className="inline-flex justify-end">{row.render(stock)}</span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="data-notice">
            Comparison highlights are directional, not recommendations. A “winner” reflects only the displayed metric and does not account for risk tolerance or time horizon.
          </div>
        </>
      ) : (
        <div className="empty-state">
          <BarChart3 size={32} />
          <h2>Add a company to begin</h2>
          <p>Choose up to four stocks to build a side-by-side research scorecard.</p>
        </div>
      )}
    </div>
  );
}
