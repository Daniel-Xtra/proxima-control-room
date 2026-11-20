import type { ReactNode } from "react";

const TONE = {
  success: "text-success-solid",
  danger: "text-danger",
  warning: "text-warning-solid",
  info: "text-chart-1",
} as const;

export type DonutTone = keyof typeof TONE;

export interface DonutSegment {
  label: string;
  value: number;
  tone: DonutTone;
}

const SIZE = 160;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A ring split by share. The segments are named in the legend beside it, so the chart itself is decorative. */
export function DonutChart({
  segments,
  center,
}: {
  segments: DonutSegment[];
  /** Shown in the hole of the ring. */
  center?: ReactNode;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  // Each arc starts where the one before it ended.
  const arcs = segments.map((segment, index) => ({
    segment,
    length: (segment.value / total) * CIRCUMFERENCE,
    start:
      (segments.slice(0, index).reduce((sum, other) => sum + other.value, 0) / total) *
      CIRCUMFERENCE,
  }));

  return (
    <div className="relative size-40 shrink-0">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" className="size-full -rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-neutral-bg"
        />
        {total > 0
          ? arcs.map(({ segment, length, start }, index) => (
              <circle
                key={segment.label}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                strokeWidth={STROKE}
                strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                strokeDashoffset={-start}
                className={`chart-sweep stroke-current ${TONE[segment.tone]}`}
                style={{ animationDelay: `${index * 120}ms` }}
              />
            ))
          : null}
      </svg>
      {center ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {center}
        </div>
      ) : null}
    </div>
  );
}
