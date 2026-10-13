"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { addPayment } from "@/app/actions/payments";
import type { Category } from "@/lib/categories";

export function PaymentForm({
  categories,
  currency,
  today,
}: {
  categories: Category[];
  currency: string;
  today: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(today);
  const [category, setCategory] = useState(categories[0]?.name ?? "");
  const [monthly, setMonthly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const value = Number(amount);
  const canSave = name.trim() !== "" && value > 0 && dueDate !== "" && category !== "" && !pending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    startTransition(async () => {
      const result = await addPayment({
        name,
        amount: value,
        category,
        dueDate,
        repeat: monthly ? "monthly" : "none",
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setName("");
      setAmount("");
      setDueDate(today);
      setMonthly(false);
      setError(null);
      setOpen(false);
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl glass text-[15px] font-semibold text-accent-deep ring-1 ring-line active:bg-surface-2"
      >
        <Plus size={18} strokeWidth={2.5} />
        New payment
      </button>
    );
  }

  const field =
    "h-12 w-full rounded-xl bg-white/60 px-3 ring-1 ring-line outline-none placeholder:text-muted focus:ring-accent";
  const label = "mb-1.5 block text-xs font-medium text-ink-2";
  const segment = (active: boolean) =>
    `h-10 flex-1 rounded-lg text-sm font-semibold transition-colors ${
      active ? "bg-accent text-accent-ink" : "text-ink-2"
    }`;

  return (
    <form onSubmit={submit} className="space-y-3 rounded-3xl glass p-4 ring-1 ring-line">
      <h2 className="text-base font-semibold">New payment</h2>

      <label className="block">
        <span className={label}>Name</span>
        <input
          type="text"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          placeholder="Rent, electricity, Netflix…"
          autoFocus
          className={field}
        />
      </label>

      <div className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className={label}>Amount ({currency})</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={field}
          />
        </label>
        <label className="w-40 shrink-0">
          <span className={label}>Due date</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={field}
          />
        </label>
      </div>

      <label className="block">
        <span className={label}>Category</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
          {categories.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div role="radiogroup" aria-label="Repeat" className="flex rounded-xl bg-white/60 p-1 ring-1 ring-line">
        <button
          type="button"
          role="radio"
          aria-checked={!monthly}
          onClick={() => setMonthly(false)}
          className={segment(!monthly)}
        >
          One-time
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={monthly}
          onClick={() => setMonthly(true)}
          className={segment(monthly)}
        >
          Every month
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-bad-ink">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!canSave}
          className="h-11 flex-1 rounded-xl bg-accent text-sm font-semibold text-accent-ink disabled:opacity-40"
        >
          {pending ? "Saving…" : "Add payment"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="h-11 rounded-xl px-5 text-sm font-semibold text-ink-2 ring-1 ring-line"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
