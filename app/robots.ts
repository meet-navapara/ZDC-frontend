import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/admin/", "/business/", "/api/"],
    },
    sitemap: "https://zimji.app/sitemap.xml",
  };
}
