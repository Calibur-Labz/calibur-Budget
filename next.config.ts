import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev badge sits on top of the bottom app bar's first tab
  devIndicators: false,
  experimental: {
    // Keep a visited screen for 30s so switching back to a tab is instant.
    // Every server action revalidates the layout, which clears this cache.
    staleTimes: { dynamic: 30 },
  },
};

export default nextConfig;
