import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { shiftMonth } from "@/lib/dates";
import { monthLabel } from "@/lib/format";

export function MonthSwitcher({
  month,
  currentMonth,
  basePath,
  params = {},
  label,
}: {
  month: string;
  currentMonth: string;
  basePath: string;
  params?: Record<string, string | undefined>;
  /** Shown instead of the month name, for budget months that don't start on the 1st */
  label?: string;
}) {
  const hrefFor = (m: string) => {
    const q = new URLSearchParams();
    if (m !== currentMonth) q.set("month", m);
    for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
    const qs = q.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const atLatest = month >= currentMonth;
  const arrow = "flex h-9 w-9 items-center justify-center rounded-full text-ink-2 active:bg-surface-2";

  return (
    <div className="flex items-center gap-1">
      <Link href={hrefFor(shiftMonth(month, -1))} aria-label="Previous month" className={arrow}>
        <ChevronLeft size={20} />
      </Link>
      <span className="min-w-28 text-center text-sm font-semibold">{label ?? monthLabel(month)}</span>
      {atLatest ? (
        <span className={`${arrow} opacity-30`} aria-hidden>
          <ChevronRight size={20} />
        </span>
      ) : (
        <Link href={hrefFor(shiftMonth(month, 1))} aria-label="Next month" className={arrow}>
          <ChevronRight size={20} />
        </Link>
      )}
    </div>
  );
}
