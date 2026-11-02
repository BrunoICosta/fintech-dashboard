import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency, formatCurrencyCompact, formatDay, formatInteger } from '../lib/format';
import type { DailyPoint } from '../lib/metrics';

const AXIS_TICK = { fill: 'var(--text-muted)', fontSize: 12 };

export function VolumeChart({ data }: { data: DailyPoint[] }) {
  return (
    <section className="card chart-card" aria-labelledby="volume-title">
      <header className="card__header">
        <h2 id="volume-title">Daily approved volume</h2>
      </header>
      <div className="chart-card__plot">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--grid)" />
            <XAxis
              dataKey="day"
              tickFormatter={formatDay}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: 'var(--axis)' }}
              minTickGap={28}
            />
            <YAxis
              tickFormatter={formatCurrencyCompact}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip
              cursor={{ stroke: 'var(--axis)', strokeWidth: 1 }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as DailyPoint | undefined;
                if (!active || !point) return null;
                return (
                  <div className="chart-tooltip">
                    <p className="chart-tooltip__title">{formatDay(point.day)}</p>
                    <p>
                      <span className="chart-tooltip__key chart-tooltip__key--series-1" aria-hidden="true" />
                      Volume <strong>{formatCurrency(point.volumeCents)}</strong>
                    </p>
                    <p className="chart-tooltip__muted">{formatInteger(point.count)} transactions</p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="volumeCents"
              name="Approved volume"
              stroke="var(--series-1)"
              strokeWidth={2}
              fill="var(--series-1)"
              fillOpacity={0.1}
              activeDot={{ r: 5, fill: 'var(--series-1)', stroke: 'var(--surface)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <details className="data-table">
        <summary>View as table</summary>
        <div className="data-table__scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Approved volume</th>
                <th scope="col">Transactions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((point) => (
                <tr key={point.day}>
                  <td>{formatDay(point.day)}</td>
                  <td className="num">{formatCurrency(point.volumeCents)}</td>
                  <td className="num">{formatInteger(point.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
