import { describe, it, expect } from 'vitest';
import { evaluateStops } from './stops.js';

const holdings = [{ ticker: 'AAA', shares: 10, entryPrice: 100 }];

describe('evaluateStops', () => {
  it('fires stop_loss when price is at or below the stop', () => {
    const stops = [{ id: '1', ticker: 'AAA', kind: 'stop_loss', price: 95, enabled: true }];
    const hits = evaluateStops(holdings, () => 90, stops);
    expect(hits).toHaveLength(1);
    expect(hits[0].shares).toBe(10);
    expect(hits[0].price).toBe(90);
    expect(hits[0].stop.id).toBe('1');
    expect(hits[0].reason).toMatch(/stop_loss/i);
  });

  it('does not fire stop_loss when price is above the stop', () => {
    const stops = [{ id: '1', ticker: 'AAA', kind: 'stop_loss', price: 95, enabled: true }];
    expect(evaluateStops(holdings, () => 96, stops)).toEqual([]);
  });

  it('fires take_profit when price is at or above the stop', () => {
    const stops = [{ id: '2', ticker: 'AAA', kind: 'take_profit', price: 110, enabled: true }];
    const hits = evaluateStops(holdings, () => 120, stops);
    expect(hits).toHaveLength(1);
    expect(hits[0].shares).toBe(10);
    expect(hits[0].price).toBe(120);
    expect(hits[0].reason).toMatch(/take_profit/i);
  });

  it('does not fire take_profit when price is below the stop', () => {
    const stops = [{ id: '2', ticker: 'AAA', kind: 'take_profit', price: 110, enabled: true }];
    expect(evaluateStops(holdings, () => 109, stops)).toEqual([]);
  });

  it('ignores disabled stops', () => {
    const stops = [
      { id: '3', ticker: 'AAA', kind: 'stop_loss', price: 95, enabled: false },
      { id: '4', ticker: 'AAA', kind: 'take_profit', price: 80, enabled: false },
    ];
    expect(evaluateStops(holdings, () => 50, stops)).toEqual([]);
  });

  it('ignores stops for names with no open lot', () => {
    const stops = [{ id: '5', ticker: 'ZZZ', kind: 'stop_loss', price: 1, enabled: true }];
    expect(evaluateStops(holdings, () => 1, stops)).toEqual([]);
  });
});
