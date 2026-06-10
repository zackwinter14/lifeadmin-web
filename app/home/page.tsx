import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { BookOpen, DollarSign, CreditCard, TrendingUp, Shield, ReceiptText, ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Personal Finance Resource Center — Life Admin",
  description: "Free personal finance guides, budgeting advice, subscription tracking tips, savings strategies, and debt payoff resources. Practical money advice for real people.",
  keywords: [
    "personal finance guides", "budgeting tips", "how to save money", "cancel subscriptions",
    "emergency fund guide", "debt payoff strategy", "net worth tracker", "financial organization",
  ],
  alternates: { canonical: "https://lifeadminofficial.com/home" },
  openGraph: {
    title: "Personal Finance Resource Center — Life Admin",
    description: "Free practical guides on saving, budgeting, subscriptions, debt, and building wealth — no jargon, no fluff.",
    url: "https://lifeadminofficial.com/home",
    siteName: "Life Admin",
    type: "website",
  },
};

const TOPICS = [
  {
    icon: Shield,
    label: "Emergency Funds",
    desc: "How to build a cash buffer that keeps one bad month from becoming a financial disaster.",
    href: "/blog/how-to-build-an-emergency-fund",
    color: "#3EA758",
  },
  {
    icon: ReceiptText,
    label: "Subscription Audits",
    desc: "The average person has 10+ active subscriptions and only remembers half of them.",
    href: "/blog/how-to-find-and-cancel-forgotten-subscriptions",
    color: "#38BDF8",
  },
  {
    icon: DollarSign,
    label: "Budgeting",
    desc: "A budget isn't a restriction — it's a record of your priorities. Here's how to build one.",
    href: "/blog/budgeting-for-beginners",
    color: "#FFB300",
  },
  {
    icon: CreditCard,
    label: "Debt Payoff",
    desc: "Two proven strategies for paying off debt. One saves more money, one works better psychologically.",
    href: "/blog/debt-snowball-vs-avalanche",
    color: "#FF6B35",
  },
  {
    icon: TrendingUp,
    label: "Net Worth",
    desc: "The single metric that tells you whether your financial life is actually improving over time.",
    href: "/blog/how-to-track-net-worth",
    color: "#AF52DE",
  },
  {
    icon: BookOpen,
    label: "Savings Goals",
    desc: "Saving without a goal is money waiting to be spent. Here's how to save with a specific plan.",
    href: "/blog/how-to-save-for-a-goal",
    color: "#FF2D55",
  },
];

const FAQS = [
  {
    q: "What is a good monthly savings rate?",
    a: "The standard target is 20% of take-home income, based on the 50/30/20 rule. That said, any consistent savings rate is better than none. If 20% is unreachable right now, start with 5% and work up. The habit matters more than the exact percentage when you're starting out.",
  },
  {
    q: "How do I find out what subscriptions I'm paying for?",
    a: "Pull up three months of bank and credit card statements and highlight every recurring charge. Also check Settings → Subscriptions on iPhone and the Google Play Store for in-app charges. Search your email for 'receipt,' 'invoice,' and 'subscription.' Most people find 4 to 8 charges they'd forgotten about.",
  },
  {
    q: "How much should an emergency fund be?",
    a: "Three months of essential expenses for most people — rent, utilities, groceries, transportation, insurance, and minimum debt payments. Six months if your income is variable or your industry is volatile. For most households this works out to $6,000 to $15,000.",
  },
  {
    q: "What's the fastest way to pay off credit card debt?",
    a: "Target the highest-interest card first (the avalanche method) while making minimum payments on all others. This saves the most money mathematically. If you need quick wins to stay motivated, pay off the smallest balance first (the snowball method) — it's slightly less efficient but more sustainable for many people.",
  },
  {
    q: "How do I start tracking my net worth?",
    a: "List everything you own with real value: cash, bank accounts, investment accounts, home equity, vehicle value. Then list everything you owe: mortgage, car loans, student loans, credit card balances. Subtract liabilities from assets. That's your net worth. Update it quarterly and track the trend over time.",
  },
  {
    q: "Is the 50/30/20 budget rule realistic?",
    a: "It's a useful starting framework, not a hard rule. In high cost-of-living areas, keeping needs under 50% is difficult — rent alone can push past that. Use the percentages as directional targets: minimize needs, keep wants honest, protect the savings allocation. The principle matters more than hitting the exact split.",
  },
];

async function getLatestPosts() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from("blog_posts")
      .select("slug, title, description, tags, published_at")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(6);
    return data || [];
  } catch {
    return [];
  }
}

export const revalidate = 60;

