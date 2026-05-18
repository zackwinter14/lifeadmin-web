import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE = "https://lifeadminofficial.com";

async function getBlogSlugs(): Promise<string[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from("blog_posts")
      .select("slug, published_at")
      .eq("published", true);
    return (data || []).map((p: any) => p.slug);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogSlugs = await getBlogSlugs();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,             lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/features`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/pricing`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/alternatives`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/vs/rocket-money`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/vs/mint`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/vs/ynab`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/blog`,         lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/tools`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/negotiation`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/school`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/transparency`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/about`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/signup`,       lastModified: new Date(), changeFrequency: "yearly",  priority: 0.8 },
    { url: `${BASE}/login`,        lastModified: new Date(), changeFrequency: "yearly",  priority: 0.5 },
    { url: `${BASE}/contact`,      lastModified: new Date(), changeFrequency: "yearly",  priority: 0.5 },
    { url: `${BASE}/privacy`,      lastModified: new Date(), changeFrequency: "yearly",  priority: 0.4 },
    { url: `${BASE}/terms`,        lastModified: new Date(), changeFrequency: "yearly",  priority: 0.4 },
  ];

  const blogPages: MetadataRoute.Sitemap = blogSlugs.map(slug => ({
    url: `${BASE}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  return [...staticPages, ...blogPages];
}
