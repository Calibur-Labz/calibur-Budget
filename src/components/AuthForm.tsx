"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { login, register } from "@/app/actions/auth";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const registering = mode === "register";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    startTransition(async () => {
      // On success the action redirects and never returns
      const result = registering
        ? await register({ name, email, password })
        : await login({ email, password });
      if (result?.error) setError(result.error);
    });
  };

  const field =
    "h-12 w-full rounded-xl bg-white/60 px-3 ring-1 ring-line outline-none placeholder:text-muted focus:ring-accent";
  const label = "mb-1.5 block text-xs font-medium text-ink-2";
  const edit = (set: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    set(e.target.value);
    setError(null);
  };

  return (
    <form onSubmit={submit} className="w-full space-y-4">
      {registering && (
        <label className="block">
          <span className={label}>Name</span>
          <input
            type="text"
            value={name}
            onChange={edit(setName)}
            maxLength={60}
            autoComplete="name"
            required
            className={field}
          />
        </label>
      )}
      <label className="block">
        <span className={label}>Email</span>
        <input
          type="email"
          value={email}
          onChange={edit(setEmail)}
          autoComplete="email"
          inputMode="email"
          required
          className={field}
        />
      </label>
      <label className="block">
        <span className={label}>Password</span>
        <input
          type="password"
          value={password}
          onChange={edit(setPassword)}
          minLength={registering ? 8 : undefined}
          autoComplete={registering ? "new-password" : "current-password"}
          required
          className={field}
        />
        {registering && <span className="mt-1.5 block text-xs text-muted">At least 8 characters.</span>}
      </label>

      <p role="alert" className="min-h-5 text-sm font-medium text-bad-ink">
        {error}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="h-13 w-full rounded-xl bg-accent text-base font-semibold text-accent-ink disabled:opacity-40"
      >
        {pending ? "Please wait…" : registering ? "Create account" : "Log in"}
      </button>

      <p className="text-center text-sm text-ink-2">
        {registering ? "Already have an account? " : "New here? "}
        <Link href={registering ? "/login" : "/register"} className="font-semibold text-accent-deep">
          {registering ? "Log in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
