import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    ENABLE_QUICK_LOGIN: process.env.ENABLE_QUICK_LOGIN,
    LOGS_DIRECTORY: process.env.LOGS_DIRECTORY,
  },
};

export default nextConfig;
