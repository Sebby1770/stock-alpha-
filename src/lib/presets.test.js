import { describe, it, expect } from 'vitest';
import {
  PRESETS_KEY,
  encodePreset,
  decodePreset,
  makePreset,
  loadPresets,
  savePresets,
} from './presets.js';

function fakeIo(initial) {
  const bag = { ...(initial || {}) };
  return {
    bag,
    loadJson: (k, fb) => (Object.prototype.hasOwnProperty.call(bag, k) ? bag[k] : fb),
    saveJson: (k, v) => {
      bag[k] = v;
    },
  };
}

describe('encodePreset / decodePreset', () => {
  it('roundtrips a full preset', () => {
    const raw = {
      id: 'p1',
      name: ' Mega tech ',
      query: 'nvda',
      sector: 'Technology',
      mcap: 1,
      minGrade: 'A',
      minScore: 3.5,
      sortKey: 'price',
      sortDir: 'asc',
    };
    const encoded = encodePreset(raw);
    expect(encoded.name).toBe('Mega tech');
    expect(decodePreset(encoded)).toEqual(encoded);
    expect(decodePreset(JSON.stringify(encoded))).toEqual(encoded);
  });

  it('returns null for junk', () => {
    expect(decodePreset('')).toBeNull();
    expect(decodePreset(null)).toBeNull();
    expect(decodePreset('not-json')).toBeNull();
    expect(decodePreset({ name: 'No id' })).toBeNull();
    expect(decodePreset({ id: 'x', name: '' })).toBeNull();
  });

  it('defaults sortDir to desc and keeps mcap 0', () => {
    const p = encodePreset({ id: 'z', name: 'All', mcap: 0, sortDir: 'nope' });
    expect(p.mcap).toBe(0);
    expect(p.sortDir).toBe('desc');
    expect(p.minScore).toBe(0);
  });
});

describe('makePreset + storage injection', () => {
  it('roundtrips via fake storage', () => {
    const io = fakeIo();
    const made = makePreset('High score', {
      query: 'aa',
      sector: 'Health Care',
      mcap: 2,
      minGrade: 'B+',
      minScore: 4,
      sortKey: 'quantScore',
      sortDir: 'desc',
    });
    expect(made.id).toBeTruthy();
    expect(made.name).toBe('High score');
    expect(made.sector).toBe('Health Care');

    savePresets([made], io);
    expect(io.bag[PRESETS_KEY]).toHaveLength(1);

    const loaded = loadPresets(io);
    expect(loaded).toEqual([made]);
  });

  it('drops invalid rows on save', () => {
    const io = fakeIo();
    const good = makePreset('Keep');
    const out = savePresets([good, { name: 'no-id' }, null], io);
    expect(out).toEqual([good]);
    expect(loadPresets(io)).toEqual([good]);
  });
});
