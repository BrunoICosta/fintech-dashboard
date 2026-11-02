import {
  METHOD_LABELS,
  PAYMENT_METHODS,
  type PaymentMethod,
  type Transaction,
  type TransactionStatus,
} from '../data/types';
import type { Delta } from './format';

const DAY_MS = 86_400_000;

export interface Kpis {
  /** Approved volume, in cents. */
  volumeCents: number;
  /** All transactions, any status. */
  count: number;
  /** approved / (approved + declined). Pending and refunded are not decisions. */
  approvalRate: number;
  /** Average approved ticket, in cents. */
  avgTicketCents: number;
}

export interface DailyPoint extends Kpis {
  day: string;
}

export interface MethodPoint {
  method: PaymentMethod;
  label: string;
  volumeCents: number;
  share: number;
}

export interface Summary {
  current: Kpis;
  previous: Kpis;
  daily: DailyPoint[];
  byMethod: MethodPoint[];
  transactions: Transaction[];
}

/** Days (oldest first) of the `days`-long window ending at `endDay`. */
export function daysInWindow(endDay: string, days: number): string[] {
  const end = Date.parse(`${endDay}T00:00:00Z`);
  return Array.from({ length: days }, (_, i) =>
    new Date(end - (days - 1 - i) * DAY_MS).toISOString().slice(0, 10),
  );
}

export function computeKpis(transactions: Transaction[]): Kpis {
  let volumeCents = 0;
  let approved = 0;
  let declined = 0;

  for (const tx of transactions) {
    if (tx.status === 'approved') {
      approved++;
      volumeCents += tx.amountCents;
    } else if (tx.status === 'declined') {
      declined++;
    }
  }

  return {
    volumeCents,
    count: transactions.length,
    approvalRate: approved + declined === 0 ? 0 : approved / (approved + declined),
    avgTicketCents: approved === 0 ? 0 : Math.round(volumeCents / approved),
  };
}

/** Relative change, or `null` when there is no previous value to compare against. */
export function relativeDelta(current: number, previous: number): Delta | null {
  return previous === 0 ? null : { kind: 'relative', value: (current - previous) / previous };
}

/** Change in percentage points, for metrics that are already ratios. */
export function pointsDelta(current: number, previous: number): Delta {
  return { kind: 'points', value: current - previous };
}

/**
 * Everything the dashboard needs for one date range, in a single pass over the data:
 * KPIs for the selected window and the one before it, a daily series and the method mix.
 */
export function summarize(all: Transaction[], endDay: string, days: number): Summary {
  const currentDays = daysInWindow(endDay, days);
  const previousEnd = new Date(Date.parse(`${currentDays[0]}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10);
  const previousStart = daysInWindow(previousEnd, days)[0];

  const byDay = new Map<string, Transaction[]>(currentDays.map((day) => [day, []]));
  const previous: Transaction[] = [];
  const current: Transaction[] = [];

  for (const tx of all) {
    const bucket = byDay.get(tx.day);
    if (bucket) {
      bucket.push(tx);
      current.push(tx);
    } else if (tx.day >= previousStart && tx.day <= previousEnd) {
      previous.push(tx);
    }
  }

  const currentKpis = computeKpis(current);
  const methodVolume = new Map<PaymentMethod, number>(PAYMENT_METHODS.map((m) => [m, 0]));
  for (const tx of current) {
    if (tx.status === 'approved') methodVolume.set(tx.method, methodVolume.get(tx.method)! + tx.amountCents);
  }

  return {
    current: currentKpis,
    previous: computeKpis(previous),
    daily: currentDays.map((day) => ({ day, ...computeKpis(byDay.get(day)!) })),
    byMethod: PAYMENT_METHODS.map((method) => {
      const volumeCents = methodVolume.get(method)!;
      return {
        method,
        label: METHOD_LABELS[method],
        volumeCents,
        share: currentKpis.volumeCents === 0 ? 0 : volumeCents / currentKpis.volumeCents,
      };
    }).sort((a, b) => b.volumeCents - a.volumeCents),
    transactions: current,
  };
}

export interface TransactionFilters {
  query: string;
  status: TransactionStatus | 'all';
  method: PaymentMethod | 'all';
}

export type SortKey = 'timestamp' | 'amountCents';
export interface SortState {
  key: SortKey;
  direction: 'asc' | 'desc';
}

export function filterTransactions(transactions: Transaction[], filters: TransactionFilters): Transaction[] {
  const query = filters.query.trim().toLowerCase();
  return transactions.filter(
    (tx) =>
      (filters.status === 'all' || tx.status === filters.status) &&
      (filters.method === 'all' || tx.method === filters.method) &&
      (query === '' || tx.id.toLowerCase().includes(query) || tx.customer.toLowerCase().includes(query)),
  );
}

/** Returns a new array; the input is never mutated. */
export function sortTransactions(transactions: Transaction[], { key, direction }: SortState): Transaction[] {
  const factor = direction === 'asc' ? 1 : -1;
  return [...transactions].sort((a, b) => (a[key] - b[key]) * factor);
}
