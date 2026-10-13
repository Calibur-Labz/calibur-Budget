import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Minus, Plus } from "lucide-react";
import { EntryForm } from "@/components/EntryForm";
import { ExpenseRow } from "@/components/ExpenseRow";
import { IncomeRow } from "@/components/IncomeRow";
import { MonthCalendar } from "@/components/MonthCalendar";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { round2, totalsByDay } from "@/lib/budget";
import { MONTH_RE, dateOfDay, daysInMonth, isRealDate, monthOf } from "@/lib/dates";
import { dayLabel, money } from "@/lib/format";
import {
  getExpense,
  getExpensesBetween,
  getIncome,
  getIncomesBetween,
  getSettings,
  getToday,
} from "@/lib/queries";

const sum = (items: { amount: number }[]) => round2(items.reduce((a, e) => a + e.amount, 0));

function Totals({ income, spent, currency }: { income: number; spent: number; currency: string }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl glass px-4 py-3 ring-1 ring-line">
        <p className="text-xs font-medium text-muted">Income</p>
        <p className="text-lg font-semibold tabular-nums text-good-ink">{money(income, currency)}</p>
      </div>
      <div className="rounded-2xl glass px-4 py-3 ring-1 ring-line">
        <p className="text-xs font-medium text-muted">Spent</p>
        <p className="text-lg font-semibold tabular-nums">{money(spent, currency)}</p>
      </div>
    </div>
  );
}

// The Add tab is three steps, picked by the query string: the calendar, then a day
// (?date=), then the form (?date=&new=). ?id= and ?income= open an entry for editing.
export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{
    id?: string;
    income?: string;
    date?: string;
    new?: string;
    from?: string;
    month?: string;
  }>;
}) {
  const params = await searchParams;
  const [settings, today] = await Promise.all([getSettings(), getToday()]);
  const { currency, categories, monthStartDay } = settings;
  const form = { categories, currency, today, monthStartDay };

  if (params.id) {
    const expense = await getExpense(params.id);
    if (!expense) notFound();
    // Keyed so the form resets when switching between entries
    return <EntryForm key={expense.id} {...form} expense={expense} fromDay={params.from === "day"} />;
  }
  if (params.income) {
    const income = await getIncome(params.income);
    if (!income) notFound();
    return <EntryForm key={income.id} {...form} income={income} />;
  }

  const date = params.date && isRealDate(params.date) && params.date <= today ? params.date : undefined;
  const currentMonth = monthOf(today);

  if (date && (params.new === "expense" || params.new === "income")) {
    return <EntryForm key={`${date}-${params.new}`} {...form} kind={params.new} date={date} />;
  }

  if (date) {
    const [expenses, incomes] = await Promise.all([
      getExpensesBetween(date, date),
      getIncomesBetween(date, date),
    ]);
    const month = monthOf(date);
    const action =
      "flex h-13 items-center justify-center gap-1.5 rounded-xl text-[15px] font-semibold active:opacity-80";
    return (
      <div className="space-y-4">
        <header className="flex items-center gap-1">
          <Link
            href={month === currentMonth ? "/add" : `/add?month=${month}`}
            aria-label="Back to the calendar"
            className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-ink-2 active:bg-surface-2"
          >
            <ChevronLeft size={22} />
          </Link>
          <h1 className="text-2xl font-bold">{date === today ? "Today" : dayLabel(date)}</h1>
        </header>

        <Totals income={sum(incomes)} spent={sum(expenses)} currency={currency} />

        <div className="grid grid-cols-2 gap-3">
          <Link href={`/add?date=${date}&new=income`} className={`${action} bg-good text-white`}>
            <Plus size={19} strokeWidth={2.4} /> Income
          </Link>
          <Link href={`/add?date=${date}&new=expense`} className={`${action} bg-accent text-accent-ink`}>
            <Minus size={19} strokeWidth={2.4} /> Expense
          </Link>
        </div>

        {incomes.length + expenses.length === 0 ? (
          <div className="rounded-3xl glass px-4 py-10 text-center ring-1 ring-line">
            <p className="font-medium">Nothing on this day yet</p>
            <p className="mt-1 text-sm text-muted">Add an income or an expense above.</p>
          </div>
        ) : (
          <section className="overflow-hidden rounded-3xl glass ring-1 ring-line">
            <ul className="divide-y divide-line">
              {incomes.map((i) => (
                <li key={i.id}>
                  <IncomeRow income={i} currency={currency} />
                </li>
              ))}
              {expenses.map((e) => (
                <li key={e.id}>
                  <ExpenseRow
                    expense={e}
                    categories={categories}
                    currency={currency}
                    href={`/add?id=${e.id}&from=day`}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  const month =
    params.month && MONTH_RE.test(params.month) && params.month <= currentMonth
      ? params.month
      : currentMonth;
  const start = dateOfDay(month, 1);
  const end = dateOfDay(month, daysInMonth(month));
  const [expenses, incomes] = await Promise.all([
    getExpensesBetween(start, end),
    getIncomesBetween(start, end),
  ]);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Add</h1>
        <MonthSwitcher month={month} currentMonth={currentMonth} basePath="/add" />
      </header>

      <p className="text-sm text-ink-2">Pick a day to add an expense or an income.</p>

      <MonthCalendar
        month={month}
        today={today}
        spent={totalsByDay(expenses)}
        income={totalsByDay(incomes)}
      />

      {/* The month's totals; each tile adds one for today */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/add?date=${today}&new=income`}
          className="rounded-2xl glass px-4 py-3 ring-1 ring-line active:opacity-80"
        >
          <span className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-2">Income</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-good/15 text-good-ink">
              <Plus size={15} strokeWidth={2.6} />
            </span>
          </span>
          <span className="mt-0.5 block truncate text-lg font-bold tabular-nums text-good-ink">
            {money(sum(incomes), currency)}
          </span>
        </Link>
        <Link
          href={`/add?date=${today}&new=expense`}
          className="rounded-2xl glass px-4 py-3 ring-1 ring-line active:opacity-80"
        >
          <span className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-2">Spent</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bad/15 text-bad-ink">
              <Minus size={15} strokeWidth={2.6} />
            </span>
          </span>
          <span className="mt-0.5 block truncate text-lg font-bold tabular-nums">
            {money(sum(expenses), currency)}
          </span>
        </Link>
      </div>

      <Link
        href={`/add?date=${today}&new=expense`}
        className="flex h-14 items-center justify-center rounded-2xl bg-accent text-lg font-semibold text-accent-ink active:opacity-80"
      >
        Add Transaction
      </Link>
    </div>
  );
}
