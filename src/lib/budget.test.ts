import { describe, expect, it } from "vitest";
import { summarize, totalsByDay } from "./budget";
import {
  datesBetween,
  daysInMonth,
  isRealDate,
  periodEnd,
  periodOf,
  periodStart,
  shiftMonth,
  todayInTz,
} from "./dates";

describe("dates", () => {
  it("knows month lengths", () => {
    expect(daysInMonth("2026-02")).toBe(28);
    expect(daysInMonth("2028-02")).toBe(29);
    expect(daysInMonth("2026-10")).toBe(31);
  });

  it("shifts across year boundaries", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });

  it("rejects impossible dates", () => {
    expect(isRealDate("2026-02-30")).toBe(false);
    expect(isRealDate("2026-13-01")).toBe(false);
    expect(isRealDate("2026-10-12")).toBe(true);
  });

  it("resolves today in the viewer's timezone", () => {
    const now = new Date("2026-10-12T11:30:00Z");
    expect(todayInTz("Pacific/Auckland", now)).toBe("2026-10-13");
    expect(todayInTz("America/Los_Angeles", now)).toBe("2026-10-12");
    expect(todayInTz("Not/AZone", now)).toBe("2026-10-12");
  });
});

describe("budget months", () => {
  it("are calendar months when they start on the 1st", () => {
    expect(periodOf("2026-10-13", 1)).toBe("2026-10");
    expect(periodStart("2026-10", 1)).toBe("2026-10-01");
    expect(periodEnd("2026-10", 1)).toBe("2026-10-31");
  });

  it("run from the start day to the day before the next one", () => {
    expect(periodStart("2026-10", 25)).toBe("2026-10-25");
    expect(periodEnd("2026-10", 25)).toBe("2026-11-24");
    expect(datesBetween("2026-10-25", "2026-11-24")).toHaveLength(31);
  });

  it("put days before the start day in the previous budget month", () => {
    expect(periodOf("2026-10-24", 25)).toBe("2026-09");
    expect(periodOf("2026-10-25", 25)).toBe("2026-10");
    expect(periodOf("2027-01-03", 25)).toBe("2026-12");
    expect(periodEnd("2026-12", 25)).toBe("2027-01-24");
  });
});

describe("totalsByDay", () => {
  it("sums per day without float drift", () => {
    const totals = totalsByDay([
      { date: "2026-10-01", amount: 0.1 },
      { date: "2026-10-01", amount: 0.2 },
      { date: "2026-10-02", amount: 5 },
    ]);
    expect(totals).toEqual({ "2026-10-01": 0.3, "2026-10-02": 5 });
  });
});

describe("summarize", () => {
  const totals = { "2026-10-01": 150, "2026-10-02": 50, "2026-10-03": 120, "2026-09-15": 999 };
  const october = { start: "2026-10-01", end: "2026-10-31" };
  const budgets = { mainBudget: 30000, dailyBudget: 100 };

  it("takes the month's spending off the main budget", () => {
    const s = summarize({ ...budgets, totals, ...october, today: "2026-10-03" });
    expect(s.phase).toBe("current");
    expect(s.spent).toBe(320);
    expect(s.balance).toBe(29680);
    expect(s.avgPerDay).toBe(106.67);
  });

  it("measures today against the daily budget, whatever was spent on other days", () => {
    const under = summarize({ ...budgets, totals: { ...totals, "2026-10-03": 20 }, ...october, today: "2026-10-03" });
    expect(under.today).toEqual({ spent: 20, diff: 80, daysLeft: 29 });
    const over = summarize({ ...budgets, totals, ...october, today: "2026-10-03" });
    expect(over.today).toEqual({ spent: 120, diff: -20, daysLeft: 29 });
  });

  it("keeps the two budgets independent", () => {
    const s = summarize({ mainBudget: 200, dailyBudget: 500, totals, ...october, today: "2026-10-03" });
    expect(s.balance).toBe(-120);
    expect(s.today?.diff).toBe(380);
  });

  it("only counts spending inside a budget month that starts mid-month", () => {
    const s = summarize({
      ...budgets,
      totals: { "2026-10-24": 40, "2026-10-25": 10, "2026-11-24": 5, "2026-11-25": 70 },
      start: "2026-10-25",
      end: "2026-11-24",
      today: "2026-11-02",
    });
    expect(s.spent).toBe(15);
    expect(s.today?.daysLeft).toBe(23);
  });

  it("has no today figures for a past month", () => {
    const s = summarize({ ...budgets, totals, start: "2026-09-01", end: "2026-09-30", today: "2026-10-03" });
    expect(s.phase).toBe("past");
    expect(s.today).toBeNull();
    expect(s.spent).toBe(999);
    expect(s.avgPerDay).toBe(33.3);
  });

  it("handles a future month", () => {
    const s = summarize({ ...budgets, totals, start: "2026-11-01", end: "2026-11-30", today: "2026-10-03" });
    expect(s.phase).toBe("future");
    expect(s.spent).toBe(0);
    expect(s.avgPerDay).toBe(0);
  });
});
