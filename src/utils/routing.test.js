import { describe, expect, it } from 'vitest';
import { getRouterMode } from './routing';

describe('getRouterMode', () => {
  it('uses normal URLs when the host supports root-level history fallback', () => {
    expect(getRouterMode('/')).toBe('browser');
  });

  it('uses refresh-safe hash routes for GitHub Pages sub-path deployments', () => {
    expect(getRouterMode('/stock-alpha-/')).toBe('hash');
    expect(getRouterMode('/another-pages-project/')).toBe('hash');
  });
});
