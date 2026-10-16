import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // let teammates open the dev server over the LAN (Next blocks dev assets from non-localhost hosts)
  allowedDevOrigins: ["10.30.67.85", "10.*.*.*", "192.168.*.*"],
  cacheComponents: true,
  partialPrefetching: true,
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
