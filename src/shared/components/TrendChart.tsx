import { useId } from "react";

interface TrendChartProps {
  values: number[];
  labels: string[];
  /** Formats the y-axis ticks and the average label. */
  format: (value: number) => string;
  averageLabel: string;
  /** Text alternative for the chart, which is decorative to assistive tech. */
  summary: string;
}

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 12, right: 12, bottom: 24, left: 56 };

/** Area line chart in the reference's style: smooth line, soft fill and a dashed average. */
export function TrendChart({ values, labels, format, averageLabel, summary }: TrendChartProps) {
  const gradientId = useId();
  if (values.length < 2) return null;
  const max = Math.max(...values) || 1;
  const average = values.reduce((sum, v) => sum + v, 0) / values.length;
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (values.length - 1)) * innerW;
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const line = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const area = `${line.join(" ")} L${x(values.length - 1)},${PAD.top + innerH} L${x(0)},${PAD.top + innerH} Z`;
  const ticks = [0, 0.33, 0.66, 1].map((f) => f * max);
  const labelStep = Math.ceil(labels.length / 6);

  return (
    <figure className="m-0">
      <figcaption className="sr-only">{summary}</figcaption>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        aria-hidden="true"
        className="h-auto w-full text-chart-2"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              className="stroke-border-soft"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 8}
              y={y(tick) + 3}
              textAnchor="end"
              className="fill-muted-text text-[9px]"
            >
              {format(tick)}
            </text>
          </g>
        ))}
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line.join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <line
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={y(average)}
          y2={y(average)}
          className="stroke-muted-text"
          strokeDasharray="4 4"
          strokeWidth="1"
        />
        <text
          x={WIDTH - PAD.right}
          y={y(average) - 4}
          textAnchor="end"
          className="fill-muted-text text-[9px]"
        >
          {averageLabel}
        </text>
        {labels.map((label, i) =>
          i % labelStep === 0 ? (
            <text
              key={label + i}
              x={x(i)}
              y={HEIGHT - 6}
              textAnchor="middle"
              className="fill-muted-text text-[9px]"
            >
              {label}
            </text>
          ) : null,
        )}
      </svg>
    </figure>
  );
}
