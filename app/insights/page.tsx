"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { BarChart2, TrendingUp, TrendingDown, Minus, CalendarDays } from "lucide-react";
import { simplifyName } from "@/lib/merchantUtils";
import MerchantLogo from "@/components/MerchantLogo";

interface Transaction {
  amount: number;
  date: string;
  category: string;
  clean_merchant_name: string | null;
  merchant_name: string | null;
  description: string | null;
}

interface AnnualItem {
  id: string;
  merchant_name: string;
  clean_merchant_name: string | null;
  last_amount: number;
  next_predicted_date: string;
  frequency: string;
}

function fmt(n: number) {
  return "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function monthLabel(monthStr: string) {
  const [year, month] = monthStr.split("-").map(Number);
  return new Date(year, month - 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CATEGORY_COLORS: Record<string, string> = {
  income: "#3EA758",
  expense: "#FF6B35",
  bill: "#FFB300",
  subscription: "#AF52DE",
  transfer: "#38BDF8",
  food: "#FF9500",
};

function delta(curr: number, prev: number) {
  if (prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

export default function InsightsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [annualItems, setAnnualItems] = useState<AnnualItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Last 90 days of transactions for MoM + merchant breakdown
      const since = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
      const { data: txns } = await supabase
        .from("transactions")
        .select("amount, date, category, clean_merchant_name, merchant_name, description")
        .eq("user_id", user.id)
        .gte("date", since)
        .order("date", { ascending: false });
      setTransactions(txns || []);

      // Annual recurring charges
      const { data: annual } = await supabase
        .from("recurring_transactions")
        .select("id, merchant_name, clean_merchant_name, last_amount, average_amount, next_predicted_date, frequency")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .ilike("frequency", "%annual%");
      setAnnualItems(annual || []);

      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center text-gray-500">Loading...</div>
  );

  // ── Month-over-month ─────────────────────────────────────────────────────────
  const now = new Date();
  const currMonthStr = now.toISOString().slice(0, 7);
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = prevDate.toISOString().slice(0, 7);

  const outflow = transactions.filter(t => t.amount < 0);
  const currTxns = outflow.filter(t => t.date.startsWith(currMonthStr));
  const prevTxns = outflow.filter(t => t.date.startsWith(prevMonthStr));

  const currTotal = currTxns.reduce((a, t) => a + Math.abs(t.amount), 0);
  const prevTotal = prevTxns.reduce((a, t) => a + Math.abs(t.amount), 0);
  const totalDelta = delta(currTotal, prevTotal);

  // By category
  const categories = Array.from(new Set(outflow.map(t => t.category))).filter(Boolean);
  const catStats = categories.map(cat => {
    const c = currTxns.filter(t => t.category === cat).reduce((a, t) => a + Math.abs(t.amount), 0);
    const p = prevTxns.filter(t => t.category === cat).reduce((a, t) => a + Math.abs(t.amount), 0);
    return { cat, curr: c, prev: p, d: delta(c, p) };
  }).filter(s => s.curr > 0 || s.prev > 0).sort((a, b) => b.curr - a.curr);

  // ── Top merchants ────────────────────────────────────────────────────────────
  const merchantMap: Record<string, number> = {};
  const merchantRaw: Record<string, string> = {};
  outflow.forEach(t => {
    const raw = t.clean_merchant_name || t.merchant_name || t.description || "";
    const name = simplifyName(raw);
    if (!name || name === "Unknown") return;
    merchantMap[name] = (merchantMap[name] || 0) + Math.abs(t.amount);
    merchantRaw[name] = raw;
  });
  const topMerchants = Object.entries(merchantMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const maxMerchant = topMerchants[0]?.[1] || 1;

  // ── Annual radar ─────────────────────────────────────────────────────────────
  // Group annual charges by month of next_predicted_date
  const byMonth: Record<number, AnnualItem[]> = {};
  for (let i = 0; i < 12; i++) byMonth[i] = [];
  annualItems.forEach(item => {
    if (!item.next_predicted_date) return;
    const month = new Date(item.next_predicted_date).getMonth();
    byMonth[month].push(item);
  });
  const annualTotal = annualItems.reduce((a, i) => a + Math.abs(i.last_amount || 0), 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      <div className="mb-8 flex items-center gap-3">
        <BarChart2 size={24} className="text-brand" />
        <div>
          <h1 className="text-3xl font-bold">Insights</h1>
          <p className="mt-0.5 text-sm text-gray-400">Spending trends, top merchants, and annual charge calendar.</p>
        </div>
      </div>

      {/* ── Month over Month ─────────────────────────────────────────────────── */}
      <section className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Month Over Month</p>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 mb-4">
          <div className="flex items-end justify-between mb-1">
            <div>
              <p className="text-xs text-gray-500 mb-1">{monthLabel(currMonthStr)} spending</p>
              <p className="text-3xl font-black font-mono text-white">{fmt(currTotal)}</p>
            </div>
            {totalDelta !== null && (
              <div className={`flex items-center gap-1 text-sm font-bold ${totalDelta > 0 ? "text-red-400" : "text-green-400"}`}>
                {totalDelta > 0 ? <TrendingUp size={16} /> : totalDelta < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
                {totalDelta > 0 ? "+" : ""}{totalDelta.toFixed(0)}% vs {monthLabel(prevMonthStr)}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-600">{monthLabel(prevMonthStr)}: {fmt(prevTotal)}</p>
        </div>

        {catStats.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/5 overflow-hidden">
            {catStats.map(({ cat, curr, prev, d }) => (
              <div key={cat} className="flex items-center justify-between px-5 py-3 gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: CATEGORY_COLORS[cat] || "#888" }}
                  />
                  <span className="text-sm text-white capitalize truncate">{cat}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-gray-500 font-mono">{fmt(prev)}</span>
                  <span className="text-sm font-bold font-mono text-white">{fmt(curr)}</span>
                  {d !== null && (
                    <span className={`text-xs font-semibold w-14 text-right ${d > 0 ? "text-red-400" : d < 0 ? "text-green-400" : "text-gray-500"}`}>
                      {d > 0 ? "+" : ""}{d.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {catStats.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="text-sm text-gray-500">Connect your bank to see month-over-month trends.</p>
          </div>
        )}
      </section>

      {/* ── Top Merchants ─────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
          Top Merchants  -  last 90 days
        </p>
        {topMerchants.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="text-sm text-gray-500">No transaction data yet. Connect your bank to see top merchants.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden divide-y divide-white/5">
            {topMerchants.map(([name, total], i) => {
              const barPct = Math.round((total / maxMerchant) * 100);
              return (
                <div key={name} className="px-4 py-3">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-xs text-gray-600 w-5 shrink-0 text-right">{i + 1}</span>
                    <MerchantLogo name={merchantRaw[name] || name} color="#3EA758" size={28} />
                    <span className="text-sm font-semibold text-white flex-1 min-w-0 truncate">{name}</span>
                    <span className="text-sm font-mono font-bold text-white shrink-0">{fmt(total)}</span>
                  </div>
                  <div className="ml-8 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand/50 transition-all"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Annual Subscription Radar ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
            <CalendarDays size={13} />
            Annual Subscription Radar
          </p>
          {annualTotal > 0 && (
            <p className="text-xs text-gray-500 font-mono">{fmt(annualTotal)}/yr total</p>
          )}
        </div>

        {annualItems.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="text-sm text-gray-500">No annual subscriptions detected yet.</p>
            <p className="text-xs text-gray-600 mt-1">Annual charges appear here once Plaid identifies them as recurring.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            {MONTHS.map((month, i) => {
              const charges = byMonth[i];
              const monthTotal = charges.reduce((a, c) => a + Math.abs(c.last_amount || 0), 0);
              const isCurrentMonth = i === now.getMonth();
              return (
                <div
                  key={month}
                  className={`flex items-start gap-4 px-5 py-3 border-b border-white/5 last:border-0 ${isCurrentMonth ? "bg-brand/[0.04]" : ""}`}
                >
                  <div className="w-8 shrink-0 pt-0.5">
                    <span className={`text-xs font-bold ${isCurrentMonth ? "text-brand" : "text-gray-500"}`}>
                      {month}
                    </span>
                  </div>
                  {charges.length === 0 ? (
                    <p className="text-xs text-gray-700 py-0.5"> - </p>
                  ) : (
                    <div className="flex-1 space-y-1.5">
                      {charges.map(c => (
                        <div key={c.id} className="flex items-center gap-2">
                          <MerchantLogo
                            name={c.clean_merchant_name || c.merchant_name}
                            color="#3EA758"
                            size={22}
                          />
                          <span className="text-xs font-semibold text-white">
                            {simplifyName(c.clean_merchant_name || c.merchant_name)}
                          </span>
                          <span className="text-xs text-gray-500 font-mono ml-auto">
                            {fmt(Math.abs(c.last_amount || 0))}
                          </span>
                        </div>
                      ))}
                      {charges.length > 1 && (
                        <p className="text-[10px] text-gray-600 font-mono">{fmt(monthTotal)} due this month</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
