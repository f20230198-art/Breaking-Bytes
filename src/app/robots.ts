import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// index the landing page; keep the signed-in areas and plumbing out of search engines
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/onboarding", "/login", "/auth", "/api"] },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
