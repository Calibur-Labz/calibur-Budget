import Link from "next/link";
import { CircleCheck, TrendingUp, TriangleAlert } from "lucide-react";
import { CategoryIcon, slotColor } from "@/components/CategoryIcon";
import { CurrencyButton } from "@/components/CurrencyButton";
import { DailyChart } from "@/components/DailyChart";
import { ExpenseRow } from "@/components/ExpenseRow";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { round2, summarize, totalsByDay, type Summary } from "@/lib/budget";
import { findCategory, type Category } from "@/lib/categories";
import { MONTH_RE, datesBetween, dayOf, periodEnd, periodOf, periodStart } from "@/lib/dates";
import { dayLabel, money, moneyCompact, rangeLabel } from "@/lib/format";
import { getExpensesBetween, getSettings, getToday, type Expense } from "@/lib/queries";

const TOP_CATEGORIES = 5;

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
  const todays = expenses.filter((e) => e.date === today);

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
            moneyCompact(chartMax, currency),
            moneyCompact(chartMax / 2, currency),
            moneyCompact(0, currency),
          ]}
          dailyBudget={dailyBudget}
          budgetLabel={money(dailyBudget, currency)}
          today={summary.phase === "current" ? today : null}
        />
      </section>

      <section className="rounded-3xl glass p-4 ring-1 ring-line">
        <h2 className="mb-3 text-base font-semibold">Spending analysis</h2>
        <SpendingAnalysis
          expenses={expenses}
          categories={categories}
          currency={currency}
          summary={summary}
          days={days}
        />
      </section>

      {summary.phase === "current" && (
        <section className="overflow-hidden rounded-3xl glass ring-1 ring-line">
          <div className="flex items-center justify-between px-4 pt-4 pb-1">
            <h2 className="text-base font-semibold">Today</h2>
            <Link href="/history" className="text-sm font-medium text-accent-deep">
              See all
            </Link>
          </div>
          {todays.length === 0 ? (
            <p className="px-4 pt-1 pb-4 text-sm text-muted">Nothing spent today.</p>
          ) : (
            <ul className="divide-y divide-line">
              {todays.map((e) => (
                <li key={e.id}>
                  <ExpenseRow expense={e} categories={categories} currency={currency} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
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
        <CurrencyButton currency={currency} />
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

/** Category split as a donut, a few headline figures, a month-end forecast and a bar per category. */
function SpendingAnalysis({
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
    .map(([name, amount]) => ({ name, amount, category: findCategory(categories, name) }))
    .sort((a, b) => b.amount - a.amount);
  const top = rows.slice(0, TOP_CATEGORIES);
  const restTotal = round2(rows.slice(TOP_CATEGORIES).reduce((a, r) => a + r.amount, 0));
  const share = (amount: number) => (amount / total) * 100;

  // Donut arcs, measured in percent of the ring (pathLength = 100)
  const segments = [
    ...top.map((r) => ({ key: r.name, amount: r.amount, color: slotColor(r.category?.slot) })),
    ...(restTotal > 0 ? [{ key: "__rest", amount: restTotal, color: "var(--axis)" }] : []),
  ];
  const gap = segments.length > 1 ? 1.5 : 0;
  const arcs = segments.map((seg, i) => ({
    ...seg,
    start: segments.slice(0, i).reduce((a, x) => a + share(x.amount), 0),
    length: Math.max(0.5, share(seg.amount) - gap),
  }));

  const peak = days.reduce((best, d) => (d.total > best.total ? d : best), days[0]);
  // Month-end forecast: the average day so far, repeated for every day of the month
  const projected =
    summary.phase === "current" && summary.mainBudget > 0
      ? round2(summary.avgPerDay * days.length)
      : null;
  const onTrack = projected !== null && projected <= summary.mainBudget;

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--grid)" strokeWidth="11" />
            {arcs.map((a) => (
              <circle
                key={a.key}
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={a.color}
                strokeWidth="11"
                pathLength={100}
                strokeDasharray={`${a.length} ${100 - a.length}`}
                strokeDashoffset={-a.start}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-medium text-muted">Spent</span>
            <span className="text-sm font-semibold tracking-tight">{moneyCompact(total, currency)}</span>
          </div>
        </div>

        <dl className="min-w-0 flex-1 space-y-2.5">
          <Insight label="Top category" value={`${top[0].name} · ${Math.round(share(top[0].amount))}%`} />
          <Insight label="Daily average" value={money(summary.avgPerDay, currency)} />
          <Insight label="Biggest day" value={`${peak.label} · ${moneyCompact(peak.total, currency)}`} />
        </dl>
      </div>

      {projected !== null && (
        <div
          className={`mt-4 flex items-center gap-3 rounded-2xl p-3 ring-1 ${
            onTrack ? "bg-good/10 ring-good/25" : "bg-bad/10 ring-bad/25"
          }`}
        >
          <TrendingUp
            size={22}
            className={`shrink-0 ${onTrack ? "text-good-ink" : "text-bad-ink"}`}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold">On pace for {money(projected, currency)} by month end</p>
            <p className="mt-0.5 text-xs text-ink-2">
              {onTrack
                ? `${money(round2(summary.mainBudget - projected), currency)} under your main budget`
                : `${money(round2(projected - summary.mainBudget), currency)} over your main budget`}
            </p>
          </div>
        </div>
      )}

      <ul className="mt-4 space-y-3.5">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-3">
            <CategoryIcon category={r.category} size={32} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium">{r.name}</span>
                <span className="text-sm font-semibold tabular-nums">{money(r.amount, currency)}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-grid">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${share(r.amount)}%`, background: slotColor(r.category?.slot) }}
                  />
                </div>
                <span className="w-8 text-right text-[11px] tabular-nums text-muted">
                  {Math.round(share(r.amount))}%
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium text-muted">{label}</dt>
      <dd className="truncate text-sm font-semibold tracking-tight">{value}</dd>
    </div>
  );
}
