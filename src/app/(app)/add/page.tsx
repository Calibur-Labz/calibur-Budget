import { notFound } from "next/navigation";
import { ExpenseForm } from "@/components/ExpenseForm";
import { getExpense, getSettings, getToday } from "@/lib/queries";

export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const [settings, today, expense] = await Promise.all([
    getSettings(),
    getToday(),
    id ? getExpense(id) : null,
  ]);
  if (id && !expense) notFound();

  return (
    <ExpenseForm
      // Remount so the form resets when switching between adding and editing
      key={expense?.id ?? "new"}
      categories={settings.categories}
      currency={settings.currency}
      today={today}
      monthStartDay={settings.monthStartDay}
      expense={expense ?? undefined}
    />
  );
}
