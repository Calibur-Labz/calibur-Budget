import Link from "next/link";
import { findCategory, type Category } from "@/lib/categories";
import { money } from "@/lib/format";
import type { Expense } from "@/lib/queries";
import { CategoryIcon } from "./CategoryIcon";

export function ExpenseRow({
  expense,
  categories,
  currency,
  href = `/add?id=${expense.id}`,
}: {
  expense: Expense;
  categories: Category[];
  currency: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 active:bg-surface-2"
    >
      <CategoryIcon category={findCategory(categories, expense.category)} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{expense.category}</span>
        {expense.note && <span className="block truncate text-sm text-muted">{expense.note}</span>}
      </span>
      <span className="text-[15px] font-semibold tabular-nums">{money(expense.amount, currency)}</span>
    </Link>
  );
}
