"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { addCategory, removeCategory } from "@/app/actions/settings";
import { ICON_NAMES, MAX_CATEGORIES, SLOTS, type Category } from "@/lib/categories";
import { CategoryIcon, slotColor } from "../CategoryIcon";

type IconName = (typeof ICON_NAMES)[number];

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<IconName>("other");
  const [slot, setSlot] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const full = categories.length >= MAX_CATEGORIES;

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await addCategory({ name, icon, slot });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setName("");
      setError(null);
      setAdding(false);
    });
  };

  const remove = (category: string) => {
    if (!window.confirm(`Remove "${category}"? Existing expenses keep the name.`)) return;
    startTransition(async () => {
      const result = await removeCategory(category);
      setError(result.ok ? null : result.error);
    });
  };

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-line">
        {categories.map((c) => (
          <li key={c.name} className="flex items-center gap-3 py-2">
            <CategoryIcon category={c} size={34} />
            <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{c.name}</span>
            <button
              type="button"
              onClick={() => remove(c.name)}
              disabled={pending || categories.length <= 1}
              aria-label={`Remove ${c.name}`}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted active:bg-surface-2 disabled:opacity-30"
            >
              <X size={18} />
            </button>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="text-sm font-medium text-bad-ink">
          {error}
        </p>
      )}

      {adding ? (
        <form onSubmit={add} className="space-y-3 rounded-2xl bg-white/60 p-3 ring-1 ring-line">
          <input
            type="text"
            value={name}
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            aria-label="Category name"
            autoFocus
            className="h-12 w-full rounded-xl glass px-3 ring-1 ring-line outline-none placeholder:text-muted focus:ring-accent"
          />

          <div role="radiogroup" aria-label="Icon" className="grid grid-cols-6 gap-2">
            {ICON_NAMES.map((i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={i === icon}
                aria-label={i}
                onClick={() => setIcon(i)}
                className={`flex aspect-square items-center justify-center rounded-xl ring-2 ${
                  i === icon ? "ring-accent" : "ring-transparent"
                }`}
              >
                <CategoryIcon category={{ icon: i, slot }} size={34} />
              </button>
            ))}
          </div>

          <div role="radiogroup" aria-label="Colour" className="flex justify-between">
            {SLOTS.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={s === slot}
                aria-label={`Colour ${s}`}
                onClick={() => setSlot(s)}
                className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-white ${
                  s === slot ? "ring-ink" : "ring-transparent"
                }`}
                style={{ background: slotColor(s) }}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending || name.trim() === ""}
              className="h-11 flex-1 rounded-xl bg-accent text-sm font-semibold text-accent-ink disabled:opacity-40"
            >
              Add category
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setError(null);
              }}
              className="h-11 rounded-xl px-5 text-sm font-semibold text-ink-2 ring-1 ring-line"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          disabled={full}
          className="flex h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-accent-deep ring-1 ring-line disabled:opacity-40"
        >
          <Plus size={18} />
          {full ? `Limit of ${MAX_CATEGORIES} reached` : "New category"}
        </button>
      )}
    </div>
  );
}
