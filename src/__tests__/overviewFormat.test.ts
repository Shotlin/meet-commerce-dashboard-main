import { describe, it, expect } from 'vitest';
import { inr, minutes, num, ratio, signedPct } from '../utils/overviewFormat';

describe('overview formatting', () => {
  it('formats rupees with Indian grouping and lakh/crore shorthand', () => {
    expect(inr(1234567)).toBe('₹12,34,567');
    expect(inr(182000, { compact: true })).toBe('₹1.82L');
    expect(inr(25000000, { compact: true })).toBe('₹2.5Cr');
    expect(inr(-54000, { compact: true })).toBe('-₹54K');
    expect(inr(-5400, { compact: true })).toBe('-₹5,400');
    expect(inr(950, { compact: true })).toBe('₹950');
  });

  it('never renders NaN or undefined — missing data is a dash', () => {
    expect(inr(null)).toBe('—');
    expect(inr(undefined)).toBe('—');
    expect(inr(NaN)).toBe('—');
    expect(num(null)).toBe('—');
    expect(ratio(null)).toBe('—');
    expect(signedPct(null)).toBe('—');
    expect(minutes(null)).toBe('—');
  });

  it('formats ratios, signed percentages and durations', () => {
    expect(ratio(0.1234)).toBe('12.3%');
    expect(ratio(0.5, 0)).toBe('50%');
    expect(signedPct(12.34)).toBe('+12.3%');
    expect(signedPct(-5)).toBe('-5%');
    expect(signedPct(15287)).toBe('+15,287%');
    expect(minutes(38)).toBe('38 min');
    expect(minutes(95)).toBe('1h 35m');
  });
});
