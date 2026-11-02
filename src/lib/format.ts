// Formatters are created once: Intl constructors are expensive to call per row.
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const currencyCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  // Currency style defaults to 2 minimum fraction digits, which would render "$125.0K".
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});
const integer = new Intl.NumberFormat('en-US');
const percent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const shortDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const dateTime = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

export const formatCurrency = (cents: number) => currency.format(cents / 100);
export const formatCurrencyCompact = (cents: number) => currencyCompact.format(cents / 100);
export const formatInteger = (value: number) => integer.format(value);
export const formatPercent = (ratio: number) => percent.format(ratio);
export const formatDay = (day: string) => shortDay.format(new Date(`${day}T00:00:00Z`));
export const formatDateTime = (timestamp: number) => dateTime.format(timestamp);

export type Delta = { kind: 'relative' | 'points'; value: number };

/** `+12.4%` for relative change, `+1.2 pp` for percentage-point change. Uses a real minus sign. */
export function formatDelta({ kind, value }: Delta): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  const magnitude = Math.abs(value) * 100;
  return kind === 'relative' ? `${sign}${magnitude.toFixed(1)}%` : `${sign}${magnitude.toFixed(1)} pp`;
}
