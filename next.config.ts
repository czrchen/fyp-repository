import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.myntassets.com", // 👈 your external domain
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", // optional: add more if needed
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com", // optional
      },
    ],
  },
};

export default nextConfig;
