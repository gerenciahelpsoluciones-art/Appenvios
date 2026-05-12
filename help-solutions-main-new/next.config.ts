import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  turbopack: {
    root: __dirname,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    inlineCss: true,
  },
  images: {
    qualities: [75, 85],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "www.tp-link.com",
      },
      {
        protocol: "https",
        hostname: "cdn.simpleicons.org",
      },
      {
        protocol: "https",
        hostname: "orbeim.vtexassets.com",
      },
      {
        protocol: "https",
        hostname: "recursos.mps.com.co",
        port: "9236",
        pathname: "/images/**",
      },
    ],
  },
}

export default nextConfig;
