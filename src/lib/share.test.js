import { describe, it, expect } from 'vitest';
import { encodeBook, decodeBook } from './share.js';

describe('encodeBook / decodeBook', () => {
  it('roundtrips cash and holdings', () => {
    const book = {
      cash: 12345.67,
      holdings: [
        { ticker: 'aapl', shares: 10, entryPrice: 150.25 },
        { ticker: 'MSFT', shares: 5, entryPrice: 400 },
      ],
      ledger: [{ id: 'ignore-me' }],
      stops: [{ id: 'nope' }],
    };
    const encoded = encodeBook(book);
    expect(encoded).toBeTruthy();
    expect(encoded).not.toMatch(/[+/=]/);
    expect(decodeBook(encoded)).toEqual({
      cash: 12345.67,
      holdings: [
        { ticker: 'AAPL', shares: 10, entryPrice: 150.25 },
        { ticker: 'MSFT', shares: 5, entryPrice: 400 },
      ],
    });
  });

  it('roundtrips an empty book', () => {
    const snap = { cash: 100000, holdings: [] };
    expect(decodeBook(encodeBook(snap))).toEqual(snap);
  });

  it('returns null for junk', () => {
    expect(decodeBook('')).toBeNull();
    expect(decodeBook(null)).toBeNull();
    expect(decodeBook('%%%not-valid%%%')).toBeNull();
    expect(decodeBook('not-base64-or-json')).toBeNull();
  });

  it('drops invalid lots', () => {
    const encoded = encodeBook({
      cash: 1,
      holdings: [
        { ticker: 'AAA', shares: 2, entryPrice: 10 },
        { ticker: 'BBB', shares: 0, entryPrice: 10 },
        { ticker: '', shares: 1, entryPrice: 10 },
      ],
    });
    expect(decodeBook(encoded).holdings).toEqual([{ ticker: 'AAA', shares: 2, entryPrice: 10 }]);
  });
});
