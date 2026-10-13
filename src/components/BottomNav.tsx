"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, History, House, Plus, Settings } from "lucide-react";

// Home sits in the centre
const TABS = [
  { href: "/history", label: "History", icon: History },
  { href: "/upcoming", label: "Upcoming", icon: CalendarClock },
  { href: "/", label: "Home", icon: House },
  { href: "/add", label: "Add", icon: Plus },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Each tab is a 64px cell in a frosted pill; the active tile sits 8px inside it
// as a circle, concentric with the pill's ends.
const CELL = 64;

const matches = (href: string, pathname: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);

export function BottomNav() {
  const pathname = usePathname();
  // The tapped tab, honoured until the route catches up, so the tile starts sliding at once
  const [tapped, setTapped] = useState<{ from: string; href: string } | null>(null);
  const target = tapped && tapped.from === pathname ? tapped.href : pathname;
  const index = TABS.findIndex((t) => matches(t.href, target));

  return (
    <nav
      aria-label="Main"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
    >
      <ul className="glass-liquid pointer-events-auto relative flex h-16 shrink-0 max-[340px]:scale-90">
        {/* One tile for the whole bar: it slides between tabs instead of each tab lighting up */}
        <li
          aria-hidden
          className="nav-tile pointer-events-none absolute top-2 left-2 h-12 w-12 rounded-full transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{
            transform: `translateX(${Math.max(index, 0) * CELL}px)`,
            opacity: index < 0 ? 0 : 1,
          }}
        />
        {TABS.map(({ href, label, icon: Icon }, i) => {
          const active = i === index;
          return (
            <li key={href} className="relative h-16 w-16">
              <Link
                href={href}
                prefetch
                onClick={() => setTapped({ from: pathname, href })}
                aria-label={label}
                title={label}
                aria-current={matches(href, pathname) ? "page" : undefined}
                className={`flex h-full w-full items-center justify-center transition-colors duration-300 ${
                  active ? "text-accent-ink" : "text-ink-2"
                }`}
              >
                <Icon size={24} strokeWidth={active ? 2.25 : 1.9} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
