import { describe, expect, it } from 'vitest';
import type { Transaction } from '../data/types';
import { generateTransactions } from '../data/generate';
import {
  computeKpis,
  daysInWindow,
  filterTransactions,
  relativeDelta,
  sortTransactions,
  summarize,
} from './metrics';

let nextId = 1;
function tx(overrides: Partial<Transaction>): Transaction {
  const day = overrides.day ?? '2026-10-31';
  return {
    id: `TX-${nextId++}`,
    timestamp: Date.parse(`${day}T12:00:00Z`),
    day,
    amountCents: 1000,
    customer: 'Olivia Smith',
    method: 'card_credit',
    status: 'approved',
    ...overrides,
  };
}

describe('daysInWindow', () => {
  it('returns the window oldest first, crossing month boundaries', () => {
    expect(daysInWindow('2026-11-02', 4)).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
  });
});

describe('computeKpis', () => {
  it('counts only approved volume and ignores pending/refunded in the approval rate', () => {
    const kpis = computeKpis([
      tx({ amountCents: 1000 }),
      tx({ amountCents: 3000 }),
      tx({ status: 'declined', amountCents: 9999 }),
      tx({ status: 'pending', amountCents: 9999 }),
      tx({ status: 'refunded', amountCents: 9999 }),
    ]);
    expect(kpis).toEqual({ volumeCents: 4000, count: 5, approvalRate: 2 / 3, avgTicketCents: 2000 });
  });

  it('handles an empty period without dividing by zero', () => {
    expect(computeKpis([])).toEqual({ volumeCents: 0, count: 0, approvalRate: 0, avgTicketCents: 0 });
  });
});

describe('relativeDelta', () => {
  it('returns null when there is nothing to compare against', () => {
    expect(relativeDelta(100, 0)).toBeNull();
    expect(relativeDelta(150, 100)).toEqual({ kind: 'relative', value: 0.5 });
  });
});

describe('summarize', () => {
  it('splits the current and previous windows and builds one point per day', () => {
    const data = [
      tx({ day: '2026-10-31', amountCents: 500 }),
      tx({ day: '2026-10-30', amountCents: 700, method: 'wallet' }),
      tx({ day: '2026-10-29', amountCents: 200 }), // previous window
      tx({ day: '2026-10-27', amountCents: 999 }), // outside both windows
    ];
    const summary = summarize(data, '2026-10-31', 2);

    expect(summary.current.volumeCents).toBe(1200);
    expect(summary.previous.volumeCents).toBe(200);
    expect(summary.daily.map((d) => d.day)).toEqual(['2026-10-30', '2026-10-31']);
    expect(summary.byMethod[0]).toMatchObject({ method: 'wallet', volumeCents: 700 });
    expect(summary.byMethod.reduce((sum, m) => sum + m.share, 0)).toBeCloseTo(1);
  });

  it('agrees with a direct KPI computation on the generated dataset', () => {
    const all = generateTransactions();
    const summary = summarize(all, '2026-10-31', 30);
    const inWindow = all.filter((t) => t.day >= '2026-10-02' && t.day <= '2026-10-31');
    expect(summary.current).toEqual(computeKpis(inWindow));
    expect(summary.daily).toHaveLength(30);
  });
});

describe('filterTransactions / sortTransactions', () => {
  const rows = [
    tx({ id: 'TX-1', customer: 'Ava Costa', amountCents: 300, status: 'declined' }),
    tx({ id: 'TX-2', customer: 'Liam Walker', amountCents: 100, method: 'wallet' }),
    tx({ id: 'TX-3', customer: 'Mia Costa', amountCents: 200 }),
  ];

  it('combines search, status and method filters', () => {
    const ids = (q: string, status: 'all' | 'approved', method: 'all' | 'wallet') =>
      filterTransactions(rows, { query: q, status, method }).map((r) => r.id);

    expect(ids('costa', 'all', 'all')).toEqual(['TX-1', 'TX-3']);
    expect(ids('costa', 'approved', 'all')).toEqual(['TX-3']);
    expect(ids(' tx-2 ', 'all', 'wallet')).toEqual(['TX-2']);
  });

  it('sorts without mutating the input', () => {
    const sorted = sortTransactions(rows, { key: 'amountCents', direction: 'asc' });
    expect(sorted.map((r) => r.amountCents)).toEqual([100, 200, 300]);
    expect(rows.map((r) => r.id)).toEqual(['TX-1', 'TX-2', 'TX-3']);
  });
});

describe('generateTransactions', () => {
  it('is deterministic for a given seed', () => {
    expect(generateTransactions(7).slice(0, 5)).toEqual(generateTransactions(7).slice(0, 5));
  });
});
