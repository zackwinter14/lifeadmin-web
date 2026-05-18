import type { Metadata } from "next";
import Link from "next/link";
import { Check, X } from "lucide-react";

export const metadata: Metadata = {
  title: "Life Admin vs YNAB — Cheaper Alternative with More Features",
  description: "YNAB costs $14.99/month with no free tier. Life Admin is free and does more: auto-detect subscriptions, track gas, scan receipts with AI, and manage bills. Compare now.",
  keywords: ["YNAB alternative", "Life Admin vs YNAB", "cheaper than YNAB", "YNAB replacement free", "best YNAB alternative 2025", "You Need A Budget alternative"],
  alternates: { canonical: "https://lifeadminofficial.com/vs/ynab" },
  openGraph: {
    title: "Life Admin vs YNAB — Free Alternative That Does More",
    description: "YNAB is $14.99/month with no free tier. Life Admin is free, has bank sync, AI features, gas tracking, and no subscription required.",
    url: "https://lifeadminofficial.com/vs/ynab",
  },
};

const rows = [
  { feature: "Free tier",                  la: true,  ynab: false    },
  { feature: "Bank sync",                  la: true,  ynab: true     },
  { feature: "Auto-detect subscriptions",  la: true,  ynab: false    },
  { feature: "Cancel subscriptions",       la: true,  ynab: false    },
  { feature: "Bill calendar",             la: true,  ynab: "Limited" },
  { feature: "Bill reminders",            la: true,  ynab: false    },
  { feature: "Gas tracker",              la: true,  ynab: false    },
  { feature: "AI receipt scanning",       la: true,  ynab: false    },
  { feature: "Net worth tracker",         la: true,  ynab: "Limited" },
  { feature: "Household sharing",         la: true,  ynab: true     },
  { feature: "Bill negotiation scripts",  la: true,  ynab: false    },
  { feature: "No data selling",          la: true,  ynab: true     },
  { feature: "iOS + Web",               la: true,  ynab: true     },
  { feature: "Monthly cost",            la: "Free / $6.99", ynab: "$14.99/mo" },
  { feature: "Annual cost",             la: "Free / $49.99", ynab: "$109/yr"  },
];

function Cell({ val }: { val: boolean | string }) {
  if (val === true) return <span className="text-brand font-bold"><Check size={18} className="inline" /></span>;
  if (val === false) return <span className="text-red-400"><X size={18} className="inline" /></span>;
  return <span className="text-sm text-gray-300">{val}</span>;
}

export default function VsYNAB() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <div className="mb-4 text-xs font-bold uppercase tracking-widest text-brand">Life Admin vs YNAB</div>
      <h1 className="mb-4 text-4xl font-bold md:text-5xl">
        YNAB costs $14.99/month. <span className="gradient-text">Life Admin is free.</span>
      </h1>
      <p className="mb-12 max-w-2xl text-lg text-gray-400">
        YNAB is a powerful zero-based budgeting tool — but it's expensive, has no free tier, and doesn't auto-detect subscriptions or track gas. If you want a full financial picture without the learning curve or the price tag, Life Admin is the better choice for most people.
      </p>

      <div className="mb-12 grid gap-4 md:grid-cols-3">
        {[
          { label: "Price", la: "Free / $6.99", ynab: "$14.99/mo" },
          { label: "Free tier", la: "Yes, forever", ynab: "No (34-day trial only)" },
          { label: "Auto-detect subs", la: "Yes", ynab: "No" },
        ].map(c => (
          <div key={c.label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">{c.label}</p>
            <p className="text-sm font-bold text-brand">{c.la} <span className="text-gray-600 font-normal">vs</span> <span className="text-gray-400 font-normal">{c.ynab}</span></p>
          </div>
        ))}
      </div>

      <div className="mb-12 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <th className="p-4 text-sm text-gray-400">Feature</th>
              <th className="p-4 text-sm font-bold text-brand">Life Admin</th>
              <th className="p-4 text-sm text-gray-400">YNAB</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.feature} className={`border-t border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                <td className="p-4 text-sm">{row.feature}</td>
                <td className="p-4"><Cell val={row.la} /></td>
                <td className="p-4"><Cell val={row.ynab} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-6 text-2xl font-bold">When to choose Life Admin over YNAB</h2>
      <div className="mb-12 space-y-4">
        {[
          { title: "You want it free", body: "YNAB has a 34-day free trial, then $14.99/month or $109/year with no exceptions. Life Admin's free tier is permanent — manual tracking, bill calendar, net worth, and reminders at no cost. Upgrade only if you want bank sync." },
          { title: "You want subscriptions auto-detected", body: "YNAB syncs your bank but it won't automatically find and label your recurring subscriptions. Life Admin's AI scans 90 days of transactions and surfaces every recurring charge — even the ones billed annually that you forgot existed." },
          { title: "You don't want to study a new system", body: "YNAB has a steep learning curve around zero-based budgeting philosophy. Life Admin works the way you already think about money — you have income, you have bills, and you want to see where it all goes. No new system to learn." },
          { title: "You want gas tracking and receipt scanning", body: "YNAB doesn't track gas specifically, and has no AI receipt scanner. Life Admin tracks every fill-up automatically and lets you snap a photo of any receipt to log it instantly." },
        ].map(item => (
          <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="mb-2 font-bold">{item.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-brand/20 bg-brand/5 p-8 text-center">
        <h2 className="mb-2 text-2xl font-bold">Try Life Admin free — no trial, no card</h2>
        <p className="mb-6 text-gray-400">A permanent free tier. Upgrade when you're ready.</p>
        <Link href="/signup" className="inline-block rounded-xl bg-brand-gradient px-8 py-4 font-bold text-black hover:opacity-90 transition">
          Start free
        </Link>
      </div>
    </div>
  );
}
