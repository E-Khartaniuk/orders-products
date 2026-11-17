import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    instantInsights: {
      validationLevel: "manual-warning",
    },
  },
};

export default nextConfig;
