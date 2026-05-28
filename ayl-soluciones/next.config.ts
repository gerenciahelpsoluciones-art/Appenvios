import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // VTEX CDN — imágenes del catálogo de productos
        protocol: "https",
        hostname: "orbeim.vtexassets.com",
        pathname: "/**",
      },
      {
        // MPS recursos — catálogo de productos
        protocol: "https",
        hostname: "recursos.mps.com.co",
        port: "9236",
        pathname: "/**",
      },
      {
        // MPS recursos sin puerto explícito (fallback)
        protocol: "http",
        hostname: "recursos.mps.com.co",
        port: "9236",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
