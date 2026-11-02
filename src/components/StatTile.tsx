import { formatDelta, type Delta } from '../lib/format';
import { Sparkline } from './Sparkline';

interface StatTileProps {
  label: string;
  value: string;
  delta: Delta | null;
  comparisonLabel: string;
  trend: number[];
}

export function StatTile({ label, value, delta, comparisonLabel, trend }: StatTileProps) {
  // Every KPI on this dashboard is "up is good"; a flat change gets no direction.
  const direction = !delta || Math.abs(delta.value) < 0.0005 ? 'flat' : delta.value > 0 ? 'up' : 'down';

  return (
    <article className="card stat-tile">
      <h3 className="stat-tile__label">{label}</h3>
      <p className="stat-tile__value">{value}</p>
      <div className="stat-tile__footer">
        <p className={`stat-tile__delta stat-tile__delta--${direction}`}>
          {delta ? (
            <>
              <span aria-hidden="true">{direction === 'up' ? '▲' : direction === 'down' ? '▼' : '■'}</span>{' '}
              {formatDelta(delta)} <span className="stat-tile__comparison">{comparisonLabel}</span>
            </>
          ) : (
            <span className="stat-tile__comparison">No previous data</span>
          )}
        </p>
        <Sparkline values={trend} label={`${label} trend`} />
      </div>
    </article>
  );
}
