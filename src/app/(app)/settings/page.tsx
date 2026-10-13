import { Lock } from "lucide-react";
import { lock } from "@/app/actions/auth";
import { BudgetForm } from "@/components/settings/BudgetForm";
import { CategoryManager } from "@/components/settings/CategoryManager";
import { getSettings } from "@/lib/queries";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="rounded-3xl glass p-4 ring-1 ring-line">
        <h2 className="text-base font-semibold">Budget</h2>
        <p className="mt-0.5 mb-3 text-sm text-ink-2">
          Change any of these whenever you need to.
        </p>
        <BudgetForm
          mainBudget={settings.mainBudget}
          dailyBudget={settings.dailyBudget}
          monthStartDay={settings.monthStartDay}
          currency={settings.currency}
        />
      </section>

      <section className="rounded-3xl glass p-4 ring-1 ring-line">
        <h2 className="mb-1 text-base font-semibold">Categories</h2>
        <CategoryManager categories={settings.categories} />
      </section>

      <form action={lock}>
        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl glass text-[15px] font-semibold ring-1 ring-line active:bg-surface-2"
        >
          <Lock size={18} />
          Lock app
        </button>
      </form>
    </div>
  );
}
