import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 60;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: post } = await getSupabase()
    .from("blog_posts")
    .select("title, description, tags, published_at")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (!post) return { title: "Not Found" };

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags || [],
    alternates: { canonical: `https://lifeadminofficial.com/blog/${params.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://lifeadminofficial.com/blog/${params.slug}`,
      type: "article",
      publishedTime: post.published_at,
    },
  };
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const { data: post } = await getSupabase()
    .from("blog_posts")
    .select("*")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (!post) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      {/* Breadcrumb */}
      <div className="mb-8 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/blog" className="hover:text-brand transition">Blog</Link>
        <span>/</span>
        <span className="text-gray-400">{post.title}</span>
      </div>

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {post.tags.map((tag: string) => (
            <span key={tag} className="rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">{tag}</span>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="mb-4 text-3xl font-bold leading-tight md:text-4xl">{post.title}</h1>
      <p className="mb-2 text-lg text-gray-400">{post.description}</p>

      {post.published_at && (
        <p className="mb-10 text-sm text-gray-600 border-b border-white/5 pb-6">
          {new Date(post.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      )}

      {/* Content */}
      <div
        className="prose prose-invert prose-sm max-w-none prose-headings:font-bold prose-headings:text-white prose-p:text-gray-400 prose-p:leading-relaxed prose-li:text-gray-400 prose-strong:text-white prose-a:text-brand"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* CTA */}
      <div className="mt-12 rounded-2xl border border-brand/20 bg-brand/5 p-6 text-center">
        <h2 className="mb-2 font-bold">Take control of your finances with Life Admin</h2>
        <p className="mb-4 text-sm text-gray-400">Free subscription tracker, bill manager, and AI finance assistant.</p>
        <Link href="/signup" className="inline-block rounded-xl bg-brand-gradient px-6 py-3 text-sm font-bold text-black hover:opacity-90 transition">
          Start free  -  no card needed
        </Link>
      </div>
    </div>
  );
}
