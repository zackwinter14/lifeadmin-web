import { MetadataRoute } from "next";

const BASE_URL = "https://lifeadminofficial.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const publicPages = [
    { url: "/", priority: 1.0, changeFrequency: "weekly" },
    { url: "/features", priority: 0.9, changeFrequency: "monthly" },
    { url: "/pricing", priority: 0.9, changeFrequency: "monthly" },
    { url: "/tools", priority: 0.8, changeFrequency: "monthly" },
    { url: "/transparency", priority: 0.7, changeFrequency: "monthly" },
    { url: "/school", priority: 0.7, changeFrequency: "monthly" },
    { url: "/negotiation", priority: 0.7, changeFrequency: "monthly" },
    { url: "/about", priority: 0.6, changeFrequency: "monthly" },
    { url: "/contact", priority: 0.5, changeFrequency: "yearly" },
    { url: "/privacy", priority: 0.4, changeFrequency: "yearly" },
    { url: "/terms", priority: 0.4, changeFrequency: "yearly" },
    { url: "/login", priority: 0.5, changeFrequency: "yearly" },
    { url: "/signup", priority: 0.8, changeFrequency: "yearly" },
  ] as const;

  return publicPages.map(page => ({
    url: `${BASE_URL}${page.url}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
