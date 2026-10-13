import Link from "next/link";
import { ExpenseRow } from "@/components/ExpenseRow";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { round2, totalsByDay } from "@/lib/budget";
import { MONTH_RE, periodEnd, periodOf, periodStart } from "@/lib/dates";
import { dayLabel, money, rangeLabel } from "@/lib/format";
import { getExpensesBetween, getSettings, getToday, type Expense } from "@/lib/queries";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; cat?: string }>;
}) {
  const { month: requested, cat } = await searchParams;
  const [settings, today] = await Promise.all([getSettings(), getToday()]);
  const { dailyBudget, monthStartDay, currency, categories } = settings;
  const currentMonth = periodOf(today, monthStartDay);
  const month =
    requested && MONTH_RE.test(requested) && requested <= currentMonth ? requested : currentMonth;
  const start = periodStart(month, monthStartDay);
  const end = periodEnd(month, monthStartDay);
  const all = await getExpensesBetween(start, end);
  const filter = cat && all.some((e) => e.category === cat) ? cat : undefined;
  const expenses = filter ? all.filter((e) => e.category === filter) : all;

  // Each day is judged on everything spent that day, whatever the filter
  const totals = totalsByDay(all);
  const groups = new Map<string, Expense[]>();
  for (const e of expenses) groups.set(e.date, [...(groups.get(e.date) ?? []), e]);
  const filterNames = [...new Set([...categories.map((c) => c.name), ...all.map((e) => e.category)])];
  const monthTotal = round2(expenses.reduce((a, e) => a + e.amount, 0));

  const filterHref = (name?: string) => {
    const q = new URLSearchParams();
    if (month !== currentMonth) q.set("month", month);
    if (name) q.set("cat", name);
    const qs = q.toString();
    return qs ? `/history?${qs}` : "/history";
  };
  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 ${
      active ? "bg-accent text-accent-ink ring-accent" : "glass text-ink-2 ring-line"
    }`;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">History</h1>
        <MonthSwitcher
          month={month}
          currentMonth={currentMonth}
          basePath="/history"
          params={{ cat: filter }}
          label={monthStartDay === 1 ? undefined : rangeLabel(start, end)}
        />
      </header>

      <nav aria-label="Filter by category" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5">
        <Link href={filterHref()} className={chip(!filter)} aria-current={!filter ? "true" : undefined}>
          All
        </Link>
        {filterNames.map((name) => (
          <Link
            key={name}
            href={filterHref(name)}
            className={chip(filter === name)}
            aria-current={filter === name ? "true" : undefined}
          >
            {name}
          </Link>
        ))}
      </nav>

      <p className="text-sm text-ink-2">
        {expenses.length} {expenses.length === 1 ? "expense" : "expenses"} ·{" "}
        <span className="font-semibold text-ink">{money(monthTotal, currency)}</span>
      </p>

      {groups.size === 0 ? (
        <div className="rounded-3xl glass px-4 py-10 text-center ring-1 ring-line">
          <p className="font-medium">No expenses here yet</p>
          <Link href="/add" className="mt-2 inline-block text-sm font-medium text-accent-deep">
            Add one
          </Link>
        </div>
      ) : (
        [...groups.entries()].map(([date, items]) => {
          const dayTotal = round2(items.reduce((a, e) => a + e.amount, 0));
          const diff = round2(dailyBudget - (totals[date] ?? 0));
          return (
            <section key={date} className="overflow-hidden rounded-3xl glass ring-1 ring-line">
              <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-1.5">
                <h2 className="text-sm font-semibold">
                  {date === today ? "Today" : dayLabel(date)}
                </h2>
                <div className="flex items-center gap-2">
                  {dailyBudget > 0 && !filter && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        diff >= 0 ? "bg-good/12 text-good-ink" : "bg-bad/12 text-bad-ink"
                      }`}
                    >
                      {diff >= 0 ? "Under by " : "Over by "}
                      {money(Math.abs(diff), currency)}
                    </span>
                  )}
                  <span className="text-sm font-semibold tabular-nums text-ink-2">
                    {money(dayTotal, currency)}
                  </span>
                </div>
              </div>
              <ul className="divide-y divide-line">
                {items.map((e) => (
                  <li key={e.id}>
                    <ExpenseRow expense={e} categories={categories} currency={currency} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
