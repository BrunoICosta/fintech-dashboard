import { useMemo, useState } from 'react';
import { ANCHOR_DAY, generateTransactions } from './data/generate';
import type { RangeDays } from './data/types';
import { formatCurrency, formatCurrencyCompact, formatDay, formatInteger, formatPercent } from './lib/format';
import { pointsDelta, relativeDelta, summarize } from './lib/metrics';
import { useTheme } from './hooks/useTheme';
import { RangePicker } from './components/RangePicker';
import { StatTile } from './components/StatTile';
import { VolumeChart } from './components/VolumeChart';
import { MethodChart } from './components/MethodChart';
import { TransactionsTable } from './components/TransactionsTable';

// Generated once at module load: the dataset is static for the lifetime of the page.
const ALL_TRANSACTIONS = generateTransactions();

export default function App() {
  const [range, setRange] = useState<RangeDays>(30);
  const { theme, toggle } = useTheme();

  const summary = useMemo(() => summarize(ALL_TRANSACTIONS, ANCHOR_DAY, range), [range]);
  const { current, previous, daily } = summary;
  const comparison = `vs previous ${range} days`;

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="logo" aria-hidden="true" />
          <div>
            <h1>Payments overview</h1>
            <p className="topbar__subtitle">
              {formatDay(daily[0].day)} – {formatDay(daily[daily.length - 1].day)}, {ANCHOR_DAY.slice(0, 4)} · demo data
            </p>
          </div>
        </div>
        <div className="topbar__actions">
          <RangePicker value={range} onChange={setRange} />
          <button
            type="button"
            className="icon-button"
            onClick={toggle}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
          </button>
        </div>
      </header>

      <main className="layout">
        <section className="kpis" aria-label="Key metrics">
          <StatTile
            label="Approved volume"
            value={formatCurrencyCompact(current.volumeCents)}
            delta={relativeDelta(current.volumeCents, previous.volumeCents)}
            comparisonLabel={comparison}
            trend={daily.map((d) => d.volumeCents)}
          />
          <StatTile
            label="Transactions"
            value={formatInteger(current.count)}
            delta={relativeDelta(current.count, previous.count)}
            comparisonLabel={comparison}
            trend={daily.map((d) => d.count)}
          />
          <StatTile
            label="Approval rate"
            value={formatPercent(current.approvalRate)}
            delta={pointsDelta(current.approvalRate, previous.approvalRate)}
            comparisonLabel={comparison}
            trend={daily.map((d) => d.approvalRate)}
          />
          <StatTile
            label="Average ticket"
            value={formatCurrency(current.avgTicketCents)}
            delta={relativeDelta(current.avgTicketCents, previous.avgTicketCents)}
            comparisonLabel={comparison}
            trend={daily.map((d) => d.avgTicketCents)}
          />
        </section>

        <div className="charts">
          <VolumeChart data={daily} />
          <MethodChart data={summary.byMethod} />
        </div>

        <TransactionsTable transactions={summary.transactions} />
      </main>

      <footer className="footer">
        Built with React, TypeScript, Recharts and TanStack Virtual. All data is randomly generated.
      </footer>
    </div>
  );
}
