import Link from "next/link";
import { ArrowDownLeft } from "lucide-react";
import { money } from "@/lib/format";
import type { Income } from "@/lib/queries";

export function IncomeRow({ income, currency }: { income: Income; currency: string }) {
  return (
    <Link
      href={`/add?income=${income.id}`}
      className="flex items-center gap-3 px-4 py-3 active:bg-surface-2"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-good text-white"
        aria-hidden
      >
        <ArrowDownLeft size={19} strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[15px] font-medium">
        {income.note || "Income"}
      </span>
      <span className="text-[15px] font-semibold tabular-nums text-good-ink">
        +{money(income.amount, currency)}
      </span>
    </Link>
  );
}
