"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Wallet, RefreshCw, TrendingUp, CheckCircle2 } from "lucide-react";

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
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getThisMonthStart() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export default function BankIncome() {
  const supabase = createClient();
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [months, setMonths] = useState(1);
  const [profileIncome, setProfileIncome] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [hasBank, setHasBank] = useState(false);

  async function load(m: number = months) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("monthly_income, plaid_access_token")
      .eq("id", user.id)
      .single();

    setProfileIncome(profile?.monthly_income || 0);
    setHasBank(!!profile?.plaid_access_token);

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

  async function syncAndReload() {
    if (!userId) return;
    setSyncing(true);
    try {
      await fetch("https://roamiiqvmveykqdlwsav.supabase.co/functions/v1/plaid-transactions-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      await load(months);
    } finally {
      setSyncing(false);
    }
  }

  // Auto-sync on mount if bank connected
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("monthly_income, plaid_access_token")
        .eq("id", user.id)
        .single();

      setProfileIncome(profile?.monthly_income || 0);
      const bankConnected = !!profile?.plaid_access_token;
      setHasBank(bankConnected);

      if (bankConnected) {
        setSyncing(true);
        try {
          await fetch("https://roamiiqvmveykqdlwsav.supabase.co/functions/v1/plaid-transactions-sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.id }),
          });
        } catch {}
        setSyncing(false);
      }

      await load();
    }
    init();
  }, []);

  async function updateProfileIncome(amount: number) {
    if (!userId) return;
    await supabase.from("profiles").update({ monthly_income: Math.round(amount) }).eq("id", userId);
    setProfileIncome(Math.round(amount));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-center text-sm text-gray-500 animate-pulse">
      Detecting your income...
    </div>
  );

  if (!hasBank) return null;

  const total = items.reduce((sum, i) => sum + Number(i.amount), 0);
  const thisMonthItems = items.filter(t => t.date >= getThisMonthStart());
  const thisMonthTotal = thisMonthItems.reduce((sum, i) => sum + Number(i.amount), 0);
  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="mb-6 rounded-2xl border border-brand/20 bg-brand/[0.03] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="text-brand" size={18} />
          <h3 className="text-base font-bold text-white">Bank-Detected Income</h3>
          <button
            onClick={syncAndReload}
            disabled={syncing}
            aria-label="Refresh"
            className="ml-1 text-gray-500 hover:text-brand transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
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
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition ${months === opt.v ? "bg-brand text-black" : "text-gray-400 hover:bg-white/5"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* This month auto-detected highlight */}
      {thisMonthTotal > 0 && (
        <div className="mb-4 rounded-xl border border-brand/30 bg-brand/10 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp size={13} className="text-brand" />
                <p className="text-xs font-bold uppercase tracking-widest text-brand">Auto-detected — {monthLabel}</p>
              </div>
              <p className="text-3xl font-mono font-black text-white">{fmt(thisMonthTotal)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{thisMonthItems.length} deposits this month</p>
            </div>
            <div className="text-right shrink-0">
              {saved ? (
                <div className="flex items-center gap-1 text-xs font-semibold text-brand">
                  <CheckCircle2 size={13} /> Saved to profile
                </div>
              ) : (
                <button
                  onClick={() => updateProfileIncome(thisMonthTotal)}
                  className="rounded-xl bg-brand px-3 py-2 text-xs font-bold text-black hover:opacity-90 transition"
                >
                  Set as my income
                </button>
              )}
              {profileIncome > 0 && !saved && (
                <p className="mt-1 text-[10px] text-gray-600">Profile: {fmt(profileIncome)}/mo</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Range total if viewing more than 1 month */}
      {months > 1 && total > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <p className="text-sm text-gray-400">Last {months} months total</p>
          <div className="text-right">
            <p className="font-mono text-lg font-bold text-white">{fmt(total)}</p>
            <p className="text-xs text-gray-500">avg {fmt(total / months)}/mo</p>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">
          {syncing ? "Syncing your bank..." : "No deposits detected in this range. Try refreshing."}
        </p>
      ) : (
        <div className="space-y-1.5">
          {items.slice(0, 20).map(t => (
            <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.015] px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {t.clean_merchant_name || t.merchant_name || t.description}
                </p>
                <p className="text-xs text-gray-500">{formatDateShort(t.date)}</p>
              </div>
              <p className="text-sm font-mono font-bold text-brand flex-shrink-0">+{fmt(t.amount)}</p>
            </div>
          ))}
          {items.length > 20 && (
            <p className="pt-1 text-center text-xs text-gray-600">+{items.length - 20} more deposits</p>
          )}
        </div>
      )}
    </div>
  );
}
