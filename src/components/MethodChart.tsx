import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency, formatCurrencyCompact, formatPercent } from '../lib/format';
import type { MethodPoint } from '../lib/metrics';

export function MethodChart({ data }: { data: MethodPoint[] }) {
  return (
    <section className="card chart-card" aria-labelledby="method-title">
      <header className="card__header">
        <h2 id="method-title">Volume by payment method</h2>
      </header>
      <div className="chart-card__plot">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 64, bottom: 0, left: 0 }} barCategoryGap="30%">
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              width={104}
              tick={{ fill: 'var(--text-secondary)', fontSize: 13 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--axis)' }}
            />
            <Tooltip
              cursor={{ fill: 'var(--hover-wash)' }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as MethodPoint | undefined;
                if (!active || !point) return null;
                return (
                  <div className="chart-tooltip">
                    <p className="chart-tooltip__title">{point.label}</p>
                    <p>
                      <strong>{formatCurrency(point.volumeCents)}</strong>
                    </p>
                    <p className="chart-tooltip__muted">{formatPercent(point.share)} of approved volume</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="volumeCents" name="Approved volume" fill="var(--series-1)" barSize={20} radius={[0, 4, 4, 0]}>
              <LabelList
                dataKey="volumeCents"
                position="right"
                formatter={(value) => formatCurrencyCompact(Number(value))}
                fill="var(--text-secondary)"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="data-table">
        <summary>View as table</summary>
        <div className="data-table__scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Method</th>
                <th scope="col">Approved volume</th>
                <th scope="col">Share</th>
              </tr>
            </thead>
            <tbody>
              {data.map((point) => (
                <tr key={point.method}>
                  <td>{point.label}</td>
                  <td className="num">{formatCurrency(point.volumeCents)}</td>
                  <td className="num">{formatPercent(point.share)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
