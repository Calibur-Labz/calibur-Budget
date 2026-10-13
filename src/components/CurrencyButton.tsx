"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, X } from "lucide-react";
import { saveCurrency } from "@/app/actions/settings";
import { CURRENCIES } from "@/lib/categories";

type Currency = (typeof CURRENCIES)[number];

/** Chip showing the current currency; opens a sheet to pick another. */
export function CurrencyButton({ currency }: { currency: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const pick = (code: Currency) => {
    if (code === currency) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      const result = await saveCurrency(code);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setOpen(false);
    });
  };

  // Only rendered after a click, so Intl differences can't break hydration
  const names = open ? new Intl.DisplayNames(["en"], { type: "currency" }) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Currency: ${currency}. Change`}
        className="flex h-8 items-center gap-1 rounded-lg border border-white/50 bg-white/25 pr-2 pl-3 text-xs font-semibold backdrop-blur-md active:bg-white/40"
      >
        {currency}
        <ChevronDown size={14} strokeWidth={2.5} />
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Choose currency"
            className="fixed inset-0 z-40 flex items-end justify-center bg-ink/25 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <div
              className="glass w-full max-w-md rounded-t-[2rem] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
              style={{ background: "rgba(255, 255, 255, 0.86)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold">Currency</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink-2 active:bg-surface-2"
                >
                  <X size={18} />
                </button>
              </div>

              <ul className="grid grid-cols-2 gap-2">
                {CURRENCIES.map((code) => {
                  const active = code === currency;
                  return (
                    <li key={code}>
                      <button
                        type="button"
                        onClick={() => pick(code)}
                        disabled={pending}
                        aria-pressed={active}
                        className={`flex h-14 w-full items-center gap-2 rounded-xl px-3 text-left ring-1 disabled:opacity-60 ${
                          active
                            ? "bg-accent text-accent-ink ring-accent"
                            : "bg-white/60 ring-line active:bg-surface-2"
                        }`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{code}</span>
                          <span
                            className={`block truncate text-[11px] ${active ? "opacity-90" : "text-muted"}`}
                          >
                            {names?.of(code)}
                          </span>
                        </span>
                        {active && <Check size={18} strokeWidth={2.5} />}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {error && (
                <p role="alert" className="mt-3 text-sm font-medium text-bad-ink">
                  {error}
                </p>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
