import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best Personal Finance App Alternatives in 2025  -  Life Admin",
  description: "Looking for a Rocket Money, Mint, or YNAB alternative? Life Admin is free, has more features, and never sells your data. Compare and see why thousands are switching.",
  keywords: ["personal finance app alternative", "best budget app 2025", "Rocket Money alternative", "Mint alternative", "YNAB alternative", "free personal finance app", "best subscription tracker app 2025"],
  alternates: { canonical: "https://lifeadminofficial.com/alternatives" },
  openGraph: {
    title: "Best Personal Finance App Alternatives in 2025",
    description: "Free, full-featured, no data selling. Life Admin replaces Rocket Money, Mint, YNAB, and more.",
    url: "https://lifeadminofficial.com/alternatives",
  },
};

const comparisons = [
  {
    app: "Rocket Money",
    href: "/vs/rocket-money",
    cost: "$12/month",
    verdict: "Life Admin has more features, costs less, and doesn't sell your data.",
    wins: ["Gas tracker", "AI receipt scanning", "Bill negotiation scripts", "No data selling"],
  },
  {
    app: "Mint",
    href: "/vs/mint",
    cost: "Shut down Jan 2024",
    verdict: "Mint is gone. Life Admin is the best free replacement with more features.",
    wins: ["Still active", "No ads", "Gas tracker", "AI features"],
  },
  {
    app: "YNAB",
    href: "/vs/ynab",
    cost: "$14.99/month",
    verdict: "YNAB is powerful but expensive. Life Admin is free and easier to use.",
    wins: ["Free forever", "Auto-detect subs", "Gas tracker", "No learning curve"],
  },
  {
    app: "Bobby",
    href: "/vs/rocket-money",
    cost: "$3/month, iOS only",
    verdict: "Bobby only tracks what you manually enter. Life Admin auto-detects everything.",
    wins: ["Bank sync", "Auto-detection", "Web app included", "Income tracking"],
  },
];

export default function Alternatives() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <div className="mb-4 text-xs font-bold uppercase tracking-widest text-brand">Alternatives</div>
      <h1 className="mb-4 text-4xl font-bold md:text-5xl">
        The best personal finance app <span className="gradient-text">alternatives in 2025</span>
      </h1>
      <p className="mb-12 max-w-2xl text-lg text-gray-400">
        Tired of paying $12/month for Rocket Money? Losing your Mint data? Done with YNAB's learning curve? Life Admin is free, does more, and never sells your financial data.
      </p>

      <div className="mb-12 space-y-4">
        {comparisons.map(c => (
          <Link key={c.app} href={c.href} className="block rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-brand/30 hover:bg-brand/[0.02]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-3">
                  <h2 className="text-lg font-bold">Life Admin vs {c.app}</h2>
                  <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs text-red-400">{c.app}: {c.cost}</span>
                </div>
                <p className="mb-4 text-sm text-gray-400">{c.verdict}</p>
                <div className="flex flex-wrap gap-2">
                  {c.wins.map(w => (
                    <span key={w} className="rounded-full border border-brand/20 bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">{w}</span>
                  ))}
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold text-brand">See comparison</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-brand/20 bg-brand/5 p-8 text-center">
        <h2 className="mb-2 text-2xl font-bold">Stop paying for apps that do less</h2>
        <p className="mb-6 text-gray-400">Life Admin is free. Connect your bank. Find forgotten subscriptions in 60 seconds.</p>
        <Link href="/signup" className="inline-block rounded-xl bg-brand-gradient px-8 py-4 font-bold text-black hover:opacity-90 transition">
          Start free  -  no card needed
        </Link>
      </div>
    </div>
  );
}
