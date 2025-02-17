import type { NextConfig } from "next";
import { CDN_URL } from './lib/constants'

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: new URL(CDN_URL).hostname,
      }
    ]
  }
};

export default nextConfig;
