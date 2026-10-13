"use client";

import { CloudOff } from "lucide-react";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-3 text-center">
      <CloudOff size={36} className="text-muted" />
      <h1 className="text-lg font-semibold">Couldn&apos;t load your data</h1>
      <p className="max-w-64 text-sm text-ink-2">
        Check your connection, and that MONGODB_URI points at a database this app can reach.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
      >
        Try again
      </button>
    </div>
  );
}
