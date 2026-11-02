import { STATUS_LABELS, type TransactionStatus } from '../data/types';

const ICONS: Record<TransactionStatus, string> = {
  approved: '✓',
  pending: '◷',
  declined: '✕',
  refunded: '↺',
};

/** Status is never color-only: each badge carries an icon and a text label. */
export function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <span className={`status status--${status}`}>
      <span className="status__icon" aria-hidden="true">
        {ICONS[status]}
      </span>
      {STATUS_LABELS[status]}
    </span>
  );
}
