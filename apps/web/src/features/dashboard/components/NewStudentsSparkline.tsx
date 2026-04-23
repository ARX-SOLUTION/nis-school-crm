import type { DailyCountDto } from '@nis/shared';

interface Props {
  series: DailyCountDto[];
}

/**
 * Minimal SVG sparkline — no chart library needed for 7 data points. A bar
 * for each day, height scaled to the max value; zero-count days render as a
 * 1-pixel baseline so the axis remains visible.
 */
export function NewStudentsSparkline({ series }: Props): React.ReactElement {
  const max = Math.max(1, ...series.map((s) => s.count));
  const barWidth = 32;
  const gap = 8;
  const width = series.length * (barWidth + gap) - gap;
  const height = 96;

  return (
    <div role="img" aria-label="New students per day, last 7 days">
      <svg
        viewBox={`0 0 ${width} ${height + 20}`}
        className="w-full h-32 text-blue-600"
        preserveAspectRatio="xMidYMid meet"
      >
        {series.map((d, i) => {
          const h = Math.max(2, (d.count / max) * height);
          const x = i * (barWidth + gap);
          const y = height - h;
          return (
            <g key={d.date}>
              <rect x={x} y={y} width={barWidth} height={h} rx={3} fill="currentColor" />
              <text
                x={x + barWidth / 2}
                y={height + 14}
                textAnchor="middle"
                className="fill-slate-500"
                fontSize={10}
              >
                {d.date.slice(5)}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                className="fill-slate-700"
                fontSize={10}
              >
                {d.count}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
