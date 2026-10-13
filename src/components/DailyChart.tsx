"use client";

import { useState } from "react";

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
        <div className="relative h-36 w-9 shrink-0 text-[10px] tabular-nums text-muted">
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
                    className={`flex h-full flex-1 items-end justify-center px-px ${
                      d.date === activeDate ? "bg-surface-2" : ""
                    }`}
                  >
                    {d.total > 0 && (
                      <span
                        className="w-full max-w-6 rounded-t-[4px] bg-accent"
                        style={{ height: `max(2px, ${pct}%)` }}
                      />
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
