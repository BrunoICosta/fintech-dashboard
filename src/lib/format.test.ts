import { describe, expect, it } from 'vitest';
import { formatCurrency, formatCurrencyCompact, formatDay, formatDelta, formatPercent } from './format';

describe('format', () => {
  it('formats integer cents as dollars', () => {
    expect(formatCurrency(123456)).toBe('$1,234.56');
    expect(formatCurrencyCompact(125_000_00)).toBe('$125K');
  });

  it('formats ratios as percentages with one decimal', () => {
    expect(formatPercent(0.9273)).toBe('92.7%');
  });

  it('formats UTC days without shifting to the local timezone', () => {
    expect(formatDay('2026-10-31')).toBe('Oct 31');
  });

  it('formats relative and percentage-point deltas with a real minus sign', () => {
    expect(formatDelta({ kind: 'relative', value: 0.124 })).toBe('+12.4%');
    expect(formatDelta({ kind: 'relative', value: -0.031 })).toBe('−3.1%');
    expect(formatDelta({ kind: 'points', value: 0.012 })).toBe('+1.2 pp');
    expect(formatDelta({ kind: 'points', value: 0 })).toBe('0.0 pp');
  });
});
