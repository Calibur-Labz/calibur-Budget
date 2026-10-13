import { PaymentForm } from "@/components/PaymentForm";
import { PaymentRow } from "@/components/PaymentRow";
import { round2 } from "@/lib/budget";
import { findCategory } from "@/lib/categories";
import { daysBetween, periodEnd, periodOf } from "@/lib/dates";
import { dayLabel, money } from "@/lib/format";
import { getPayments, getSettings, getToday, type Payment } from "@/lib/queries";

const SOON_DAYS = 7;

function dueText(days: number): string {
  if (days < 0) return `${-days} ${days === -1 ? "day" : "days"} overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `In ${days} days`;
}

export default async function UpcomingPage() {
  const [settings, payments, today] = await Promise.all([getSettings(), getPayments(), getToday()]);
  const { monthStartDay, currency, categories } = settings;

  const withDays = payments.map((p) => ({ ...p, days: daysBetween(today, p.dueDate) }));
  const groups = [
    { title: "Overdue", items: withDays.filter((p) => p.days < 0) },
    { title: "Next 7 days", items: withDays.filter((p) => p.days >= 0 && p.days <= SOON_DAYS) },
    { title: "Later", items: withDays.filter((p) => p.days > SOON_DAYS) },
  ].filter((g) => g.items.length > 0);

  const sum = (items: Payment[]) => round2(items.reduce((a, p) => a + p.amount, 0));
  // Overdue ones still have to come out of this month
  const monthEnd = periodEnd(periodOf(today, monthStartDay), monthStartDay);
  const thisMonth = payments.filter((p) => p.dueDate <= monthEnd);
  const overdue = withDays.filter((p) => p.days < 0).length;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Upcoming</h1>

      <section className="glass-accent rounded-3xl p-5 text-accent-ink">
        <p className="text-sm font-medium">Still to pay this month</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight">{money(sum(thisMonth), currency)}</p>
        <p className="mt-1 text-sm font-medium opacity-95">
          {thisMonth.length} {thisMonth.length === 1 ? "payment" : "payments"}
          {overdue > 0 && ` · ${overdue} overdue`}
          {payments.length > thisMonth.length &&
            ` · ${money(sum(payments), currency)} across all ${payments.length}`}
        </p>
      </section>

      <PaymentForm categories={categories} currency={currency} today={today} />

      {groups.length === 0 ? (
        <div className="rounded-3xl glass px-4 py-10 text-center ring-1 ring-line">
          <p className="font-medium">Nothing coming up</p>
          <p className="mt-1 text-sm text-ink-2">Add rent, bills or subscriptions to see them here.</p>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.title} className="overflow-hidden rounded-3xl glass ring-1 ring-line">
            <div className="flex items-center justify-between px-4 pt-3.5 pb-1.5">
              <h2
                className={`text-sm font-semibold ${group.title === "Overdue" ? "text-bad-ink" : ""}`}
              >
                {group.title}
              </h2>
              <span className="text-sm font-semibold tabular-nums text-ink-2">
                {money(sum(group.items), currency)}
              </span>
            </div>
            <ul className="divide-y divide-line">
              {group.items.map((p) => (
                <li key={p.id}>
                  <PaymentRow
                    id={p.id}
                    name={p.name}
                    category={findCategory(categories, p.category)}
                    amountLabel={money(p.amount, currency)}
                    dueLabel={`${dueText(p.days)} · ${dayLabel(p.dueDate)}`}
                    overdue={p.days < 0}
                    monthly={p.repeat === "monthly"}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
