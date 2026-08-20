import { useState } from 'react';
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { stocks } from '../data/stocks';
import { GRADES } from '../lib/quant';
import { useAlerts, ALERT_KINDS } from '../context/AlertsContext';
import QuantGrade from '../components/common/QuantGrade';
import EmptyState from '../components/common/EmptyState';
import { fmtMoney } from '../lib/format';
import clsx from 'clsx';

export default function Alerts() {
  const { evaluated, triggered, add, remove, toggle, count } = useAlerts();
  const [form, setForm] = useState({
    ticker: '',
    kind: 'price_above',
    value: '',
  });
  const [error, setError] = useState('');

  const stock = stocks.find((s) => s.ticker === form.ticker);
  const isGrade = form.kind === 'grade_at_least';

  const submit = (e) => {
    e.preventDefault();
    setError('');
    const result = add(form);
    if (!result.ok) {
      setError(result.error || 'Could not add alert');
      return;
    }
    setForm((f) => ({ ...f, value: isGrade ? f.value : '' }));
  };

  const onKind = (kind) => {
    setForm((f) => ({
      ...f,
      kind,
      value: kind === 'grade_at_least' ? (f.value && GRADES.includes(f.value) ? f.value : 'A') : '',
    }));
  };

  const onTicker = (ticker) => {
    const s = stocks.find((x) => x.ticker === ticker);
    setForm((f) => ({
      ...f,
      ticker,
      value: f.kind === 'grade_at_least'
        ? (f.value || 'A')
        : (f.value || (s ? String(s.price.toFixed(2)) : '')),
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
          <Bell size={22} className="text-brand-yellow" aria-hidden="true" />
          Alerts
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Price and grade triggers on mock quotes · {count} saved
        </p>
      </div>

      <form onSubmit={submit} className="card p-5">
        <h2 className="section-title mb-4">
          <Plus size={16} className="text-brand-blue" aria-hidden="true" /> New alert
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
          <div>
            <label htmlFor="alert-ticker" className="block text-xs text-slate-400 mb-1.5">Ticker</label>
            <select
              id="alert-ticker"
              className="select"
              required
              value={form.ticker}
              onChange={(e) => onTicker(e.target.value)}
            >
              <option value="">Select…</option>
              {stocks.map((s) => (
                <option key={s.ticker} value={s.ticker}>{s.ticker}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="alert-kind" className="block text-xs text-slate-400 mb-1.5">Condition</label>
            <select
              id="alert-kind"
              className="select"
              value={form.kind}
              onChange={(e) => onKind(e.target.value)}
            >
              {ALERT_KINDS.map((k) => (
                <option key={k.id} value={k.id}>{k.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="alert-value" className="block text-xs text-slate-400 mb-1.5">
              {isGrade ? 'Min grade' : 'Price'}
            </label>
            {isGrade ? (
              <select
                id="alert-value"
                className="select"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            ) : (
              <input
                id="alert-value"
                className="input"
                type="number"
                min="0"
                step="any"
                required
                placeholder={stock ? String(stock.price.toFixed(2)) : '0.00'}
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              />
            )}
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full">Add alert</button>
          </div>
        </div>
        {stock && (
          <p className="text-xs text-slate-500">
            Last mock price {fmtMoney(stock.price)} · grade {stock.quantGrade}
          </p>
        )}
        {error && <p className="text-sm text-brand-red mt-2" role="alert">{error}</p>}
      </form>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-navy-700">
          <h2 className="section-title">Triggered now</h2>
          <span className="text-xs text-slate-500">{triggered.length} firing</span>
        </div>
        {triggered.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500 text-center">
            No enabled alerts are firing against current mock prices and grades.
          </p>
        ) : (
          <ul className="divide-y divide-navy-700">
            {triggered.map((a) => (
              <li key={a.id} className="px-5 py-3 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse shrink-0" aria-hidden="true" />
                <span className="font-mono text-sm text-slate-100">{a.label}</span>
                {a.stock && <QuantGrade grade={a.stock.quantGrade} size="xs" showTooltip={false} />}
              </li>
            ))}
          </ul>
        )}
      </div>

      {evaluated.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Bell}
            title="No alerts yet"
            description="Watch a last price or a minimum quant grade. Rules live in localStorage and evaluate against mock quotes only."
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-navy-700">
            <h2 className="section-title">All rules</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-navy-700 bg-navy-850">
                  <th className="text-left px-5 py-3 font-medium">Ticker</th>
                  <th className="text-left px-3 py-3 font-medium">Rule</th>
                  <th className="text-left px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {evaluated.map((a) => {
                  const kind = ALERT_KINDS.find((k) => k.id === a.kind);
                  return (
                    <tr key={a.id} className="text-sm border-b border-navy-700/50">
                      <td className="px-5 py-3 font-bold text-slate-200">{a.ticker}</td>
                      <td className="px-3 py-3 text-slate-300">
                        {kind?.label ?? a.kind}{' '}
                        <span className="font-mono text-slate-100">
                          {a.kind === 'grade_at_least' ? a.value : fmtMoney(a.value)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {a.enabled && a.triggered ? (
                          <span className="badge bg-brand-green/15 text-brand-green">{a.label}</span>
                        ) : a.enabled ? (
                          <span className="text-xs text-slate-500">Armed</span>
                        ) : (
                          <span className="text-xs text-slate-600">Off</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => toggle(a.id)}
                            className={clsx(
                              'p-1.5 rounded-md focus-visible:ring-2 focus-visible:ring-brand-blue/50',
                              a.enabled ? 'text-brand-green' : 'text-slate-500',
                            )}
                            aria-label={a.enabled ? 'Disable alert' : 'Enable alert'}
                          >
                            {a.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(a.id)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-brand-red hover:bg-brand-red/10 focus-visible:ring-2 focus-visible:ring-brand-blue/50"
                            aria-label="Delete alert"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500">
        Alerts fire against educational mock prices and grades — not live markets.
      </p>
    </div>
  );
}
