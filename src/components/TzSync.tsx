"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Tells the server which timezone "today" should be computed in. */
export function TzSync() {
  const router = useRouter();

  useEffect(() => {
    const tz = encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const current = document.cookie
      .split("; ")
      .find((c) => c.startsWith("tz="))
      ?.slice(3);
    if (current === tz) return;
    document.cookie = `tz=${tz}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [router]);

  return null;
}
