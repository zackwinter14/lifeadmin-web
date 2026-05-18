"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";

interface Txn {
  amount: number;
  date: string;
  category: string;
  clean_merchant_name: string | null;
  merchant_name: string | null;
}

interface Item {
  name: string;
  amount: number;
  type: string;
}

interface CreditCard {
  min_payment: number | null;
}

function fmt(n: number) {
  return "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtK(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : fmt(n);
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

export default function ReportPage() {
  const router = useRouter();
  const supabase = createClient();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [loading, setLoading] = useState(true);
  const [income, setIncome] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = new Date(year, month + 1, 0);
    const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

    const [profileRes, itemsRes, ccRes, txnRes] = await Promise.all([
      supabase.from("profiles").select("monthly_income").eq("id", user.id).maybeSingle(),
      supabase.from("items").select("name, amount, type").eq("user_id", user.id).neq("type", "expense"),
      supabase.from("credit_cards").select("min_payment").eq("user_id", user.id),
      supabase.from("transactions").select("amount, date, category, clean_merchant_name, merchant_name")
        .eq("user_id", user.id).gte("date", start).lte("date", end),
    ]);

    setIncome(profileRes.data?.monthly_income || 0);
    setItems((itemsRes.data || []) as Item[]);
    setCards(ccRes.data || []);
    setTxns((txnRes.data || []) as Txn[]);
    setLoading(false);
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
    if (isCurrentMonth) return;
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const subs = items.filter(i => i.type === "subscription");
  const bills = items.filter(i => i.type === "bill");
  const subsTotal = subs.reduce((a, b) => a + b.amount, 0);
  const billsTotal = bills.reduce((a, b) => a + b.amount, 0);
  const ccMin = cards.reduce((a, c) => a + (c.min_payment || 0), 0);
  const fixedTotal = subsTotal + billsTotal + ccMin;

  const varSpend = txns.reduce((a, t) => a + Math.abs(t.amount), 0);
  const totalOut = fixedTotal + varSpend;
  const saved = income - totalOut;
  const savingsRate = income > 0 ? (saved / income) * 100 : 0;

  const rateColor = savingsRate >= 20 ? "#00C853" : savingsRate >= 10 ? "#FFB300" : savingsRate >= 0 ? "#FF9500" : "#FF3B30";
  const rateLabel = savingsRate >= 20 ? "Excellent" : savingsRate >= 10 ? "Good" : savingsRate >= 0 ? "Tight" : "Over budget";

  // Category breakdown from transactions
  const catMap: Record<string, number> = {};
  txns.forEach(t => {
    const cat = t.category || "Other";
    catMap[cat] = (catMap[cat] || 0) + Math.abs(t.amount);
  });
  const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Top merchants
  const merchantMap: Record<string, number> = {};
  txns.forEach(t => {
    const name = t.clean_merchant_name || t.merchant_name || "Unknown";
    merchantMap[name] = (merchantMap[name] || 0) + Math.abs(t.amount);
  });
  const merchants = Object.entries(merchantMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-gray-500">Loading...</div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Monthly Report</h1>
          <p className="mt-1 text-sm text-gray-400">Your full financial picture, one month at a time.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/10 transition"
        >
          <Download size={14} /> Save / Print
        </button>
      </div>

      {/* Month selector */}
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
        <button onClick={prevMonth} className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white transition">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-lg font-bold text-white">{MONTH_NAMES[month]} {year}</p>
          {isCurrentMonth && <p className="text-xs text-gray-500">Current month — data may be partial</p>}
        </div>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white transition disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Summary hero */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500">{MONTH_NAMES[month]} {year} Summary</p>

        <div className="grid grid-cols-2 gap-4 mb-5 sm:grid-cols-4">
          {[
            { label: "Income", value: fmt(income), color: "#00C853", sub: income === 0 ? "not set" : "/mo" },
            { label: "Fixed Costs", value: fmt(fixedTotal), color: "#FFB300", sub: `${items.length} items` },
            { label: "Variable", value: txns.length > 0 ? fmt(varSpend) : "—", color: "#38BDF8", sub: `${txns.length} txns` },
            { label: "Saved", value: income > 0 ? fmt(Math.abs(saved)) : "—", color: rateColor, sub: saved < 0 ? "over budget" : `${savingsRate.toFixed(0)}% rate` },
          ].map(s => (
            <div key={s.label}>
              <p className="text-xs text-gray-500 mb-0.5">{s.label}</p>
              <p className="font-mono text-xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-600">{s.sub}</p>
            </div>
          ))}
        </div>

        {income > 0 && (
          <>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5 mb-2">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min((totalOut / income) * 100, 100)}%`, background: rateColor }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: rateColor }}>{rateLabel} · {fmt(totalOut)} spent of {fmt(income)}</span>
              <span className="text-gray-500">{fmt(Math.max(saved, 0))} saved</span>
            </div>
          </>
        )}
      </div>

      {/* Fixed costs breakdown */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <p className="mb-4 text-sm font-bold">Fixed Costs <span className="text-gray-500 font-normal text-xs ml-1">recurring every month</span></p>
        <div className="space-y-3">
          {[
            { label: "Subscriptions", amount: subsTotal, color: "#00C853", count: subs.length },
            { label: "Bills", amount: billsTotal, color: "#FFB300", count: bills.length },
            { label: "Credit Card Minimums", amount: ccMin, color: "#38BDF8", count: cards.length },
          ].map(row => (
            <div key={row.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
                  <span className="font-medium text-gray-300">{row.label}</span>
                  <span className="text-xs text-gray-600">{row.count} items</span>
                </div>
                <span className="font-mono font-bold">{fmt(row.amount)}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: fixedTotal > 0 ? `${(row.amount / fixedTotal) * 100}%` : "0%", background: row.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Variable spend by category */}
      {cats.length > 0 && (
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="mb-4 text-sm font-bold">Variable Spending <span className="text-gray-500 font-normal text-xs ml-1">from bank transactions</span></p>
          <div className="space-y-3">
            {cats.map(([cat, amt]) => (
              <div key={cat}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-300">{cat}</span>
                  <span className="font-mono font-bold">{fmt(amt)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-brand-gradient transition-all duration-700"
                    style={{ width: varSpend > 0 ? `${(amt / varSpend) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top merchants */}
      {merchants.length > 0 && (
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="mb-4 text-sm font-bold">Top Merchants</p>
          <div className="space-y-2">
            {merchants.map(([name, amt], i) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-5 text-xs font-mono text-gray-600">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-200">{name}</span>
                    <span className="font-mono font-bold">{fmt(amt)}</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(amt / merchants[0][1]) * 100}%`, background: "var(--brand-hex)" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {txns.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-10 text-center">
          <p className="text-gray-500 text-sm">No bank transactions for this month.</p>
          <p className="text-xs text-gray-600 mt-1">Connect your bank in Dashboard to see variable spending.</p>
        </div>
      )}
    </div>
  );
}
