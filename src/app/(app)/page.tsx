import Link from "next/link";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { slotColor } from "@/components/CategoryIcon";
import { DailyChart } from "@/components/DailyChart";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { SpendingAnalysis } from "@/components/SpendingAnalysis";
import { round2, summarize, totalsByDay, type Summary } from "@/lib/budget";
import { findCategory, type Category } from "@/lib/categories";
import { MONTH_RE, datesBetween, dayOf, periodEnd, periodOf, periodStart } from "@/lib/dates";
import { dayLabel, money, moneyTrim, rangeLabel } from "@/lib/format";
import { getExpensesBetween, getSettings, getToday, type Expense } from "@/lib/queries";

/** Round the chart's axis top up to 1, 2, 2.5 or 5 × a power of ten. */
function niceMax(value: number): number {
  if (value <= 0) return 10;
  const pow = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((m) => m * pow >= value) ?? 10;
  return step * pow;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: requested } = await searchParams;
  const [settings, today] = await Promise.all([getSettings(), getToday()]);
  const { mainBudget, dailyBudget, monthStartDay, currency, categories } = settings;
  const currentMonth = periodOf(today, monthStartDay);
  const month =
    requested && MONTH_RE.test(requested) && requested <= currentMonth ? requested : currentMonth;
  const start = periodStart(month, monthStartDay);
  const end = periodEnd(month, monthStartDay);

  const expenses = await getExpensesBetween(start, end);
  const totals = totalsByDay(expenses);
  const summary = summarize({ mainBudget, dailyBudget, totals, start, end, today });

  const days = datesBetween(start, end).map((date) => {
    const total = totals[date] ?? 0;
    return { date, day: dayOf(date), total, label: dayLabel(date), value: money(total, currency) };
  });
  const chartMax = niceMax(Math.max(dailyBudget, ...days.map((d) => d.total)));

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Budget</h1>
        <MonthSwitcher
          month={month}
          currentMonth={currentMonth}
          basePath="/"
          label={monthStartDay === 1 ? undefined : rangeLabel(start, end)}
        />
      </header>

      {(mainBudget === 0 || dailyBudget === 0) && (
        <Link
          href="/settings"
          className="glass block rounded-2xl px-4 py-3 text-sm font-medium text-accent-deep"
        >
          Set your main budget and daily budget →
        </Link>
      )}

      <BalanceCard summary={summary} currency={currency} />

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Daily budget"
          value={dailyBudget > 0 ? money(dailyBudget, currency) : "—"}
          hint="Your spending target for each day"
        />
        {summary.today ? (
          <StatTile
            label="Total spent"
            value={money(summary.today.spent, currency)}
            hint={`Today · ${money(summary.spent, currency)} this month`}
          />
        ) : (
          <StatTile
            label="Total spent"
            value={money(summary.spent, currency)}
            hint={`${money(summary.avgPerDay, currency)} a day on average`}
          />
        )}
      </div>

      {(summary.today ? dailyBudget > 0 : mainBudget > 0) && (
        <StatusTile summary={summary} currency={currency} />
      )}

      <section className="rounded-3xl glass p-4 ring-1 ring-line">
        <h2 className="mb-1 text-base font-semibold">Daily spending</h2>
        <DailyChart
          days={days}
          max={chartMax}
          ticks={[
            moneyTrim(chartMax, currency),
            moneyTrim(chartMax / 2, currency),
            moneyTrim(0, currency),
          ]}
          dailyBudget={dailyBudget}
          budgetLabel={money(dailyBudget, currency)}
          today={summary.phase === "current" ? today : null}
        />
      </section>

      <section className="rounded-3xl glass p-4 ring-1 ring-line">
        <h2 className="mb-3 text-base font-semibold">Spending analysis</h2>
        <Analysis
          expenses={expenses}
          categories={categories}
          currency={currency}
          summary={summary}
          days={days}
        />
      </section>

    </div>
  );
}

