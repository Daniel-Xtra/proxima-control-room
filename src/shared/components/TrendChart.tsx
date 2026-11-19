import { useEffect, useId, useRef, useState, type PointerEvent } from "react";

interface TrendChartProps {
  values: number[];
  labels: string[];
  /** Formats the y-axis ticks. */
  format: (value: number) => string;
  /** Formats the figure shown in the hover tooltip. Defaults to `format`. */
  formatFull?: (value: number) => string;
  averageLabel: string;
  /** Text alternative for the chart, which is decorative to assistive tech. */
  summary: string;
}

const DEFAULT_WIDTH = 640;
const PAD = { top: 16, right: 16, bottom: 28, left: 56 };

/** A smooth curve through the points that never dips below or above them between two samples. */
function smoothPath(points: [number, number][]): string {
  const n = points.length;
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i]!;
    const [x1, y1] = points[i + 1]!;
    dx.push(x1 - x0);
    slope.push((y1 - y0) / (x1 - x0));
  }
  const tangent = points.map((_, i) => {
    if (i === 0) return slope[0]!;
    if (i === n - 1) return slope[n - 2]!;
    return slope[i - 1]! * slope[i]! <= 0 ? 0 : (slope[i - 1]! + slope[i]!) / 2;
  });
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
      continue;
    }
    const a = tangent[i]! / slope[i]!;
    const b = tangent[i + 1]! / slope[i]!;
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      tangent[i] = tau * a * slope[i]!;
      tangent[i + 1] = tau * b * slope[i]!;
    }
  }
  const [startX, startY] = points[0]!;
  let path = `M${startX.toFixed(1)},${startY.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i]!;
    const [x1, y1] = points[i + 1]!;
    const step = dx[i]! / 3;
    path += ` C${(x0 + step).toFixed(1)},${(y0 + tangent[i]! * step).toFixed(1)} ${(x1 - step).toFixed(1)},${(y1 - tangent[i + 1]! * step).toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  return path;
}

/** Smooth area chart with a dashed average and a tooltip that follows the pointer. */
export function TrendChart({
  values,
  labels,
  format,
  formatFull = format,
  averageLabel,
  summary,
}: TrendChartProps) {
  const gradientId = useId();
  const box = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [hover, setHover] = useState<number | null>(null);
  // The chart is drawn at its real width, so axis text keeps its size instead of shrinking with the screen.
  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0) setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const WIDTH = width;
  const HEIGHT = width < 480 ? 220 : 280;
  if (values.length < 2) return null;
  const max = Math.max(...values) || 1;
  const average = values.reduce((sum, v) => sum + v, 0) / values.length;
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (values.length - 1)) * innerW;
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const line = smoothPath(values.map((v, i) => [x(i), y(v)]));
  const area = `${line} L${x(values.length - 1)},${PAD.top + innerH} L${x(0)},${PAD.top + innerH} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const labelStep = Math.ceil(labels.length / (width < 480 ? 4 : 8));

  function track(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const at = ((event.clientX - bounds.left - PAD.left) / innerW) * (values.length - 1);
    setHover(Math.min(values.length - 1, Math.max(0, Math.round(at))));
  }

  const hoverValue = hover === null ? null : values[hover]!;

  return (
    <figure ref={box} className="relative m-0">
      <figcaption className="sr-only">{summary}</figcaption>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        aria-hidden="true"
        className="block h-auto w-full touch-pan-y text-chart-1"
        onPointerMove={track}
        onPointerDown={track}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
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
              strokeDasharray={tick === 0 ? undefined : "2 4"}
            />
            <text
              x={PAD.left - 8}
              y={y(tick) + 3}
              textAnchor="end"
              className="fill-chart-axis text-[10px]"
            >
              {format(tick)}
            </text>
          </g>
        ))}
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
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
          className="fill-chart-axis text-[10px]"
        >
          {averageLabel}
        </text>
        {labels.map((label, i) =>
          i % labelStep === 0 ? (
            <text
              key={label + i}
              x={x(i)}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="fill-chart-axis text-[10px]"
            >
              {label}
            </text>
          ) : null,
        )}
        {hover !== null && hoverValue !== null ? (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              className="stroke-border"
              strokeWidth="1"
            />
            <circle
              cx={x(hover)}
              cy={y(hoverValue)}
              r="5"
              className="fill-surface"
              stroke="currentColor"
              strokeWidth="2.5"
            />
          </g>
        ) : null}
      </svg>
      {hover !== null && hoverValue !== null ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-ink px-2.5 py-1.5 text-center text-xs whitespace-nowrap text-on-ink shadow-md"
          style={{
            left: Math.min(Math.max(x(hover), 48), WIDTH - 48),
            top: Math.max(y(hoverValue) - 12, 36),
          }}
        >
          <span className="block font-semibold tabular-nums">{formatFull(hoverValue)}</span>
          <span className="block opacity-70">{labels[hover]}</span>
        </div>
      ) : null}
    </figure>
  );
}
