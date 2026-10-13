"use client";

import { Delete } from "lucide-react";

export type Key = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "." | "back";

const KEYS: Key[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"];

export function Keypad({ onKey, decimal = true }: { onKey: (key: Key) => void; decimal?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map((key) =>
        key === "." && !decimal ? (
          <span key={key} />
        ) : (
          <button
            key={key}
            type="button"
            onClick={() => onKey(key)}
            aria-label={key === "back" ? "Delete last digit" : key === "." ? "Decimal point" : key}
            className="flex h-13 select-none items-center justify-center rounded-xl glass text-2xl font-medium ring-1 ring-line transition-transform active:scale-95 active:bg-surface-2"
          >
            {key === "back" ? <Delete size={24} /> : key}
          </button>
        ),
      )}
    </div>
  );
}
