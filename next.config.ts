import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Formats modernes pour réduire la bande passante (WebP + AVIF)
    formats: ["image/avif", "image/webp"],
    // Cache agressif côté Next.js Image Optimization (10 jours)
    minimumCacheTTL: 864_000,
    // Breakpoints responsive — évite de générer des variantes inutiles
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.convex.cloud",
      },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },

  // Headers HTTP — sécurité OWASP + cache assets statiques
  async headers() {
    // Content-Security-Policy
    // 'unsafe-inline' requis pour Next.js App Router (hydration scripts + JSON-LD inline)
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://connect.facebook.net https://cdn.chatway.app",
      "style-src 'self' 'unsafe-inline' https://*.chatway.app https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.convex.cloud https://picsum.photos https://www.facebook.com https://*.tile.openstreetmap.org https://unpkg.com https://*.chatway.app",
      "font-src 'self' https://*.chatway.app https://fonts.gstatic.com",
      "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://nominatim.openstreetmap.org https://api.moneroo.io https://www.facebook.com https://connect.facebook.net https://*.chatway.app wss://*.chatway.app https://www.cloudflare.com",
      "frame-src https://widget.chatway.app",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; ");

    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      // frame-ancestors 'none' dans le CSP couvre les browsers modernes
      // X-Frame-Options reste pour les anciens browsers
      { key: "X-Frame-Options", value: "DENY" },
      // X-XSS-Protection est déprécié — la protection est assurée par le CSP
      { key: "X-XSS-Protection", value: "0" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(self), payment=()",
      },
      // HSTS — force HTTPS pour 2 ans (inclut sous-domaines + preload list)
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      { key: "Content-Security-Policy", value: csp },
    ];

    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
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
      {
        source: "/icons/:path*",
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
