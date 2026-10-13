import Link from "next/link";
import type { DayTotals } from "@/lib/budget";
import { dateOfDay, daysInMonth } from "@/lib/dates";
import { compact, dayLabel } from "@/lib/format";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * One calendar month, Monday first. Each day up to today opens that day; later days can't be picked.
 * A dot under a day marks money in (green) or out (red); today shows what was spent instead.
 */
export function MonthCalendar({
  month,
  today,
  spent,
  income,
}: {
  month: string;
  today: string;
  spent: DayTotals;
  income: DayTotals;
}) {
  // Blank cells before the 1st, so it lands under its weekday
  const lead = (new Date(`${month}-01T00:00:00Z`).getUTCDay() + 6) % 7;
  const days = Array.from({ length: daysInMonth(month) }, (_, i) => dateOfDay(month, i + 1));
  const cell = "mx-auto flex h-13 w-full max-w-13 flex-col items-center rounded-2xl pt-1.5";
  const dot = "h-1.5 w-1.5 rounded-full";

  return (
    <section className="rounded-[1.75rem] glass px-3 pt-4 pb-3 ring-1 ring-line">
      <div className="grid grid-cols-7 pb-3 text-center text-[13px] font-medium text-ink-2" aria-hidden>
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-2">
        {Array.from({ length: lead }, (_, i) => (
          <span key={i} />
        ))}
        {days.map((date, i) => {
          if (date > today) {
            return (
              <span key={date} className={`${cell} text-lg leading-6 text-ink-2`}>
                {i + 1}
              </span>
            );
          }
          const isToday = date === today;
          const out = spent[date] ?? 0;
          const inn = income[date] ?? 0;
          return (
            <Link
              key={date}
              href={`/add?date=${date}`}
              aria-label={dayLabel(date)}
              aria-current={isToday ? "date" : undefined}
              className={`${cell} transition-transform active:scale-95 ${
                isToday ? "bg-accent/10 text-accent-deep ring-[1.5px] ring-accent" : "active:bg-surface-2"
              }`}
            >
              <span className="text-lg leading-6 font-bold">{i + 1}</span>
              {isToday && out > 0 ? (
                <span className="text-[11px] leading-tight font-medium tabular-nums text-ink-2">
                  {compact(out)}
                </span>
              ) : (
                <span className="mt-1 flex gap-1">
                  {inn > 0 && <span className={`${dot} bg-good`} />}
                  {out > 0 && <span className={`${dot} bg-bad`} />}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
