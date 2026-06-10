import type { Metadata } from "next";
import Link from "next/link";
import { Check, X } from "lucide-react";

export const metadata: Metadata = {
  title: "Best Mint Alternative in 2025  -  Life Admin",
  description: "Mint shut down in January 2024. Life Admin is the best Mint alternative  -  free subscription tracker, bill manager, net worth tracker, and AI finance assistant. No ads.",
  keywords: ["Mint alternative", "Mint app replacement", "Mint shut down alternative", "best Mint replacement 2025", "free Mint alternative", "Intuit Mint alternative"],
  alternates: { canonical: "https://lifeadminofficial.com/vs/mint" },
  openGraph: {
    title: "Mint Shut Down  -  Life Admin is the Best Free Alternative",
    description: "Mint is gone. Life Admin replaces everything Mint did  -  plus bank sync, AI insights, receipt scanning, and gas tracking. Free forever.",
    url: "https://lifeadminofficial.com/vs/mint",
  },
};

const rows = [
  { feature: "Still active",                la: true,  mint: false    },
  { feature: "Free tier",                   la: true,  mint: "Was free (now gone)" },
  { feature: "Subscription tracking",       la: true,  mint: true     },
  { feature: "Bank sync",                   la: true,  mint: true     },
  { feature: "Bill reminders",             la: true,  mint: true     },
  { feature: "Budget tracking",            la: true,  mint: true     },
  { feature: "Net worth tracker",          la: true,  mint: true     },
  { feature: "Gas tracker",               la: true,  mint: false    },
  { feature: "AI receipt scanning",        la: true,  mint: false    },
  { feature: "Bill negotiation scripts",   la: true,  mint: false    },
  { feature: "Household sharing",          la: true,  mint: false    },
  { feature: "No ads",                    la: true,  mint: false    },
  { feature: "No data selling",           la: true,  mint: false    },
  { feature: "iOS + Web",                 la: true,  mint: true     },
];

function Cell({ val }: { val: boolean | string }) {
  if (val === true) return <span className="text-brand font-bold"><Check size={18} className="inline" /></span>;
  if (val === false) return <span className="text-red-400"><X size={18} className="inline" /></span>;
  return <span className="text-sm text-gray-400">{val}</span>;
}

export default function VsMint() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <div className="mb-4 text-xs font-bold uppercase tracking-widest text-brand">Mint Alternative</div>
      <h1 className="mb-4 text-4xl font-bold md:text-5xl">
        Mint shut down. <span className="gradient-text">Here's what to use instead.</span>
      </h1>
      <p className="mb-4 max-w-2xl text-lg text-gray-400">
        Intuit shut down Mint in January 2024. If you're looking for a free replacement that does everything Mint did  -  and more  -  Life Admin is the best option available.
      </p>
      <div className="mb-12 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
        Mint officially shut down January 1, 2024. All Mint accounts are closed.
      </div>

      <div className="mb-12 grid gap-4 md:grid-cols-3">
        {[
          { label: "Status", la: "Active", mint: "Shut down" },
          { label: "Price", la: "Free forever", mint: "Gone" },
          { label: "Data selling", la: "Never", mint: "Was selling data" },
        ].map(c => (
          <div key={c.label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">{c.label}</p>
            <p className="text-sm font-bold text-brand">{c.la} <span className="text-gray-600 font-normal">vs</span> <span className="text-gray-400 font-normal">{c.mint}</span></p>
          </div>
        ))}
      </div>

      <div className="mb-12 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <th className="p-4 text-sm text-gray-400">Feature</th>
              <th className="p-4 text-sm font-bold text-brand">Life Admin</th>
              <th className="p-4 text-sm text-gray-400">Mint (shut down)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.feature} className={`border-t border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                <td className="p-4 text-sm">{row.feature}</td>
                <td className="p-4"><Cell val={row.la} /></td>
                <td className="p-4"><Cell val={row.mint} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-6 text-2xl font-bold">What Life Admin does that Mint never could</h2>
      <div className="mb-12 space-y-4">
        {[
          { title: "AI-powered subscription detection", body: "Connect your bank and Life Admin's AI scans 90 days of transactions to find every recurring charge  -  including annual subscriptions and free trials about to convert. Mint could track budgets, but couldn't auto-detect the subscriptions quietly draining your account." },
          { title: "Gas tracker built in", body: "Life Admin recognizes 150+ gas stations across the US, Canada, UK, EU, and beyond. Every fill-up is logged automatically with merchant, amount, and date. Mint had no gas tracking whatsoever." },
          { title: "Bill negotiation scripts", body: "AI generates word-for-word scripts to lower your cable, insurance, and phone bills before you call. Mint had no negotiation tools." },
          { title: "No ads. No data selling. Ever.", body: "Mint ran ads and sold aggregated user data. That was a core part of the business model. Life Admin makes money one way: Pro subscriptions. Your financial data is never sold or used for ads." },
        ].map(item => (
          <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="mb-2 font-bold">{item.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-brand/20 bg-brand/5 p-8 text-center">
        <h2 className="mb-2 text-2xl font-bold">Replace Mint in 60 seconds  -  free</h2>
        <p className="mb-6 text-gray-400">No credit card. No trial period. A real free tier that works.</p>
        <Link href="/signup" className="inline-block rounded-xl bg-brand-gradient px-8 py-4 font-bold text-black hover:opacity-90 transition">
          Start free
        </Link>
      </div>
    </div>
  );
}
