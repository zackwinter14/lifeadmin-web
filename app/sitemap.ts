import { MetadataRoute } from "next";

const BASE = "https://lifeadminofficial.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`,             lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/features`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/pricing`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/tools`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/negotiation`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/school`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/transparency`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/about`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/contact`,      lastModified: new Date(), changeFrequency: "yearly",  priority: 0.5 },
    { url: `${BASE}/signup`,       lastModified: new Date(), changeFrequency: "yearly",  priority: 0.8 },
    { url: `${BASE}/login`,        lastModified: new Date(), changeFrequency: "yearly",  priority: 0.5 },
    { url: `${BASE}/privacy`,      lastModified: new Date(), changeFrequency: "yearly",  priority: 0.4 },
    { url: `${BASE}/terms`,        lastModified: new Date(), changeFrequency: "yearly",  priority: 0.4 },
  ];
}
