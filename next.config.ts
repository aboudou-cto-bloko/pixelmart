import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Formats modernes pour réduire la bande passante (WebP + AVIF)
    formats: ["image/avif", "image/webp"],
    // Cache agressif côté Next.js Image Optimization (10 jours)
    minimumCacheTTL: 864_000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.convex.cloud",
      },
      {
        protocol: "https",
        hostname: "basic-heron-166.convex.cloud",
      },
      {
        protocol: "https",
        hostname: "unpkg.com",
      },
    ],
  },

  // Headers HTTP pour cacher les assets statiques agressivement
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Compression gzip activée par défaut dans Next.js — on force aussi brotli
  compress: true,
};

export default nextConfig;
