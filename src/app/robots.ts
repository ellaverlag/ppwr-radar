import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/check"],
        disallow: [
          "/api/",
          "/auth/",
          "/login",
          "/check/ergebnis",
          "/onboarding",
          "/dashboard",
          "/dokumente",
          "/assistant",
          "/wissen",
          "/webinare",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
