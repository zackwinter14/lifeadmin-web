"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { History, RefreshCw, Search, ArrowUpRight, ArrowDownRight } from "lucide-react";
import MerchantLogo from "@/components/MerchantLogo";
import { simplifyName } from "@/lib/merchantUtils";
import HelpTip from "@/components/HelpTip";

interface Transaction {
  id: string;
  clean_merchant_name: string | null;
  merchant_name: string | null;
  description: string | null;
  amount: number;
  date: string;
  category: string;
  pending: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  income: "#3EA758",
  expense: "#FF6B35",
  bill: "#FFB300",
  subscription: "#AF52DE",
  transfer: "#38BDF8",
};

const CATEGORY_LABELS: Record<string, string> = {
  income: "Income",
  expense: "Expense",
  bill: "Bill",
  subscription: "Subscription",
  transfer: "Transfer",
};

function fmt(n: number) {
  const abs = Math.abs(n);
  return "$" + abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function HistoryPage() {
  const router = useRouter();
  const supabase = createClient();
  const [authed, setAuthed] = useState(false);
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [days, setDays] = useState(30);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load(d: number = days) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setAuthed(true);
    const since = new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { data } = await supabase
      .from("transactions")
      .select("id, clean_merchant_name, merchant_name, description, amount, date, category, pending")
      .eq("user_id", user.id)
      .gte("date", since)
      .order("date", { ascending: false })
      .limit(500);
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function refresh() {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await fetch("https://roamiiqvmveykqdlwsav.supabase.co/functions/v1/plaid-transactions-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      await load();
    } finally { setRefreshing(false); }
  }

  if (!authed && loading) return <div className="flex min-h-screen items-center justify-center"><div className="text-gray-500">Loading...</div></div>;

  const filtered = items.filter(t => {
    if (filter !== "all" && t.category !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      const name = (t.clean_merchant_name || t.merchant_name || t.description || "").toLowerCase();
      if (!name.includes(s)) return false;
    }
    return true;
  });

  const totalIncome = filtered.filter(t => t.amount > 0).reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = filtered.filter(t => t.amount < 0).reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">

      <HelpTip
        storageKey="history_explainer"
        title="Reading your transaction history"
        color="#38BDF8"
        body={
          <>
            <p>This shows every transaction pulled from your connected bank account. Merchant names are cleaned up — &ldquo;NFLX*8005714700&rdquo; becomes &ldquo;Netflix&rdquo; — so they&apos;re easier to read at a glance.</p>
            <p className="mt-1">Tap any row to reveal the original bank description, in case you don&apos;t recognize a simplified name.</p>
            <p className="mt-1">Use the <span className="text-white font-medium">7d / 30d / 90d</span> buttons to zoom out and see patterns over time. The income and expense totals at the top update as you filter.</p>
          </>
        }
      />

      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <History className="text-[#3EA758]" size={24} />
          <h1 className="text-2xl font-bold text-white">Transaction History</h1>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="text-gray-500 hover:text-[#3EA758] transition disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="flex gap-1">
          {[7, 30, 90, 365].map(d => (
            <button
              key={d}
              onClick={() => { setDays(d); load(d); }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${days === d ? "bg-[#3EA758] text-white" : "text-gray-400 bg-white/5 hover:bg-white/10"}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-2xl border border-[#3EA758]/20 bg-[#3EA758]/5 p-4">
          <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-[#3EA758]">
            <ArrowUpRight size={12}/> Income
          </div>
          <p className="font-mono text-2xl font-black text-white mt-1">{fmt(totalIncome)}</p>
        </div>
        <div className="rounded-2xl border border-[#FF6B35]/20 bg-[#FF6B35]/5 p-4">
          <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-[#FF6B35]">
            <ArrowDownRight size={12}/> Expenses
          </div>
          <p className="font-mono text-2xl font-black text-white mt-1">{fmt(totalExpense)}</p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search merchant…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/10 text-white text-sm outline-none focus:border-[#3EA758]/50"
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/10 text-white text-sm outline-none"
        >
          <option value="all">All categories</option>
          <option value="income">Income only</option>
          <option value="expense">Expenses</option>
          <option value="bill">Bills</option>
          <option value="subscription">Subscriptions</option>
          <option value="transfer">Transfers</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
          <p className="text-gray-500">No transactions match your filters.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/5">
          {filtered.map(t => {
            const isIncome = t.amount > 0;
            const color = CATEGORY_COLORS[t.category] || "#888";
            const rawName = t.clean_merchant_name || t.merchant_name || t.description || "Unknown";
            const displayName = simplifyName(rawName);
            const isExpanded = expandedId === t.id;
            return (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition"
                onClick={() => setExpandedId(isExpanded ? null : t.id)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <MerchantLogo name={rawName} color={color} size={36} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                    {isExpanded && rawName !== displayName && (
                      <p className="text-xs text-gray-400 truncate">{rawName}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {formatDate(t.date)} · {CATEGORY_LABELS[t.category] || t.category}
                      {t.pending && <span className="ml-1 text-yellow-500">· pending</span>}
                    </p>
                  </div>
                </div>
                <p className={`text-sm font-mono font-bold flex-shrink-0 ${isIncome ? "text-[#3EA758]" : "text-white"}`}>
                  {isIncome ? "+" : "−"}{fmt(t.amount)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
