interface SparklineProps {
  values: number[];
  label: string;
}

const WIDTH = 120;
const HEIGHT = 32;
const PAD = 4;

/** Tiny dependency-free trend line: muted history, accent dot on the latest value. */
export function Sparkline({ values, label }: SparklineProps) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => PAD + (i / (values.length - 1)) * (WIDTH - PAD * 2);
  const y = (v: number) => HEIGHT - PAD - ((v - min) / span) * (HEIGHT - PAD * 2);
  const path = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const last = values.length - 1;

  return (
    <svg className="sparkline" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={label}>
      <path d={path} className="sparkline__line" />
      <circle cx={x(last)} cy={y(values[last])} r={4} className="sparkline__dot" />
    </svg>
  );
}
