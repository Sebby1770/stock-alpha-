import { describe, it, expect } from 'vitest';
import {
  buy, sell, positionValue, unrealizedPnL, realizedPnL, ledgerToCsv,
  migratePortfolio, parseBookJson, STARTING_CASH, DEFAULT_HOLDINGS, PORTFOLIO_VERSION,
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
    expect(r.fill.realized).toBe(0);
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
    expect(b.fill.realized).toBe(0);
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

  it('records realized P&L on a winning sell', () => {
    const a = buy(empty, { ticker: 'AAA', shares: 10, price: 100 });
    const r = sell({ cash: a.cash, holdings: a.holdings }, { ticker: 'AAA', shares: 10, price: 110 });
    expect(r.ok).toBe(true);
    // (110 - 100) * 10 - 0 fee
    expect(r.fill.realized).toBe(100);
    expect(realizedPnL([a.fill, r.fill])).toBe(100);
  });

  it('subtracts fee from realized', () => {
    const a = buy(empty, { ticker: 'AAA', shares: 10, price: 100 });
    const r = sell(
      { cash: a.cash, holdings: a.holdings },
      { ticker: 'AAA', shares: 10, price: 110, fee: 5 },
    );
    expect(r.fill.realized).toBe(95);
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

describe('ledgerToCsv', () => {
  it('has a header', () => {
    const csv = ledgerToCsv([]);
    const header = csv.split('\n')[0];
    expect(header).toMatch(/ticker/i);
    expect(header).toMatch(/side/i);
    expect(header).toMatch(/realized/i);
    expect(header.split(',')[0]).toBe('id');
  });

  it('emits a row per fill', () => {
    const csv = ledgerToCsv([
      { id: 'f1', ts: Date.UTC(2026, 0, 1), side: 'sell', ticker: 'AAA', shares: 2, price: 10, fee: 0, realized: 4, cashAfter: 100 },
    ]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('AAA');
    expect(lines[1]).toContain('sell');
    expect(lines[1]).toContain('4');
  });
});

describe('migratePortfolio', () => {
  it('wraps a v2 holdings array with $100,000 cash', () => {
    const old = [{ ticker: 'nvda', shares: 2, entryPrice: 100 }];
    const book = migratePortfolio(old);
    expect(book.version).toBe(PORTFOLIO_VERSION);
    expect(book.version).toBe(5);
    expect(book.cash).toBe(STARTING_CASH);
    expect(book.holdings).toEqual([{ ticker: 'NVDA', shares: 2, entryPrice: 100 }]);
    expect(book.ledger).toEqual([]);
    expect(book.stops).toEqual([]);
  });

  it('seeds the default book when storage is empty', () => {
    const book = migratePortfolio(null);
    expect(book.cash).toBe(STARTING_CASH);
    expect(book.holdings).toHaveLength(DEFAULT_HOLDINGS.length);
    expect(book.stops).toEqual([]);
    expect(book.version).toBe(5);
  });

  it('upgrades a v3 book by adding stops and bumping version', () => {
    const v3 = {
      version: 3,
      cash: 5000,
      holdings: [{ ticker: 'AAA', shares: 1, entryPrice: 10 }],
      ledger: [{ side: 'buy', ticker: 'AAA' }],
    };
    const book = migratePortfolio(v3);
    expect(book.version).toBe(5);
    expect(book.stops).toEqual([]);
    expect(book.cash).toBe(5000);
    expect(book.ledger).toHaveLength(1);
    expect(book.holdings).toEqual([{ ticker: 'AAA', shares: 1, entryPrice: 10 }]);
  });

  it('keeps v4 stops', () => {
    const v4 = {
      version: 4,
      cash: 1,
      holdings: [],
      ledger: [],
      stops: [{ id: 's1', ticker: 'aaa', kind: 'stop_loss', price: 10, enabled: true }],
    };
    const book = migratePortfolio(v4);
    expect(book.version).toBe(5);
    expect(book.stops).toHaveLength(1);
    expect(book.stops[0].ticker).toBe('AAA');
    expect(book.stops[0].kind).toBe('stop_loss');
  });

  it('keeps a v5 book', () => {
    const v5 = {
      version: 5,
      cash: 9,
      holdings: [{ ticker: 'MSFT', shares: 1, entryPrice: 400 }],
      ledger: [],
      stops: [],
    };
    const book = migratePortfolio(v5);
    expect(book.version).toBe(5);
    expect(book.cash).toBe(9);
    expect(book.holdings[0].ticker).toBe('MSFT');
  });
});

describe('parseBookJson', () => {
  it('migrates a v4 JSON book', () => {
    const raw = JSON.stringify({
      version: 4,
      cash: 2500,
      holdings: [{ ticker: 'nvda', shares: 3, entryPrice: 100 }],
      ledger: [{ side: 'buy', ticker: 'NVDA' }],
      stops: [{ ticker: 'nvda', kind: 'take_profit', price: 900 }],
    });
    const r = parseBookJson(raw);
    expect(r.ok).toBe(true);
    expect(r.book.version).toBe(5);
    expect(r.book.cash).toBe(2500);
    expect(r.book.holdings).toEqual([{ ticker: 'NVDA', shares: 3, entryPrice: 100 }]);
    expect(r.book.ledger).toHaveLength(1);
    expect(r.book.stops).toHaveLength(1);
    expect(r.book.stops[0].kind).toBe('take_profit');
  });

  it('rejects invalid JSON and non-books', () => {
    expect(parseBookJson('{').ok).toBe(false);
    expect(parseBookJson('not json').error).toMatch(/invalid json/i);
    expect(parseBookJson('{"foo":1}').ok).toBe(false);
    expect(parseBookJson(null).ok).toBe(false);
  });

  it('accepts a v2 holdings array', () => {
    const r = parseBookJson(JSON.stringify([{ ticker: 'AAPL', shares: 1, entryPrice: 10 }]));
    expect(r.ok).toBe(true);
    expect(r.book.holdings[0].ticker).toBe('AAPL');
    expect(r.book.cash).toBe(STARTING_CASH);
  });
});
