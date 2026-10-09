import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * cacheComponents is off: every page in this app reads the session cookie,
   * so nothing here is statically cacheable. Turn it back on (with Suspense
   * boundaries around the dynamic parts) if public marketing pages get added.
   */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
