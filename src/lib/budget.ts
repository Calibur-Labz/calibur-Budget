import { daysBetween } from "./dates";

/** Total spent per day, keyed by "YYYY-MM-DD". */
export type DayTotals = Record<string, number>;

export type Phase = "past" | "current" | "future";

export interface Summary {
  phase: Phase;
  /** Money set aside for the whole budget month, from salary */
  mainBudget: number;
  /** Spent in the budget month */
  spent: number;
  /** mainBudget − spent: what is still left of it */
  balance: number;
  /** The spending target for every day */
  dailyBudget: number;
  avgPerDay: number;
  /** Only set when the budget month contains today. */
  today: {
    spent: number;
    /** dailyBudget − spent: positive is leftover, negative is exceeded */
    diff: number;
    daysLeft: number;
  } | null;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function totalsByDay(expenses: { date: string; amount: number }[]): DayTotals {
  const totals: DayTotals = {};
  for (const e of expenses) {
    totals[e.date] = round2((totals[e.date] ?? 0) + e.amount);
  }
  return totals;
}

function sumBetween(totals: DayTotals, start: string, end: string): number {
  let sum = 0;
  for (const [date, total] of Object.entries(totals)) {
    if (date >= start && date <= end) sum += total;
  }
  return round2(sum);
}

/** `start` and `end` are the first and last day of the budget month on screen. */
export function summarize(args: {
  mainBudget: number;
  dailyBudget: number;
  totals: DayTotals;
  start: string;
  end: string;
  today: string;
}): Summary {
  const { mainBudget, dailyBudget, totals, start, end, today } = args;
  const spent = sumBetween(totals, start, end);
  const phase: Phase = today > end ? "past" : today < start ? "future" : "current";
  const daysElapsed =
    phase === "past" ? daysBetween(start, end) + 1 : phase === "current" ? daysBetween(start, today) + 1 : 0;

  let todayInfo: Summary["today"] = null;
  if (phase === "current") {
    const spentToday = totals[today] ?? 0;
    todayInfo = {
      spent: spentToday,
      diff: round2(dailyBudget - spentToday),
      daysLeft: daysBetween(today, end) + 1,
    };
  }

  return {
    phase,
    mainBudget,
    spent,
    balance: round2(mainBudget - spent),
    dailyBudget,
    avgPerDay: daysElapsed ? round2(spent / daysElapsed) : 0,
    today: todayInfo,
  };
}
