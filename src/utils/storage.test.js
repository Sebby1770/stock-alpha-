import { afterEach, describe, expect, it, vi } from 'vitest';
import { writeJson } from './storage';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('writeJson', () => {
  it('reports a successful browser-storage write', () => {
    const setItem = vi.fn();
    vi.stubGlobal('window', { localStorage: { setItem } });

    expect(writeJson('portfolio', [{ ticker: 'NVDA', shares: 2 }])).toBe(true);
    expect(setItem).toHaveBeenCalledWith(
      'portfolio',
      JSON.stringify([{ ticker: 'NVDA', shares: 2 }]),
    );
  });

  it('reports failure when the browser rejects persistence', () => {
    vi.stubGlobal('window', {
      localStorage: {
        setItem: vi.fn(() => {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        }),
      },
    });

    expect(writeJson('portfolio', [])).toBe(false);
  });
});
