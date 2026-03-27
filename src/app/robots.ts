// filepath: src/app/robots.ts

import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pixel-mart-bj.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products/", "/shop/", "/search"],
        disallow: [
          "/vendor/",
          "/admin/",
          "/agent/",
          "/account/",
          "/checkout/",
          "/cart/",
          "/api/",
          "/_next/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
