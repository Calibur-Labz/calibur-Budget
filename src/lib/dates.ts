// Dates are plain local-calendar strings: "YYYY-MM-DD" for days, "YYYY-MM" for months.

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function todayInTz(timeZone: string, now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function dayOf(date: string): number {
  return Number(date.slice(8, 10));
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function dateOfDay(month: string, day: number): string {
  return `${month}-${String(day).padStart(2, "0")}`;
}

export function isRealDate(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  const month = monthOf(date);
  if (!MONTH_RE.test(month)) return false;
  const day = dayOf(date);
  return day >= 1 && day <= daysInMonth(month);
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** Same day next month, clamped to the month's length: the 31st becomes the 30th in a 30-day month. */
export function nextMonthlyDate(date: string, anchorDay: number): string {
  const month = shiftMonth(monthOf(date), 1);
  return dateOfDay(month, Math.min(anchorDay, daysInMonth(month)));
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Every day from `start` to `end`, inclusive. */
export function datesBetween(start: string, end: string): string[] {
  return Array.from({ length: daysBetween(start, end) + 1 }, (_, i) => addDays(start, i));
}

// A budget month runs from `startDay` (1–28, e.g. payday) to the day before the next one.
// It is named by the calendar month it starts in: with startDay 25, "2026-10" is 25 Oct – 24 Nov.

export const MAX_START_DAY = 28;

export function periodOf(date: string, startDay: number): string {
  const month = monthOf(date);
  return dayOf(date) >= startDay ? month : shiftMonth(month, -1);
}

export function periodStart(period: string, startDay: number): string {
  return dateOfDay(period, startDay);
}

export function periodEnd(period: string, startDay: number): string {
  return addDays(periodStart(shiftMonth(period, 1), startDay), -1);
}
