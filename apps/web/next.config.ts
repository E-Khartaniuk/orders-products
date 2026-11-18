import path from "node:path";
import type { NextConfig } from "next";

const BOOTSTRAP_SCSS = [
  path.resolve(process.cwd(), "node_modules/bootstrap/scss"),
  path.resolve(process.cwd(), "../../node_modules/bootstrap/scss"),
];

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  sassOptions: {
    loadPaths: BOOTSTRAP_SCSS,
    includePaths: BOOTSTRAP_SCSS,
    quietDeps: true,
    silenceDeprecations: ["import", "global-builtin", "color-functions", "if-function"],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  experimental: {
    instantInsights: {
      validationLevel: "manual-warning",
    },
  },
};

export default nextConfig;
