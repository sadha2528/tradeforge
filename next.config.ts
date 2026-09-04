import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Disable Turbopack for builds — stable webpack handles Tailwind v4 CSS correctly */
  experimental: {
    turbo: {
      rules: {},
    },
  } as Record<string, unknown>,
};

export default nextConfig;
