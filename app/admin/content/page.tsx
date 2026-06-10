"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Sparkles, Send, Copy, Check, Globe, MessageSquare } from "lucide-react";

const REDDIT_SUBS = ["personalfinance", "frugal", "financialindependence", "povertyfinance", "Frugal", "moneysaving"];

const BLOG_IDEAS = [
  "How to find and cancel forgotten subscriptions",
  "How to build a 3-month emergency fund on any income",
  "Best subscription tracker apps in 2025",
  "How to lower your monthly bills by $200",
  "The 50/30/20 budget rule explained with examples",
  "How to track your net worth and why it matters",
  "7 subscriptions you forgot you're paying for right now",
  "How to negotiate your cable and internet bill",
];

const REDDIT_IDEAS = [
  "I found $127/month in forgotten subscriptions using a finance app",
  "How I finally got my monthly bills under control",
  "PSA: Check your bank statements for recurring charges you forgot about",
  "I cancelled 6 subscriptions I forgot I had  -  here's how",
];

export default function ContentAdmin() {
  const supabase = createClient();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [type, setType] = useState<"blog" | "reddit">("blog");
  const [topic, setTopic] = useState("");
  const [subreddit, setSubreddit] = useState("personalfinance");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
    });
  }, []);

  async function generate() {
    if (!topic.trim()) return;
    setGenerating(true);
    setResult(null);
    setPublished(false);
    try {
      const res = await fetch("/api/admin/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, topic, subreddit, userId }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "Generation failed. Try again." });
    }
    setGenerating(false);
  }

  async function publish() {
    if (!result || result.type !== "blog") return;
    setPublishing(true);
    try {
      await fetch("/api/admin/publish-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      setPublished(true);
    } catch {}
    setPublishing(false);
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputCls = "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-brand";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Content Generator</h1>
        <p className="mt-1 text-sm text-gray-400">Generate blog posts and Reddit content with one click.</p>
      </div>

      {/* Type selector */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setType("blog")}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${type === "blog" ? "border-brand/40 bg-brand/10 text-brand" : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"}`}
        >
          <Globe size={14} /> Blog Post
        </button>
        <button
          onClick={() => setType("reddit")}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${type === "reddit" ? "border-orange-500/40 bg-orange-500/10 text-orange-400" : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"}`}
        >
          <MessageSquare size={14} /> Reddit Post
        </button>
      </div>

      {/* Topic input */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500">Topic</label>
        <input
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") generate(); }}
          placeholder={type === "blog" ? "e.g. How to cancel forgotten subscriptions" : "e.g. Found $127/month in forgotten subscriptions"}
          className={inputCls}
        />
      </div>

      {/* Subreddit selector (reddit only) */}
      {type === "reddit" && (
        <div className="mb-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500">Subreddit</label>
          <select value={subreddit} onChange={e => setSubreddit(e.target.value)} className={inputCls}>
            {REDDIT_SUBS.map(s => <option key={s} value={s}>r/{s}</option>)}
          </select>
        </div>
      )}

      {/* Quick ideas */}
      <div className="mb-6">
        <p className="mb-2 text-xs text-gray-600">Quick ideas:</p>
        <div className="flex flex-wrap gap-2">
          {(type === "blog" ? BLOG_IDEAS : REDDIT_IDEAS).map(idea => (
            <button
              key={idea}
              onClick={() => setTopic(idea)}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-gray-400 hover:border-brand/30 hover:text-brand transition"
            >
              {idea}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={generate}
        disabled={generating || !topic.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient py-3 text-sm font-bold text-black hover:opacity-90 disabled:opacity-40 transition"
      >
        {generating ? (
          <><Sparkles size={15} className="animate-pulse" /> Generating with Claude...</>
        ) : (
          <><Send size={15} /> Generate {type === "blog" ? "Blog Post" : "Reddit Post"}</>
        )}
      </button>

      {/* Result */}
      {result && !result.error && (
        <div className="mt-8 space-y-4">
          {result.type === "blog" && (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">Title</p>
                <p className="font-bold">{result.title}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">Description</p>
                <p className="text-sm text-gray-300">{result.description}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {(result.tags || []).map((t: string) => (
                    <span key={t} className="rounded-full border border-brand/20 bg-brand/10 px-2 py-0.5 text-xs text-brand">{t}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Content Preview</p>
                <div
                  className="prose prose-invert prose-sm max-w-none text-gray-400"
                  dangerouslySetInnerHTML={{ __html: result.content?.slice(0, 800) + "..." }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={publish}
                  disabled={publishing || published}
                  className="flex-1 rounded-xl bg-brand-gradient py-3 text-sm font-bold text-black hover:opacity-90 disabled:opacity-50 transition"
                >
                  {published ? "Published to /blog/" + result.slug : publishing ? "Publishing..." : "Publish to Blog"}
                </button>
                <button
                  onClick={() => copy(result.content)}
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-400 hover:bg-white/5 transition"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  Copy HTML
                </button>
              </div>
              {published && (
                <a href={`/blog/${result.slug}`} target="_blank" rel="noreferrer"
                  className="block text-center text-sm text-brand hover:underline">
                  View live at /blog/{result.slug}
                </a>
              )}
            </>
          )}

          {result.type === "reddit" && (
            <>
              <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.04] p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-orange-400">r/{result.subreddit}</p>
                  <button
                    onClick={() => copy(`${result.title}\n\n${result.body}`)}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:bg-white/5 transition"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />} Copy post
                  </button>
                </div>
                <p className="mb-3 font-bold">{result.title}</p>
                <p className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed">{result.body}</p>
              </div>
              <p className="text-center text-xs text-gray-600">
                Copy and paste this directly into Reddit. Customize before posting for best results.
              </p>
            </>
          )}
        </div>
      )}

      {result?.error && (
        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          {result.error}
        </div>
      )}
    </div>
  );
}
