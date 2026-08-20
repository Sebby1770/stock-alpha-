import { describe, it, expect } from 'vitest';
import {
  buy, sell, positionValue, unrealizedPnL,
  migratePortfolio, STARTING_CASH, DEFAULT_HOLDINGS,
} from './broker.js';

const empty = { cash: 10_000, holdings: [] };

describe('buy', () => {
  it('rejects overspend', () => {
    const r = buy({ cash: 500, holdings: [] }, { ticker: 'AAA', shares: 10, price: 100 });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/insufficient cash/i);
    expect(r.holdings).toBeUndefined();
  });

  it('rejects unknown / invalid tickets', () => {
    expect(buy(empty, { ticker: '', shares: 1, price: 10 }).ok).toBe(false);
    expect(buy(empty, { ticker: 'AAA', shares: 0, price: 10 }).ok).toBe(false);
    expect(buy(empty, { ticker: 'AAA', shares: 1, price: -5 }).ok).toBe(false);
    expect(buy(empty, { ticker: 'AAA', shares: 1, price: 10, fee: -1 }).ok).toBe(false);
  });

  it('fills when cash covers notional + fee', () => {
    const r = buy({ cash: 1010, holdings: [] }, { ticker: 'aaa', shares: 10, price: 100, fee: 10 });
    expect(r.ok).toBe(true);
    expect(r.cash).toBe(0);
    expect(r.holdings).toEqual([{ ticker: 'AAA', shares: 10, entryPrice: 100 }]);
    expect(r.fill.side).toBe('buy');
    expect(r.fill.cashAfter).toBe(0);
  });

  it('averages up an existing lot', () => {
    const a = buy(empty, { ticker: 'AAA', shares: 10, price: 100 });
    expect(a.ok).toBe(true);
    const b = buy({ cash: a.cash, holdings: a.holdings }, { ticker: 'AAA', shares: 10, price: 120 });
    expect(b.ok).toBe(true);
    expect(b.holdings).toHaveLength(1);
    expect(b.holdings[0].shares).toBe(20);
    expect(b.holdings[0].entryPrice).toBe(110);
    expect(b.cash).toBe(10_000 - 1000 - 1200);
  });
});

describe('sell', () => {
  it('rejects oversell', () => {
    const a = buy(empty, { ticker: 'AAA', shares: 10, price: 100 });
    const r = sell({ cash: a.cash, holdings: a.holdings }, { ticker: 'AAA', shares: 11, price: 100 });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/insufficient shares/i);
  });

  it('rejects selling a name with no lot', () => {
    const r = sell(empty, { ticker: 'ZZZ', shares: 1, price: 10 });
    expect(r.ok).toBe(false);
  });

  it('drops the lot when remaining shares hit 0', () => {
    const a = buy(empty, { ticker: 'AAA', shares: 10, price: 100 });
    const r = sell({ cash: a.cash, holdings: a.holdings }, { ticker: 'AAA', shares: 10, price: 110 });
    expect(r.ok).toBe(true);
    expect(r.holdings).toHaveLength(0);
    expect(r.cash).toBe(a.cash + 1100);
    expect(r.fill.side).toBe('sell');
  });

  it('keeps average entry on a partial sell', () => {
    const a = buy(empty, { ticker: 'AAA', shares: 10, price: 50 });
    const r = sell({ cash: a.cash, holdings: a.holdings }, { ticker: 'AAA', shares: 4, price: 60 });
    expect(r.ok).toBe(true);
    expect(r.holdings[0].shares).toBe(6);
    expect(r.holdings[0].entryPrice).toBe(50);
  });
});

describe('marks', () => {
  const book = {
    cash: 0,
    holdings: [
      { ticker: 'AAA', shares: 10, entryPrice: 100 },
      { ticker: 'BBB', shares: 5, entryPrice: 20 },
    ],
  };
  const px = (t) => ({ AAA: 110, BBB: 10 }[t]);

  it('positionValue marks lots', () => {
    expect(positionValue(book.holdings, px)).toBe(10 * 110 + 5 * 10);
  });

  it('unrealizedPnL vs entry', () => {
    // AAA +100, BBB -50
    expect(unrealizedPnL(book.holdings, px)).toBe(50);
  });
});

describe('migratePortfolio', () => {
  it('wraps a v2 holdings array with $100,000 cash', () => {
    const old = [{ ticker: 'nvda', shares: 2, entryPrice: 100 }];
    const book = migratePortfolio(old);
    expect(book.version).toBe(3);
    expect(book.cash).toBe(STARTING_CASH);
    expect(book.holdings).toEqual([{ ticker: 'NVDA', shares: 2, entryPrice: 100 }]);
    expect(book.ledger).toEqual([]);
  });

  it('seeds the default book when storage is empty', () => {
    const book = migratePortfolio(null);
    expect(book.cash).toBe(STARTING_CASH);
    expect(book.holdings).toHaveLength(DEFAULT_HOLDINGS.length);
  });
});
