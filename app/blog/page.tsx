import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const metadata: Metadata = {
  title: "Personal Finance Blog  -  Life Admin",
  description: "Free guides on canceling subscriptions, building emergency funds, budgeting, saving money, and tracking your finances. Practical advice from Life Admin.",
  keywords: ["personal finance blog", "how to cancel subscriptions", "budgeting tips", "save money guide", "emergency fund guide", "subscription tracker guide"],
  alternates: { canonical: "https://lifeadminofficial.com/blog" },
};

export const revalidate = 60;

async function getPosts() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from("blog_posts")
      .select("slug, title, description, tags, published_at")
      .eq("published", true)
      .order("published_at", { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}

export default async function BlogIndex() {
  const posts = await getPosts();

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <div className="mb-4 text-xs font-bold uppercase tracking-widest text-brand">Blog</div>
      <h1 className="mb-4 text-4xl font-bold">Personal Finance Guides</h1>
      <p className="mb-12 text-gray-400">Practical money advice  -  how to cancel subscriptions, build savings, track expenses, and stop wasting money on things you forgot you had.</p>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center">
          <p className="text-gray-500">Articles coming soon.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post: any) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}
              className="block rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-brand/30 hover:bg-brand/[0.02]">
              <div className="mb-1 flex flex-wrap gap-2">
                {(post.tags || []).slice(0, 3).map((tag: string) => (
                  <span key={tag} className="rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">{tag}</span>
                ))}
              </div>
              <h2 className="mb-2 text-lg font-bold">{post.title}</h2>
              <p className="text-sm text-gray-400">{post.description}</p>
              {post.published_at && (
                <p className="mt-3 text-xs text-gray-600">
                  {new Date(post.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
