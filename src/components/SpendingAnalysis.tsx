"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import type { Category } from "@/lib/categories";

// All labels arrive pre-formatted from the server: Node and browsers format
// currencies and dates slightly differently, which would break hydration.

export interface AnalysisRow {
  name: string;
  /** "Rs 1,080.00" */
  value: string;
  /** Percent of the month's spending, 0–100 */
  share: number;
  color: string;
  category: Pick<Category, "icon" | "slot"> | undefined;
}

export interface AnalysisInsight {
  label: string;
  value: string;
  hint: string;
}

export interface AnalysisForecast {
  onTrack: boolean;
  title: string;
  hint: string;
}

/** Category split as a tappable donut, headline figures, a month-end forecast and a row per category. */
export function SpendingAnalysis({
  rows,
  totalLabel,
  insights,
  forecast,
}: {
  /** Largest first */
  rows: AnalysisRow[];
  totalLabel: string;
  insights: AnalysisInsight[];
  forecast: AnalysisForecast | null;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const active = rows.find((r) => r.name === selected) ?? null;
  const toggle = (name: string) => setSelected((current) => (current === name ? null : name));

  // Donut arcs, measured in percent of the ring (pathLength = 100)
  const gap = rows.length > 1 ? 1.5 : 0;
  const arcs = rows.map((r, i) => ({
    ...r,
    start: rows.slice(0, i).reduce((a, x) => a + x.share, 0),
    length: Math.max(0.5, r.share - gap),
  }));

  return (
    <>
      <div className="relative mx-auto h-44 w-44">
        {/* The rows below are the accessible controls; the ring mirrors them for touch */}
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--grid)" strokeWidth="10" />
          {arcs.map((a) => {
            const isActive = a.name === active?.name;
            return (
              <circle
                key={a.name}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={a.color}
                strokeWidth={isActive ? 14 : 10}
                opacity={active && !isActive ? 0.3 : 1}
                pathLength={100}
                strokeDasharray={`${a.length} ${100 - a.length}`}
                strokeDashoffset={-a.start}
                pointerEvents="stroke"
                onClick={() => toggle(a.name)}
                className="cursor-pointer transition-[stroke-width,opacity] duration-300 motion-reduce:transition-none"
              />
            );
          })}
        </svg>
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-9 text-center"
          aria-live="polite"
        >
          <span className="max-w-full truncate text-xs font-medium text-muted">
            {active ? active.name : "Total spent"}
          </span>
          <span className="text-base font-semibold tracking-tight">
            {active ? active.value : totalLabel}
          </span>
          {active && (
            <span className="text-xs font-semibold" style={{ color: active.color }}>
              {Math.round(active.share)}% of spending
            </span>
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-muted">Tap a slice or a category for details</p>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {insights.map((insight) => (
          <div key={insight.label} className="rounded-2xl bg-white/60 p-3 ring-1 ring-line">
            <p className="text-[11px] font-medium text-muted">{insight.label}</p>
            <p className="mt-0.5 text-sm font-semibold tracking-tight">{insight.value}</p>
            <p className="text-[11px] text-ink-2">{insight.hint}</p>
          </div>
        ))}
      </div>

      {forecast && (
        <div
          className={`mt-2.5 flex items-center gap-3 rounded-2xl p-3 ring-1 ${
            forecast.onTrack ? "bg-good/10 ring-good/25" : "bg-bad/10 ring-bad/25"
          }`}
        >
          <TrendingUp
            size={22}
            className={`shrink-0 ${forecast.onTrack ? "text-good-ink" : "text-bad-ink"}`}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold">{forecast.title}</p>
            <p className="mt-0.5 text-xs text-ink-2">{forecast.hint}</p>
          </div>
        </div>
      )}

      <ul className="-mx-2 mt-3 space-y-1">
        {rows.map((r) => {
          const isActive = r.name === active?.name;
          return (
            <li key={r.name}>
              <button
                type="button"
                onClick={() => toggle(r.name)}
                aria-pressed={isActive}
                className={`flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-[background-color,opacity] duration-300 motion-reduce:transition-none ${
                  active && !isActive ? "opacity-50" : ""
                }`}
                style={
                  isActive
                    ? { background: `color-mix(in srgb, ${r.color} 12%, transparent)` }
                    : undefined
                }
              >
                <CategoryIcon category={r.category} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="text-xs tabular-nums text-muted">{Math.round(r.share)}% of spending</p>
                </div>
                <span className="text-sm font-semibold tabular-nums">{r.value}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
