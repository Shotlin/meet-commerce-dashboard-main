import { describe, it, expect } from 'vitest';
import { createRealtimeGate } from '../utils/realtimeGate';

describe('createRealtimeGate', () => {
  it('accepts ascending seqs for one key', () => {
    const g = createRealtimeGate();
    expect(g.accept('order:1', 10, 'a')).toBe(true);
    expect(g.accept('order:1', 11, 'b')).toBe(true);
  });

  it('drops an exact duplicate (same eventId)', () => {
    const g = createRealtimeGate();
    expect(g.accept('order:1', 10, 'a')).toBe(true);
    expect(g.accept('order:1', 10, 'a')).toBe(false);
  });

  it('drops a stale event that arrives after a newer one', () => {
    const g = createRealtimeGate();
    expect(g.accept('order:1', 20, 'new')).toBe(true);
    expect(g.accept('order:1', 15, 'old')).toBe(false);
    expect(g.accept('order:1', 20, 'same-seq')).toBe(false);
  });

  it('tracks ordering per key', () => {
    const g = createRealtimeGate();
    expect(g.accept('order:1', 100)).toBe(true);
    expect(g.accept('order:2', 5)).toBe(true);
    expect(g.accept('refund:9', 1)).toBe(true);
  });

  it('lets events without a seq (older backend) through', () => {
    const g = createRealtimeGate();
    expect(g.accept('order:1')).toBe(true);
    expect(g.accept('order:1')).toBe(true);
  });

  it('stays bounded', () => {
    const g = createRealtimeGate(5);
    for (let i = 0; i < 100; i++) g.accept(`order:${i}`, i + 1, `e${i}`);
    expect(g.accept('order:99', 1, 'zz')).toBe(false);
  });
});
