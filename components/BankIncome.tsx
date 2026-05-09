"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Wallet, RefreshCw, TrendingUp } from "lucide-react";

interface Transaction {
  id: string;
  clean_merchant_name: string | null;
  merchant_name: string | null;
  description: string | null;
  amount: number;
  date: string;
  category: string;
}

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function BankIncome() {
  const supabase = createClient();
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [months, setMonths] = useState(1);

  async function load(m: number = months) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const start = new Date();
    start.setMonth(start.getMonth() - (m - 1));
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const since = start.toISOString().slice(0, 10);
    const { data } = await supabase
      .from("transactions")
      .select("id, clean_merchant_name, merchant_name, description, amount, date, category")
      .eq("user_id", user.id)
      .gt("amount", 0)
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

  if (loading) return null;

  const total = items.reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="text-[#3EA758]" size={18} />
          <h3 className="text-base font-bold text-white">Bank Income</h3>
          <button
            onClick={refresh}
            disabled={refreshing}
            aria-label="Refresh"
            className="ml-1 text-gray-500 hover:text-[#3EA758] transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="flex gap-1">
          {[
            { v: 1, label: "This mo" },
            { v: 3, label: "3 mo" },
            { v: 6, label: "6 mo" },
            { v: 12, label: "12 mo" },
          ].map(opt => (
            <button
              key={opt.v}
              onClick={() => { setMonths(opt.v); load(opt.v); }}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition ${months === opt.v ? "bg-[#3EA758] text-white" : "text-gray-400 hover:bg-white/5"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-[#3EA758]/20 bg-[#3EA758]/5 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-[#3EA758]" size={16} />
            <p className="text-xs font-semibold uppercase tracking-widest text-[#3EA758]">
              {months === 1 ? "This month" : `Last ${months} months`}
            </p>
          </div>
          {months > 1 && (
            <p className="text-xs text-gray-500">avg <span className="font-bold text-white">{fmt(total / months)}</span>/mo</p>
          )}
        </div>
        <p className="text-3xl font-mono font-black text-white mt-1">{fmt(total)}</p>
        <p className="text-xs text-gray-500 mt-1">{items.length} deposits</p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">No deposits in this range.</p>
      ) : (
        <div className="space-y-2">
          {items.map(t => (
            <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.015] px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {t.clean_merchant_name || t.merchant_name || t.description}
                </p>
                <p className="text-xs text-gray-500">{formatDateShort(t.date)}</p>
              </div>
              <p className="text-sm font-mono font-bold text-[#3EA758] flex-shrink-0">+{fmt(t.amount)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
