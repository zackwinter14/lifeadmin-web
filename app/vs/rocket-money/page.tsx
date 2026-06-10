import type { Metadata } from "next";
import Link from "next/link";
import { Check, X } from "lucide-react";

export const metadata: Metadata = {
  title: "Life Admin vs Rocket Money  -  Better Alternative in 2025",
  description: "Life Admin vs Rocket Money: full comparison of features, pricing, and privacy. Life Admin is free, has more features, and doesn't sell your data. See why people are switching.",
  keywords: ["Rocket Money alternative", "Life Admin vs Rocket Money", "better than Rocket Money", "Rocket Money replacement", "Rocket Money free alternative", "cancel Rocket Money"],
  alternates: { canonical: "https://lifeadminofficial.com/vs/rocket-money" },
  openGraph: {
    title: "Life Admin vs Rocket Money  -  See Why People Are Switching",
    description: "Life Admin has more features, costs less, and doesn't sell your data. Free forever vs Rocket Money's $12/month.",
    url: "https://lifeadminofficial.com/vs/rocket-money",
  },
};

const rows = [
  { feature: "Free tier",                  la: true,  rm: "Limited" },
  { feature: "Auto-detect subscriptions",  la: true,  rm: true      },
  { feature: "Cancel subscriptions",       la: true,  rm: true      },
  { feature: "Income tracking",            la: true,  rm: true      },
  { feature: "Gas expense tracker",        la: true,  rm: false     },
  { feature: "Net worth tracker",          la: true,  rm: "Limited" },
  { feature: "AI receipt scanning",        la: true,  rm: false     },
  { feature: "Bill calendar",              la: true,  rm: false     },
  { feature: "Bill negotiation scripts",   la: true,  rm: false     },
  { feature: "Household sharing",          la: true,  rm: false     },
  { feature: "Budget goals",              la: true,  rm: true      },
  { feature: "iOS + Web app",             la: true,  rm: true      },
  { feature: "No data selling",           la: true,  rm: false     },
  { feature: "Monthly cost",              la: "Free / $6.99", rm: "$12/mo" },
  { feature: "Annual cost",              la: "Free / $49.99", rm: "$144/yr" },
];

function Cell({ val }: { val: boolean | string }) {
  if (val === true) return <span className="text-brand font-bold"><Check size={18} className="inline" /></span>;
  if (val === false) return <span className="text-red-400"><X size={18} className="inline" /></span>;
  return <span className="text-sm text-gray-300">{val}</span>;
}

export default function VsRocketMoney() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <div className="mb-4 text-xs font-bold uppercase tracking-widest text-brand">Life Admin vs Rocket Money</div>
      <h1 className="mb-4 text-4xl font-bold md:text-5xl">
        The best <span className="gradient-text">Rocket Money alternative</span> in 2025
      </h1>
      <p className="mb-12 max-w-2xl text-lg text-gray-400">
        Rocket Money charges $12/month, sells your data, and limits most features behind a paywall. Life Admin gives you more  -  for free. Here's the full comparison.
      </p>

      {/* Quick verdict */}
      <div className="mb-12 grid gap-4 md:grid-cols-3">
        {[
          { label: "Price", la: "Free / $6.99 Pro", rm: "$12/month" },
          { label: "Data selling", la: "Never", rm: "Yes" },
          { label: "Gas tracker", la: "Built in", rm: "Not available" },
        ].map(c => (
          <div key={c.label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">{c.label}</p>
            <p className="text-sm font-bold text-brand">{c.la} <span className="text-gray-600 font-normal">vs</span> <span className="text-gray-400 font-normal">{c.rm}</span></p>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="mb-12 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <th className="p-4 text-sm text-gray-400">Feature</th>
              <th className="p-4 text-sm font-bold text-brand">Life Admin</th>
              <th className="p-4 text-sm text-gray-400">Rocket Money</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.feature} className={`border-t border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                <td className="p-4 text-sm">{row.feature}</td>
                <td className="p-4"><Cell val={row.la} /></td>
                <td className="p-4"><Cell val={row.rm} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Why switch */}
      <h2 className="mb-6 text-2xl font-bold">Why people switch from Rocket Money to Life Admin</h2>
      <div className="mb-12 space-y-4">
        {[
          { title: "Rocket Money costs $12/month. Life Admin is free.", body: "Life Admin's free tier is a fully working app  -  not a demo. You get subscription tracking, bill calendar, net worth, and push reminders at no cost. Upgrade to Pro for $6.99/month if you want bank sync and AI features. That's still $5 less per month than Rocket Money's base plan." },
          { title: "Rocket Money sells your financial data. Life Admin doesn't.", body: "Rocket Money's business model includes selling aggregated financial data to third parties. Life Admin makes money exactly one way: Pro subscriptions. Your data is never sold, shared, or used for ads. That's the entire business model  -  no asterisks." },
          { title: "Life Admin has features Rocket Money doesn't offer.", body: "Gas tracker, AI receipt scanning, bill negotiation scripts, and household sharing are all built into Life Admin. Rocket Money has none of these. If you fill up at gas stations, snap receipts, share subscriptions with a partner, or want to negotiate your bills  -  Rocket Money can't help." },
          { title: "Life Admin is on iOS and the web. Same account, always in sync.", body: "One subscription covers both the iOS app and the full web app at lifeadminofficial.com. Your data syncs instantly across devices. No extra cost, no separate logins." },
        ].map(item => (
          <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="mb-2 font-bold">{item.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{item.body}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-brand/20 bg-brand/5 p-8 text-center">
        <h2 className="mb-2 text-2xl font-bold">Try Life Admin free  -  no card required</h2>
        <p className="mb-6 text-gray-400">Takes 60 seconds to set up. Find your first forgotten subscription today.</p>
        <Link href="/signup" className="inline-block rounded-xl bg-brand-gradient px-8 py-4 font-bold text-black hover:opacity-90 transition">
          Start free
        </Link>
        <p className="mt-3 text-xs text-gray-600">Already using Rocket Money? You can import your subscriptions manually in under 2 minutes.</p>
      </div>
    </div>
  );
}