/** What is still left of the main budget for the month. */
function BalanceCard({ summary, currency }: { summary: Summary; currency: string }) {
  const { mainBudget, spent, balance, today } = summary;
  const usedPct = mainBudget > 0 ? Math.min(100, (spent / mainBudget) * 100) : 0;
  const hasMain = mainBudget > 0;
  const over = hasMain && balance < 0;

  return (
    <section className="glass-accent rounded-3xl p-5 text-accent-ink">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{over ? "Over main budget by" : "Main budget left"}</p>
        {/* Display only: the currency is changed in Settings */}
        <span className="text-xs font-semibold tracking-wide opacity-90">{currency}</span>
      </div>
      <p className="mt-2 text-4xl font-semibold tracking-tight">
        {hasMain ? money(Math.abs(balance), currency) : "—"}
      </p>
      <p className="mt-1 text-sm font-medium opacity-95">
        {hasMain
          ? `${money(spent, currency)} spent of ${money(mainBudget, currency)}`
          : "No main budget set"}
      </p>

      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-white/30"
        role="progressbar"
        aria-label="Main budget used"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(usedPct)}
      >
        <div className="h-full rounded-full bg-white" style={{ width: `${usedPct}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs font-medium opacity-95">
        <span>{Math.round(usedPct)}% used</span>
        {today && (
          <span>
            {today.daysLeft} {today.daysLeft === 1 ? "day" : "days"} left
          </span>
        )}
      </div>
    </section>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl glass p-3.5 ring-1 ring-line">
      <p className="text-xs font-medium text-ink-2">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}

/** Today against the daily budget for the current month; a past month against its main budget. */
function StatusTile({ summary, currency }: { summary: Summary; currency: string }) {
  if (summary.phase === "future") return null;

  const diff = summary.today ? summary.today.diff : summary.balance;
  const good = diff >= 0;
  const label = summary.today
    ? good
      ? "Leftover today"
      : "Exceeded today"
    : good
      ? "Saved this month"
      : "Overspent this month";
  const hint = summary.today
    ? good
      ? "You can still spend this today and stay within your daily budget."
      : `Over your daily budget of ${money(summary.dailyBudget, currency)}.`
    : good
      ? "You finished the month under budget."
      : "You finished the month over budget.";
  const Icon = good ? CircleCheck : TriangleAlert;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl p-4 ring-1 ${
        good ? "bg-good/10 ring-good/25" : "bg-bad/10 ring-bad/25"
      }`}
    >
      <Icon size={28} className={`shrink-0 ${good ? "text-good-ink" : "text-bad-ink"}`} aria-hidden />
      <div className="min-w-0">
        <p className={`text-xs font-semibold ${good ? "text-good-ink" : "text-bad-ink"}`}>{label}</p>
        <p className="text-2xl font-semibold">{money(Math.abs(diff), currency)}</p>
        <p className="mt-0.5 text-xs text-ink-2">{hint}</p>
      </div>
    </div>
  );
}

/** Works out the figures for the analysis card; the card itself is interactive, so it renders on the client. */
function Analysis({
  expenses,
  categories,
  currency,
  summary,
  days,
}: {
  expenses: Expense[];
  categories: Category[];
  currency: string;
  summary: Summary;
  days: { total: number; label: string }[];
}) {
  const byName = new Map<string, number>();
  for (const e of expenses) byName.set(e.category, round2((byName.get(e.category) ?? 0) + e.amount));
  const total = round2([...byName.values()].reduce((a, b) => a + b, 0));
  if (total === 0) return <p className="text-sm text-muted">No expenses this month.</p>;

  const rows = [...byName.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => {
      const category = findCategory(categories, name);
      return {
        name,
        value: money(amount, currency),
        share: (amount / total) * 100,
        color: slotColor(category?.slot),
        category: category && { icon: category.icon, slot: category.slot },
      };
    });

  const peak = days.reduce((best, d) => (d.total > best.total ? d : best), days[0]);
  const insights = [
    { label: "Top category", value: rows[0].name, hint: `${Math.round(rows[0].share)}% of spending` },
    { label: "Daily average", value: money(summary.avgPerDay, currency), hint: "per day so far" },
    { label: "Biggest day", value: money(peak.total, currency), hint: peak.label },
    {
      label: "Expenses",
      value: String(expenses.length),
      hint: expenses.length === 1 ? "entry this month" : "entries this month",
    },
  ];

  // Month-end forecast: the average day so far, repeated for every day of the month
  let forecast = null;
  if (summary.phase === "current" && summary.mainBudget > 0) {
    const projected = round2(summary.avgPerDay * days.length);
    const onTrack = projected <= summary.mainBudget;
    forecast = {
      onTrack,
      title: `On pace for ${money(projected, currency)} by month end`,
      hint: onTrack
        ? `${money(round2(summary.mainBudget - projected), currency)} under your main budget`
        : `${money(round2(projected - summary.mainBudget), currency)} over your main budget`,
    };
  }

  return (
    <SpendingAnalysis
      rows={rows}
      totalLabel={money(total, currency)}
      insights={insights}
      forecast={forecast}
    />
  );
}
