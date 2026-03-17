import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
  webpack(config, { isServer }) {
    // Prisma needs to be required at runtime rather than bundled by Webpack.
    // When the server bundle includes a relative require to `.prisma/client` the
    // path is rewritten and ends up pointing at `.next/...` which obviously
    // doesn't contain the generated client. Excluding it from the bundle keeps
    // Node's normal module resolution intact.
    if (isServer) {
      if (!config.externals) {
        config.externals = [];
      }
      config.externals.push('@prisma/client');
    }

    return config;
  },
};

export default nextConfig;
