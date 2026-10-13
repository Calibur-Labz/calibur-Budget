"use client";

import { useState, useTransition } from "react";
import { Check, Repeat, X } from "lucide-react";
import { deletePayment, payPayment } from "@/app/actions/payments";
import type { Category } from "@/lib/categories";
import { CategoryIcon } from "./CategoryIcon";

// Labels arrive pre-formatted from the server, as in DailyChart.

export function PaymentRow({
  id,
  name,
  category,
  amountLabel,
  dueLabel,
  overdue,
  monthly,
}: {
  id: string;
  name: string;
  category: Category | undefined;
  amountLabel: string;
  dueLabel: string;
  overdue: boolean;
  monthly: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (action: (id: string) => ReturnType<typeof payPayment>) =>
    startTransition(async () => {
      const result = await action(id);
      setError(result.ok ? null : result.error);
    });

  const pay = () => {
    if (!window.confirm(`Mark "${name}" as paid? ${amountLabel} is added to today's expenses.`)) return;
    run(payPayment);
  };
  const remove = () => {
    if (!window.confirm(`Remove "${name}"? Nothing is added to your expenses.`)) return;
    run(deletePayment);
  };

  return (
    <div className={`px-4 py-3 ${pending ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3">
        <CategoryIcon category={category} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-medium">{name}</span>
            {monthly && <Repeat size={13} className="shrink-0 text-muted" aria-label="Repeats monthly" />}
          </span>
          <span className={`block truncate text-xs ${overdue ? "font-medium text-bad-ink" : "text-muted"}`}>
            {dueLabel}
          </span>
        </span>
        <span className="text-[15px] font-semibold tabular-nums">{amountLabel}</span>
      </div>

      <div className="mt-2.5 flex gap-2 pl-[52px]">
        <button
          type="button"
          onClick={pay}
          disabled={pending}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-accent/10 px-3.5 text-xs font-semibold text-accent-deep ring-1 ring-accent/30 active:bg-accent/20"
        >
          <Check size={15} strokeWidth={2.5} />
          Mark paid
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          aria-label={`Remove ${name}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/60 text-ink-2 ring-1 ring-line active:bg-surface-2"
        >
          <X size={16} />
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-2 pl-[52px] text-sm font-medium text-bad-ink">
          {error}
        </p>
      )}
    </div>
  );
}
