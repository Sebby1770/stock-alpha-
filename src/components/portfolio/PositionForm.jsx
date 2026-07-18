import { useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import { validatePosition } from '../../utils/portfolio';

export default function PositionForm({
  editingPosition,
  existingTickers,
  onCancel,
  onSubmit,
  stocks,
}) {
  const [form, setForm] = useState(() => ({
    ticker: editingPosition?.ticker || '',
    shares: editingPosition?.shares ?? '',
    entryPrice: editingPosition?.entryPrice ?? '',
  }));
  const [errors, setErrors] = useState({});
  const isEditing = Boolean(editingPosition);
  const addsToExisting = !isEditing && existingTickers.includes(form.ticker);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const chooseTicker = (ticker) => {
    const selected = stocks.find((stock) => stock.ticker === ticker);
    setForm((current) => ({
      ...current,
      ticker,
      entryPrice: selected ? selected.price.toFixed(2) : current.entryPrice,
    }));
    setErrors((current) => ({ ...current, ticker: undefined, entryPrice: undefined }));
  };

  const submit = (event) => {
    event.preventDefault();
    const result = validatePosition(form, stocks.map((stock) => stock.ticker));
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    onSubmit(result.value);
  };

  return (
    <section className="card border-brand-blue/30 p-5 animate-slide-up" aria-labelledby="position-form-title">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id="position-form-title" className="section-title">
            {isEditing ? <Save size={16} className="text-brand-blue" /> : <Plus size={16} className="text-brand-blue" />}
            {isEditing ? `Edit ${editingPosition.ticker}` : 'Add a position'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Positions are stored only in this browser. Fractional shares are supported.
          </p>
        </div>
        <button type="button" onClick={onCancel} className="btn-ghost p-2" aria-label="Close position form">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={submit} noValidate>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="position-ticker" className="mb-1.5 block text-xs font-medium text-slate-400">
              Stock
            </label>
            <select
              id="position-ticker"
              className="select"
              value={form.ticker}
              disabled={isEditing}
              onChange={(event) => chooseTicker(event.target.value)}
              aria-invalid={Boolean(errors.ticker)}
              aria-describedby={errors.ticker ? 'position-ticker-error' : undefined}
              autoFocus={!isEditing}
            >
              <option value="">Choose a ticker</option>
              {stocks.map((stock) => (
                <option key={stock.ticker} value={stock.ticker}>
                  {stock.ticker} — {stock.name}
                </option>
              ))}
            </select>
            {errors.ticker && <p id="position-ticker-error" className="mt-1 text-xs text-brand-red">{errors.ticker}</p>}
          </div>

          <div>
            <label htmlFor="position-shares" className="mb-1.5 block text-xs font-medium text-slate-400">
              Shares
            </label>
            <input
              id="position-shares"
              className="input"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={form.shares}
              onChange={(event) => setField('shares', event.target.value)}
              aria-invalid={Boolean(errors.shares)}
              aria-describedby={errors.shares ? 'position-shares-error' : undefined}
              placeholder="10"
            />
            {errors.shares && <p id="position-shares-error" className="mt-1 text-xs text-brand-red">{errors.shares}</p>}
          </div>

          <div>
            <label htmlFor="position-entry" className="mb-1.5 block text-xs font-medium text-slate-400">
              Average entry price
            </label>
            <input
              id="position-entry"
              className="input"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.entryPrice}
              onChange={(event) => setField('entryPrice', event.target.value)}
              aria-invalid={Boolean(errors.entryPrice)}
              aria-describedby={errors.entryPrice ? 'position-entry-error' : undefined}
              placeholder="125.50"
            />
            {errors.entryPrice && <p id="position-entry-error" className="mt-1 text-xs text-brand-red">{errors.entryPrice}</p>}
          </div>
        </div>

        {addsToExisting && (
          <p className="mt-3 rounded-lg border border-brand-blue/20 bg-brand-blue/10 px-3 py-2 text-xs text-blue-300">
            This lot will be combined with {form.ticker} using a share-weighted average entry price.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="submit" className="btn-primary inline-flex items-center gap-2">
            {isEditing ? <Save size={14} /> : <Plus size={14} />}
            {isEditing ? 'Save changes' : addsToExisting ? 'Add lot' : 'Add position'}
          </button>
          <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        </div>
      </form>
    </section>
  );
}
