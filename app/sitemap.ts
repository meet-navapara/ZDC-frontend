import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://zimji.app";
  const lastModified = new Date();
  return [
    { url: `${base}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/try-on`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/login`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/register`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, lastModified, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/cookies`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
