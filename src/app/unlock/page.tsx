import { Lock } from "lucide-react";
import { PinPad } from "@/components/PinPad";
import { isAuthConfigured } from "@/lib/session";

export const dynamic = "force-dynamic";

export default function UnlockPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-4 py-10">
      <div className="glass flex w-full flex-col items-center gap-6 rounded-[2rem] px-5 py-8">
      <div className="flex flex-col items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-ink">
          <Lock size={26} />
        </span>
        <h1 className="text-2xl font-bold">Budget</h1>
      </div>

      {isAuthConfigured() ? (
        <PinPad />
      ) : (
        <p className="rounded-2xl glass p-4 text-center text-sm text-ink-2 ring-1 ring-line">
          Set <code className="font-semibold text-ink">APP_PIN</code> and{" "}
          <code className="font-semibold text-ink">SESSION_SECRET</code> (16+ characters) in{" "}
          <code className="font-semibold text-ink">.env.local</code>, then restart the app.
        </p>
      )}
      </div>
    </main>
  );
}
