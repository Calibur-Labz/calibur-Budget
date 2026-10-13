"use client";

import { useId, useState } from "react";

// All labels arrive pre-formatted from the server: Node and browsers format
// currencies and dates slightly differently, which would break hydration.

export interface ChartDay {
  date: string;
  day: number;
  total: number;
  /** "Mon 12 Oct" */
  label: string;
  /** "$45.50" */
  value: string;
}

export function DailyChart({
  days,
  max,
  ticks,
  dailyBudget,
  budgetLabel,
  today,
}: {
  days: ChartDay[];
  /** Top of the y-axis */
  max: number;
  /** Axis labels for the top, middle and bottom gridlines */
  ticks: [string, string, string];
  dailyBudget: number;
  budgetLabel: string;
  /** Set when the month on screen contains today. */
  today: string | null;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const peak = days.reduce((best, d) => (d.total > best.total ? d : best), days[0]);
  const fallback = today ?? (peak.total > 0 ? peak.date : null);
  const activeDate = selected && days.some((d) => d.date === selected) ? selected : fallback;
  const active = days.find((d) => d.date === activeDate);
  const budgetPct = dailyBudget > 0 ? (dailyBudget / max) * 100 : null;

  // The line runs through the centre of each day's column, up to today. Each day is 10 units
  // wide; the curve's control points sit level with its ends, so it never overshoots a value.
  const gradientId = useId();
  const points = days
    .filter((d) => today === null || d.date <= today)
    .map((d, i) => ({ x: i * 10 + 5, y: 100 - (d.total / max) * 100 }));
  const line = points
    .map((p, i) => {
      if (i === 0) return `M${p.x} ${p.y}`;
      const mid = (points[i - 1].x + p.x) / 2;
      return `C${mid} ${points[i - 1].y} ${mid} ${p.y} ${p.x} ${p.y}`;
    })
    .join("");
  const area = points.length > 1 ? `${line}V100H${points[0].x}Z` : "";

  return (
    <div>
      <p className="mb-3 text-sm text-ink-2" aria-live="polite">
        {active ? (
          <>
            {active.label} · <span className="font-semibold text-ink">{active.value}</span>
          </>
        ) : (
          "No spending yet"
        )}
      </p>

      <div className="flex gap-2">
        <div className="relative h-36 w-14 shrink-0 text-[10px] tabular-nums text-muted">
          {ticks.map((tick, i) => (
            <span
              key={i}
              className="absolute right-0 translate-y-1/2 leading-none"
              style={{ bottom: `${100 - i * 50}%` }}
            >
              {tick}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative h-36">
            {[1, 0.5].map((f) => (
              <div
                key={f}
                className="absolute inset-x-0 border-t border-grid"
                style={{ bottom: `${f * 100}%` }}
              />
            ))}
            <div className="absolute inset-x-0 bottom-0 border-t border-axis" />

            {points.length > 1 && (
              <svg
                aria-hidden
                viewBox={`0 0 ${days.length * 10} 100`}
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full overflow-visible"
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="var(--accent)" stopOpacity="0.28" />
                    <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={area} fill={`url(#${gradientId})`} />
                <path
                  d={line}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            )}

            <div className="absolute inset-0 flex items-end">
              {days.map((d) => {
                const future = today !== null && d.date > today;
                const pct = (d.total / max) * 100;
                return (
                  <button
                    key={d.date}
                    type="button"
                    disabled={future}
                    onClick={() => setSelected(d.date)}
                    onMouseEnter={() => setSelected(d.date)}
                    aria-label={`${d.label}: ${d.value}`}
                    aria-pressed={d.date === activeDate}
                    className="relative h-full flex-1"
                  >
                    {d.date === activeDate && (
                      <>
                        <span className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-dashed border-axis" />
                        <span
                          className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-accent ring-2 ring-white"
                          style={{ bottom: `${pct}%` }}
                        />
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {budgetPct !== null && (
              <div
                className="pointer-events-none absolute inset-x-0 border-t border-ink-2"
                style={{ bottom: `${budgetPct}%` }}
              />
            )}
          </div>

          <div className="mt-1.5 flex text-[10px] tabular-nums text-muted" aria-hidden>
            {days.map((d) => (
              <span key={d.date} className="relative h-3 flex-1">
                {(d.day === 1 || d.day % 5 === 0) && (
                  <span className="absolute left-1/2 -translate-x-1/2 leading-none">{d.day}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {budgetPct !== null && (
        <p className="mt-3 flex items-center gap-2 text-xs text-ink-2">
          <span className="inline-block w-4 border-t border-ink-2" aria-hidden />
          Daily budget {budgetLabel}
        </p>
      )}
    </div>
  );
}
