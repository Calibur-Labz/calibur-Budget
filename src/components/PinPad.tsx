"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { unlock } from "@/app/actions/auth";
import { Keypad, type Key } from "./Keypad";

const MAX_LENGTH = 12;

export function PinPad() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const press = useCallback((key: Key) => {
    setError(null);
    setPin((p) => (key === "back" ? p.slice(0, -1) : p.length >= MAX_LENGTH ? p : p + key));
  }, []);

  const submit = useCallback(() => {
    if (pin === "" || pending) return;
    startTransition(async () => {
      // On success the action redirects and never returns
      const result = await unlock(pin);
      if (result?.error) {
        setError(result.error);
        setPin("");
      }
    });
  }, [pin, pending]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key as Key);
      else if (e.key === "Backspace") press("back");
      else if (e.key === "Enter") submit();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [press, submit]);

  return (
    <div className="w-full space-y-6">
      <div className="flex h-4 items-center justify-center gap-3" aria-label={`${pin.length} digits entered`}>
        {pin.length === 0 ? (
          <span className="text-sm text-muted">Enter your PIN</span>
        ) : (
          Array.from({ length: pin.length }, (_, i) => (
            <span key={i} className="h-3.5 w-3.5 rounded-full bg-accent" />
          ))
        )}
      </div>

      <p role="alert" className="min-h-5 text-center text-sm font-medium text-bad-ink">
        {error}
      </p>

      <Keypad onKey={press} decimal={false} />

      <button
        type="button"
        onClick={submit}
        disabled={pin === "" || pending}
        className="h-14 w-full rounded-xl bg-accent text-lg font-semibold text-accent-ink disabled:opacity-40"
      >
        {pending ? "Checking…" : "Unlock"}
      </button>
    </div>
  );
}
