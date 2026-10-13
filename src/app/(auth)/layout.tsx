import { isAuthConfigured } from "@/lib/session";

export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-4 py-10">
      <div className="glass flex w-full flex-col items-center gap-6 rounded-[2rem] px-5 py-8">
        <div className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny static icon, no optimisation needed */}
          <img src="/icons/icon-192.png" alt="" width={64} height={64} className="h-16 w-16 rounded-2xl" />
          <h1 className="text-2xl font-bold">Budget</h1>
        </div>

        {isAuthConfigured() ? (
          children
        ) : (
          <p className="rounded-2xl glass p-4 text-center text-sm text-ink-2 ring-1 ring-line">
            Set <code className="font-semibold text-ink">SESSION_SECRET</code> (16+ characters) in{" "}
            <code className="font-semibold text-ink">.env.local</code>, then restart the app.
          </p>
        )}
      </div>
    </main>
  );
}
