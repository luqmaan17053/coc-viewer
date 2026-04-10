import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api-assets.clashofclans.com",
      },
      {
        protocol: "https",
        hostname: "**.clashofclans.com",
      },
    ],
  },
};

export default nextConfig;