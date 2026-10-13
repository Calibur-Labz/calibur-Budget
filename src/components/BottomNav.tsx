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

const HOME = TABS.findIndex((t) => t.href === "/");

// Each tab is a 64px cell; the bar is a full pill with straight edges.
// The active tile sits 8px inside it as a circle, concentric with the pill's ends.
// Home is the main action: a larger button that rises out of the middle of the bar.
const CELL = 64;
const WIDTH = CELL * TABS.length;
const RADIUS = 32;
const SHAPE = `M${RADIUS} 0H${WIDTH - RADIUS}A${RADIUS} ${RADIUS} 0 0 1 ${WIDTH} ${RADIUS}V${CELL - RADIUS}A${RADIUS} ${RADIUS} 0 0 1 ${WIDTH - RADIUS} ${CELL}H${RADIUS}A${RADIUS} ${RADIUS} 0 0 1 0 ${CELL - RADIUS}V${RADIUS}A${RADIUS} ${RADIUS} 0 0 1 ${RADIUS} 0Z`;

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
      <div
        className="pointer-events-auto relative h-16 shrink-0 max-[340px]:scale-90"
        style={{ width: WIDTH }}
      >
        {/* Soft shadow in the bar's own shape; a box-shadow would be cut off by the clip */}
        <svg
          aria-hidden
          viewBox={`0 0 ${WIDTH} ${CELL}`}
          className="absolute inset-0 translate-y-2.5 overflow-visible blur-md"
        >
          <path d={SHAPE} fill="rgba(0, 102, 204, 0.26)" />
        </svg>

        <ul className="glass-liquid relative flex h-full" style={{ clipPath: `path("${SHAPE}")` }}>
          {/* One tile for the whole bar: it slides between tabs instead of each tab lighting up */}
          <li
            aria-hidden
            className="glass-accent pointer-events-none absolute top-2 left-2 h-12 w-12 rounded-full transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{
              transform: `translateX(${Math.max(index, 0) * CELL}px)`,
              // Home has its own button, so the tile only marks the other tabs
              opacity: index < 0 || index === HOME ? 0 : 1,
            }}
          />
          {TABS.map(({ href, label, icon: Icon }, i) => {
            const active = i === index;
            // Home's cell stays empty: its button sits above the bar, outside the clip
            if (i === HOME) return <li key={href} aria-hidden className="h-16 w-16" />;
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
                  <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Glass rim following the outline */}
        <svg
          aria-hidden
          viewBox={`0 0 ${WIDTH} ${CELL}`}
          className="pointer-events-none absolute inset-0 overflow-visible"
          fill="none"
        >
          <defs>
            {/* Specular rim: bright where the light hits, fading through the middle */}
            <linearGradient id="nav-rim" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="1" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0.25" />
              <stop offset="1" stopColor="#fff" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <path d={SHAPE} stroke="rgba(0, 102, 204, 0.2)" strokeWidth="2.5" />
          <path d={SHAPE} stroke="url(#nav-rim)" strokeWidth="1.5" />
        </svg>

        <Link
          href="/"
          prefetch
          onClick={() => setTapped({ from: pathname, href: "/" })}
          aria-label="Home"
          title="Home"
          aria-current={pathname === "/" ? "page" : undefined}
          className={`glass-accent absolute -top-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full text-accent-ink transition-transform duration-300 active:scale-95 motion-reduce:transition-none ${
            index === HOME ? "scale-105" : ""
          }`}
          style={{ left: HOME * CELL - 4, border: "4px solid #fff" }}
        >
          <House size={32} strokeWidth={index === HOME ? 2.5 : 2.2} />
        </Link>
      </div>
    </nav>
  );
}
