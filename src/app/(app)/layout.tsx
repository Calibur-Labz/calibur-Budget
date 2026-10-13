import { BottomNav } from "@/components/BottomNav";
import { TzSync } from "@/components/TzSync";

// Every screen reads live data and the viewer's cookies
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="mx-auto min-h-dvh max-w-md px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-[calc(env(safe-area-inset-bottom)+6.5rem)]">
        {children}
      </main>
      <BottomNav />
      <TzSync />
    </>
  );
}
