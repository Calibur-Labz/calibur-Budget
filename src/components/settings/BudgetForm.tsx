"use client";

import { useState, useTransition } from "react";
import { saveBudget } from "@/app/actions/settings";
import { CURRENCIES } from "@/lib/categories";
import { MAX_START_DAY } from "@/lib/dates";

type Currency = (typeof CURRENCIES)[number];

const START_DAYS = Array.from({ length: MAX_START_DAY }, (_, i) => i + 1);

export function BudgetForm({
  mainBudget,
  dailyBudget,
  monthStartDay,
  currency,
}: {
  mainBudget: number;
  dailyBudget: number;
  monthStartDay: number;
  currency: string;
}) {
  const [main, setMain] = useState(mainBudget ? String(mainBudget) : "");
  const [daily, setDaily] = useState(dailyBudget ? String(dailyBudget) : "");
  const [startDay, setStartDay] = useState(monthStartDay);
  const [code, setCode] = useState(currency);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const amount = (text: string) => (text === "" ? 0 : Number(text));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const values = [amount(main), amount(daily)];
    if (values.some((v) => !Number.isFinite(v) || v < 0)) {
      setMessage({ ok: false, text: "Enter valid amounts." });
      return;
    }
    startTransition(async () => {
      const result = await saveBudget({
        mainBudget: values[0],
        dailyBudget: values[1],
        monthStartDay: startDay,
        currency: code as Currency,
      });
      setMessage(result.ok ? { ok: true, text: "Saved" } : { ok: false, text: result.error });
    });
  };

  const field = "h-12 w-full rounded-xl bg-white/60 px-3 ring-1 ring-line outline-none focus:ring-accent";
  const label = "mb-1.5 block text-xs font-medium text-ink-2";
  const hint = "mt-1.5 block text-xs text-muted";
  const edit = (set: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    set(e.target.value);
    setMessage(null);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className={label}>Main budget</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={main}
          onChange={edit(setMain)}
          placeholder="0.00"
          className={field}
        />
        <span className={hint}>The money you have for the month, from your salary.</span>
      </label>

      <label className="block">
        <span className={label}>Daily budget</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={daily}
          onChange={edit(setDaily)}
          placeholder="0.00"
          className={field}
        />
        <span className={hint}>Your spending target for each day.</span>
      </label>

      <div className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className={label}>Month starts on</span>
          <select
            value={startDay}
            onChange={(e) => {
              setStartDay(Number(e.target.value));
              setMessage(null);
            }}
            className={field}
          >
            {START_DAYS.map((d) => (
              <option key={d} value={d}>
                Day {d}
              </option>
            ))}
          </select>
        </label>
        <label className="w-28 shrink-0">
          <span className={label}>Currency</span>
          <select
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setMessage(null);
            }}
            className={field}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-xl bg-accent px-6 text-sm font-semibold text-accent-ink disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {message && (
          <p
            role="status"
            className={`text-sm font-medium ${message.ok ? "text-good-ink" : "text-bad-ink"}`}
          >
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
