"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";
import { deleteExpense, saveExpense } from "@/app/actions/expenses";
import type { Category } from "@/lib/categories";
import { periodOf } from "@/lib/dates";
import type { Expense } from "@/lib/queries";
import { CategoryIcon } from "./CategoryIcon";
import { Keypad, type Key } from "./Keypad";

const MAX_WHOLE_DIGITS = 9;

function applyKey(amount: string, key: Key): string {
  if (key === "back") return amount.slice(0, -1);
  const [whole, fraction] = amount.split(".");
  if (key === ".") return amount.includes(".") ? amount : `${amount || "0"}.`;
  if (fraction !== undefined) return fraction.length >= 2 ? amount : amount + key;
  if (whole === "0") return key;
  return whole.length >= MAX_WHOLE_DIGITS ? amount : amount + key;
}

export function ExpenseForm({
  categories,
  currency,
  today,
  monthStartDay,
  expense,
}: {
  categories: Category[];
  currency: string;
  today: string;
  monthStartDay: number;
  expense?: Expense;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [category, setCategory] = useState(
    expense && categories.some((c) => c.name === expense.category)
      ? expense.category
      : (categories[0]?.name ?? ""),
  );
  const [date, setDate] = useState(expense?.date ?? today);
  const [note, setNote] = useState(expense?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const press = useCallback((key: Key) => {
    setError(null);
    setAmount((a) => applyKey(a, key));
  }, []);

  // Hardware keyboard support, unless the user is typing in a field
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9.]$/.test(e.key)) press(e.key as Key);
      else if (e.key === "Backspace") press("back");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [press]);

  const value = Number(amount);
  const canSave = value > 0 && category !== "" && date !== "" && !pending && !saved;
  const backTo = (d: string) =>
    expense
      ? periodOf(d, monthStartDay) === periodOf(today, monthStartDay)
        ? "/history"
        : `/history?month=${periodOf(d, monthStartDay)}`
      : "/";

  const save = () => {
    if (!canSave) return;
    startTransition(async () => {
      const result = await saveExpense({ id: expense?.id, amount: value, category, note, date });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.push(backTo(date));
    });
  };

  const remove = () => {
    if (!expense || !window.confirm("Delete this expense?")) return;
    startTransition(async () => {
      const result = await deleteExpense(expense.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(backTo(expense.date));
    });
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{expense ? "Edit expense" : "Add expense"}</h1>
        {expense && (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label="Delete expense"
            className="flex h-10 w-10 items-center justify-center rounded-full text-bad-ink active:bg-bad/10"
          >
            <Trash2 size={20} />
          </button>
        )}
      </header>

      <div className="py-3 text-center" aria-live="polite">
        <p className="text-xs font-medium text-muted">{currency}</p>
        <p className={`text-6xl font-semibold tracking-tight ${amount ? "" : "text-muted"}`}>
          {amount || "0"}
        </p>
      </div>

      <div role="radiogroup" aria-label="Category" className="grid grid-cols-4 gap-2">
        {categories.map((c) => {
          const active = c.name === category;
          return (
            <button
              key={c.name}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setCategory(c.name)}
              className={`flex flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 ring-1 transition-colors ${
                active ? "bg-accent/12 ring-accent" : "glass ring-line"
              }`}
            >
              <CategoryIcon category={c} size={34} />
              <span className="w-full truncate text-center text-[11px] font-medium">{c.name}</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Date"
          className="h-12 w-40 shrink-0 rounded-xl glass px-3 ring-1 ring-line outline-none focus:ring-accent"
        />
        <input
          type="text"
          value={note}
          maxLength={120}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          aria-label="Note"
          className="h-12 min-w-0 flex-1 rounded-xl glass px-3 ring-1 ring-line outline-none placeholder:text-muted focus:ring-accent"
        />
      </div>

      <Keypad onKey={press} />

      {error && (
        <p role="alert" className="text-center text-sm font-medium text-bad-ink">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={!canSave}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-accent text-lg font-semibold text-accent-ink transition-opacity disabled:opacity-40"
      >
        {saved ? (
          <>
            <Check size={22} /> Saved
          </>
        ) : pending ? (
          "Saving…"
        ) : expense ? (
          "Save changes"
        ) : (
          "Save expense"
        )}
      </button>
    </div>
  );
}