export default async function HomePage() {
  const posts = await getLatestPosts();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">

      {/* Hero */}
      <div className="mb-16 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand">
          Free Finance Resource Center
        </div>
        <h1 className="text-4xl font-bold leading-tight md:text-5xl">
          Practical money advice.<br />
          <span style={{ background: "linear-gradient(135deg, #3EA758, #00C853)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            No jargon. No products to sell you.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-400">
          Life Admin publishes free guides on budgeting, subscriptions, savings goals, debt payoff,
          and building net worth. Written for people who want clear answers, not complicated frameworks.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-brand" /> No paywall</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-brand" /> No email required</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-brand" /> Updated regularly</span>
        </div>
      </div>

      {/* Topic cards */}
      <section className="mb-16">
        <h2 className="mb-2 text-2xl font-bold">Browse by topic</h2>
        <p className="mb-8 text-gray-400">Start with the area that matters most to your situation right now.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map(t => {
            const Icon = t.icon;
            return (
              <Link
                key={t.label}
                href={t.href}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: t.color + "18" }}
                >
                  <Icon size={18} style={{ color: t.color }} />
                </div>
                <h3 className="mb-1.5 font-bold">{t.label}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{t.desc}</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold" style={{ color: t.color }}>
                  Read guide <ArrowRight size={12} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* About this resource */}
      <section className="mb-16 rounded-2xl border border-white/10 bg-white/[0.02] p-8">
        <h2 className="mb-4 text-xl font-bold">About this resource</h2>
        <div className="space-y-4 text-gray-400 leading-relaxed">
          <p>
            Life Admin Finance Tracker was built by Zack, an Army veteran who grew up without much money and
            learned personal finance the hard way — through trial, error, and the frustration of watching
            existing apps charge $60 to $120 per year just to show you your own bank transactions.
          </p>
          <p>
            The guides on this site are written to answer the questions real people have when they're trying
            to get their financial life together. Not abstract theory — concrete answers to concrete questions.
            How much emergency fund is enough? Which debt do I pay off first? How do I find out what I'm
            actually paying for? What does a real budget look like?
          </p>
          <p>
            The Life Admin app is free to use for all the core features: subscription tracking, bill calendar,
            budget planner, savings goals, net worth tracker, and expense logging. These guides are designed
            to complement the app, but they're useful on their own regardless of whether you use the app.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/about" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10">
            About Zack <ArrowRight size={13} />
          </Link>
          <Link href="/blog" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10">
            All articles <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      {/* Latest articles */}
      {posts.length > 0 && (
        <section className="mb-16">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Latest guides</h2>
              <p className="mt-1 text-sm text-gray-400">New articles published regularly.</p>
            </div>
            <Link href="/blog" className="text-sm font-semibold text-brand hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {posts.map((post: any) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-brand/30 hover:bg-brand/[0.02]"
              >
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-bold leading-snug">{post.title}</h3>
                  {post.published_at && (
                    <span className="shrink-0 text-xs text-gray-600">
                      {new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">{post.description}</p>
                {post.tags?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {post.tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="rounded-full border border-brand/20 bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="mb-16">
        <h2 className="mb-2 text-2xl font-bold">Common questions</h2>
        <p className="mb-8 text-gray-400">Quick answers to the personal finance questions people ask most often.</p>
        <div className="space-y-4">
          {FAQS.map(faq => (
            <div key={faq.q} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="mb-3 font-bold text-white">{faq.q}</h3>
              <p className="text-sm leading-relaxed text-gray-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Financial tools */}
      <section className="mb-16">
        <h2 className="mb-2 text-2xl font-bold">Free financial tools</h2>
        <p className="mb-8 text-gray-400">The Life Admin app is free to use. No bank connection required to get started.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "Savings goal tracker", desc: "Set goals with target amounts and dates. See progress bars and finish dates.", href: "/signup" },
            { label: "Subscription tracker", desc: "Log every recurring charge. Never be surprised by a charge you forgot about.", href: "/signup" },
            { label: "Bill calendar", desc: "See every upcoming bill in a calendar view with due-date reminders.", href: "/signup" },
            { label: "Budget planner", desc: "Set income, fixed expenses, and spending targets. Track progress by category.", href: "/signup" },
            { label: "Net worth tracker", desc: "Add assets and liabilities. Watch your net worth trend over time.", href: "/signup" },
            { label: "Expense logger", desc: "Log expenses manually or scan receipts with the AI scanner on iOS.", href: "/signup" },
          ].map(tool => (
            <Link
              key={tool.label}
              href={tool.href}
              className="flex flex-col rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-brand/30"
            >
              <span className="mb-1 font-semibold text-white">{tool.label}</span>
              <span className="text-xs leading-relaxed text-gray-500">{tool.desc}</span>
              <span className="mt-3 text-xs font-semibold text-brand">Free to use &rarr;</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-brand/20 bg-brand/5 p-8 text-center">
        <h2 className="text-2xl font-bold">Ready to put this into practice?</h2>
        <p className="mt-2 text-gray-400">
          The free Life Admin app brings all of these tools together in one place. No bank required to start.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-xl bg-brand px-7 py-3 font-semibold text-black transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #3EA758, #00C853)" }}
          >
            Start free — no card needed
          </Link>
          <Link href="/blog" className="rounded-xl border border-white/10 bg-white/5 px-7 py-3 font-semibold text-white transition hover:bg-white/10">
            Browse all guides
          </Link>
        </div>
      </section>

    </div>
  );
}
