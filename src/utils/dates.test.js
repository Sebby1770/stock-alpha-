import { describe, expect, it } from 'vitest';
import { formatDateOnly, parseDateOnly } from './dates';

describe('date-only helpers', () => {
  it('formats calendar dates without applying the host timezone', () => {
    expect(formatDateOnly('2026-05-01')).toBe('5/1/2026');
    expect(formatDateOnly('2026-05-01', { month: 'short', day: 'numeric' })).toBe('May 1');
  });

  it('parses strict calendar dates at UTC midnight', () => {
    expect(parseDateOnly('2026-05-01').toISOString()).toBe('2026-05-01T00:00:00.000Z');
    expect(() => parseDateOnly('2026-02-30')).toThrow(RangeError);
    expect(() => parseDateOnly('May 1, 2026')).toThrow(TypeError);
  });
});
