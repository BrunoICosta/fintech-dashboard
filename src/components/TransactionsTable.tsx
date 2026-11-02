import { useDeferredValue, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  METHOD_LABELS,
  PAYMENT_METHODS,
  STATUS_LABELS,
  TRANSACTION_STATUSES,
  type PaymentMethod,
  type Transaction,
  type TransactionStatus,
} from '../data/types';
import { formatCurrency, formatDateTime, formatInteger } from '../lib/format';
import { filterTransactions, sortTransactions, type SortKey, type SortState } from '../lib/metrics';
import { StatusBadge } from './StatusBadge';

const ROW_HEIGHT = 48;

interface SortableHeaderProps {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  align?: 'end';
}

function SortableHeader({ label, sortKey, sort, onSort, align }: SortableHeaderProps) {
  const active = sort.key === sortKey;
  const ariaSort = active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none';
  return (
    <div role="columnheader" aria-sort={ariaSort} className={align === 'end' ? 'num' : undefined}>
      <button type="button" className="sort-button" onClick={() => onSort(sortKey)}>
        {label}
        <span aria-hidden="true" className="sort-button__icon">
          {active ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </div>
  );
}

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<TransactionStatus | 'all'>('all');
  const [method, setMethod] = useState<PaymentMethod | 'all'>('all');
  const [sort, setSort] = useState<SortState>({ key: 'timestamp', direction: 'desc' });

  // Typing stays responsive: filtering thousands of rows runs at a lower priority than the input.
  const deferredQuery = useDeferredValue(query);

  const rows = useMemo(
    () => sortTransactions(filterTransactions(transactions, { query: deferredQuery, status, method }), sort),
    [transactions, deferredQuery, status, method, sort],
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  // Only the rows in view (plus overscan) are in the DOM, so 10k+ rows scroll smoothly.
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, direction: s.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'desc' }));

  return (
    <section className="card table-card" aria-labelledby="tx-title">
      <header className="card__header table-card__header">
        <div>
          <h2 id="tx-title">Transactions</h2>
          <p className="table-card__count" aria-live="polite">
            {formatInteger(rows.length)} of {formatInteger(transactions.length)} transactions
          </p>
        </div>
        <div className="toolbar">
          <input
            type="search"
            className="input"
            placeholder="Search ID or customer"
            aria-label="Search by transaction ID or customer"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="input"
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TransactionStatus | 'all')}
          >
            <option value="all">All statuses</option>
            {TRANSACTION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            className="input"
            aria-label="Filter by payment method"
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod | 'all')}
          >
            <option value="all">All methods</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {METHOD_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="tx-table__scroll-x">
        <div role="table" aria-label="Transactions" aria-rowcount={rows.length + 1} className="tx-table">
          <div role="rowgroup">
            <div role="row" aria-rowindex={1} className="tx-row tx-row--head">
              <SortableHeader label="Date (UTC)" sortKey="timestamp" sort={sort} onSort={toggleSort} />
              <div role="columnheader">ID</div>
              <div role="columnheader">Customer</div>
              <div role="columnheader">Method</div>
              <div role="columnheader">Status</div>
              <SortableHeader label="Amount" sortKey="amountCents" sort={sort} onSort={toggleSort} align="end" />
            </div>
          </div>

          <div ref={scrollRef} role="rowgroup" className="tx-table__body" tabIndex={0} aria-label="Transaction rows">
            {rows.length === 0 ? (
              <p className="tx-table__empty">No transactions match these filters.</p>
            ) : (
              <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
                {virtualizer.getVirtualItems().map((item) => {
                  const tx = rows[item.index];
                  return (
                    <div
                      key={tx.id}
                      role="row"
                      aria-rowindex={item.index + 2}
                      className="tx-row"
                      style={{ transform: `translateY(${item.start}px)`, height: ROW_HEIGHT }}
                    >
                      <div role="cell" className="muted">{formatDateTime(tx.timestamp)}</div>
                      <div role="cell" className="mono">{tx.id}</div>
                      <div role="cell">{tx.customer}</div>
                      <div role="cell">{METHOD_LABELS[tx.method]}</div>
                      <div role="cell">
                        <StatusBadge status={tx.status} />
                      </div>
                      <div role="cell" className="num">{formatCurrency(tx.amountCents)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
