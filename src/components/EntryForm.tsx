"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Trash2 } from "lucide-react";
import { deleteExpense, saveExpense } from "@/app/actions/expenses";
import { deleteIncome, saveIncome } from "@/app/actions/incomes";
import type { Category } from "@/lib/categories";
import { periodOf } from "@/lib/dates";
import { dayLabel } from "@/lib/format";
import type { Expense, Income } from "@/lib/queries";
import { CategoryIcon } from "./CategoryIcon";
import { Keypad, type Key } from "./Keypad";

export type EntryKind = "expense" | "income";

const MAX_WHOLE_DIGITS = 9;

function applyKey(amount: string, key: Key): string {
  if (key === "back") return amount.slice(0, -1);
  const [whole, fraction] = amount.split(".");
  if (key === ".") return amount.includes(".") ? amount : `${amount || "0"}.`;
  if (fraction !== undefined) return fraction.length >= 2 ? amount : amount + key;
  if (whole === "0") return key;
  return whole.length >= MAX_WHOLE_DIGITS ? amount : amount + key;
}

/** Adds or edits one entry. A new entry can be switched between expense and income. */
export function EntryForm({
  categories,
  currency,
  today,
  monthStartDay,
  kind: initialKind = "expense",
  date: initialDate,
  expense,
  income,
  fromDay = false,
}: {
  categories: Category[];
  currency: string;
  today: string;
  monthStartDay: number;
  kind?: EntryKind;
  /** The day picked on the calendar, for a new entry */
  date?: string;
  expense?: Expense;
  income?: Income;
  /** Opened from a day on the calendar, so saving returns there instead of to History */
  fromDay?: boolean;
}) {
  const router = useRouter();
  const editing = expense ?? income;
  const [kind, setKind] = useState<EntryKind>(income ? "income" : expense ? "expense" : initialKind);
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [category, setCategory] = useState(
    expense && categories.some((c) => c.name === expense.category)
      ? expense.category
      : (categories[0]?.name ?? ""),
  );
  const [date, setDate] = useState(editing?.date ?? initialDate ?? today);
  const [note, setNote] = useState(editing?.note ?? "");
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
  const canSave =
    value > 0 && (kind === "income" || category !== "") && date !== "" && !pending && !saved;
  const backTo = (d: string) =>
    expense && !fromDay
      ? periodOf(d, monthStartDay) === periodOf(today, monthStartDay)
        ? "/history"
        : `/history?month=${periodOf(d, monthStartDay)}`
      : `/add?date=${d}`;

  const save = () => {
    if (!canSave) return;
    startTransition(async () => {
      const result =
        kind === "income"
          ? await saveIncome({ id: income?.id, amount: value, note, date })
          : await saveExpense({ id: expense?.id, amount: value, category, note, date });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.push(backTo(date));
    });
  };

  const remove = () => {
    if (!editing || !window.confirm(`Delete this ${kind}?`)) return;
    startTransition(async () => {
      const result = income ? await deleteIncome(income.id) : await deleteExpense(editing.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(backTo(editing.date));
    });
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {!editing && (
            <Link
              href={`/add?date=${date || today}`}
              aria-label="Back to the day"
              className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-ink-2 active:bg-surface-2"
            >
              <ChevronLeft size={22} />
            </Link>
          )}
          <h1 className="text-2xl font-bold">
            {editing ? "Edit" : "Add"} {kind}
          </h1>
        </div>
        {editing ? (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label={`Delete ${kind}`}
            className="flex h-10 w-10 items-center justify-center rounded-full text-bad-ink active:bg-bad/10"
          >
            <Trash2 size={20} />
          </button>
        ) : (
          date && <span className="text-sm font-semibold text-ink-2">{dayLabel(date)}</span>
        )}
      </header>

      {!editing && (
        <div role="radiogroup" aria-label="Type" className="grid grid-cols-2 gap-1 rounded-2xl glass p-1 ring-1 ring-line">
          {(["expense", "income"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className={`h-10 rounded-xl text-sm font-semibold capitalize transition-colors ${
                kind === k
                  ? k === "income"
                    ? "bg-good text-white"
                    : "bg-accent text-accent-ink"
                  : "text-ink-2"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      )}

      <div className="py-3 text-center" aria-live="polite">
        <p className="text-xs font-medium text-muted">{currency}</p>
        <p className={`text-6xl font-semibold tracking-tight ${amount ? "" : "text-muted"}`}>
          {amount || "0"}
        </p>
      </div>

      {kind === "expense" && (
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
      )}

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
          placeholder={kind === "income" ? "Source, e.g. Salary" : "Note (optional)"}
          aria-label={kind === "income" ? "Source" : "Note"}
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
        ) : editing ? (
          "Save changes"
        ) : (
          `Save ${kind}`
        )}
      </button>
    </div>
  );
}
