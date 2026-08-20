/**
 * Named screener presets persisted in localStorage.
 */

import { loadJson, saveJson } from './storage.js';

export const PRESETS_KEY = 'alpharank-screener-presets';

const DEFAULTS = {
  query: '',
  sector: 'All',
  mcap: 0,
  minGrade: 'All',
  minScore: 0,
  sortKey: 'quantScore',
  sortDir: 'desc',
};

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `preset-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function finiteNumber(n, fallback) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

/**
 * Canonical preset object. Does not generate ids.
 */
export function encodePreset(p) {
  const src = p && typeof p === 'object' ? p : {};
  return {
    id: String(src.id ?? ''),
    name: String(src.name ?? '').trim(),
    query: String(src.query ?? DEFAULTS.query),
    sector: String(src.sector ?? DEFAULTS.sector) || DEFAULTS.sector,
    mcap: finiteNumber(src.mcap, DEFAULTS.mcap),
    minGrade: String(src.minGrade ?? DEFAULTS.minGrade) || DEFAULTS.minGrade,
    minScore: finiteNumber(src.minScore, DEFAULTS.minScore),
    sortKey: String(src.sortKey ?? DEFAULTS.sortKey) || DEFAULTS.sortKey,
    sortDir: src.sortDir === 'asc' ? 'asc' : 'desc',
  };
}

/**
 * Inverse of encodePreset. Accepts an object or JSON string. Returns null if unusable.
 */
export function decodePreset(raw) {
  let data = raw;
  if (typeof data === 'string') {
    const s = data.trim();
    if (!s) return null;
    try {
      data = JSON.parse(s);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const p = encodePreset(data);
  if (!p.id || !p.name) return null;
  return p;
}

export function makePreset(name, filters = {}) {
  return encodePreset({
    ...DEFAULTS,
    ...filters,
    id: makeId(),
    name: String(name ?? '').trim() || 'Untitled',
  });
}

function resolveIo(io) {
  return {
    loadJson: typeof io?.loadJson === 'function' ? io.loadJson : loadJson,
    saveJson: typeof io?.saveJson === 'function' ? io.saveJson : saveJson,
  };
}

export function loadPresets(io) {
  const { loadJson: load } = resolveIo(io);
  const raw = load(PRESETS_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.map(decodePreset).filter(Boolean);
}

export function savePresets(list, io) {
  const { saveJson: save } = resolveIo(io);
  const clean = (Array.isArray(list) ? list : []).map(decodePreset).filter(Boolean);
  save(PRESETS_KEY, clean);
  return clean;
}
