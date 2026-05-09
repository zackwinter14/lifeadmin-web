"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Repeat, Calendar, AlertCircle, RefreshCw, Plus } from "lucide-react";
import AddItemModal from "@/components/AddItemModal";

interface RecurringItem {
  id: string;
  clean_merchant_name: string | null;
  merchant_name: string;
  category: string;
  frequency: string;
  last_amount: number;
  average_amount: number;
  next_predicted_date: string;
  is_active: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  subscription: "#3EA758",
  bill: "#FFB300",
  loan: "#FF6B35",
  income: "#38BDF8",
};

const CATEGORY_LABELS: Record<string, string> = {
  subscription: "Subscription",
  bill: "Bill",
  loan: "Loan",
  income: "Income",
};

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function UpcomingCharges() {
  const supabase = createClient();
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await fetch("https://roamiiqvmveykqdlwsav.supabase.co/functions/v1/plaid-recurring-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      }).catch(() => {});
      // Reload via the main effect logic
      window.location.reload();
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const today = new Date().toISOString().slice(0, 10);

      // Pull Plaid recurring
      const { data: plaidData } = await supabase
        .from("recurring_transactions")
        .select("id, clean_merchant_name, merchant_name, category, frequency, last_amount, average_amount, next_predicted_date, is_active")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .gte("next_predicted_date", today)
        .limit(50);

      // Pull manual items with due dates
      const { data: manualData } = await supabase
        .from("items")
        .select("id, name, type, amount, due_date, status, source")
        .eq("user_id", user.id)
        .neq("type", "expense")
        .not("due_date", "is", null)
        .gte("due_date", today)
        .or("status.eq.active,status.is.null");

      const plaid = (plaidData || []).map((p: any) => ({
        id: "p_" + p.id,
        clean_merchant_name: p.clean_merchant_name,
        merchant_name: p.merchant_name,
        category: p.category,
        frequency: p.frequency,
        last_amount: p.last_amount,
        average_amount: p.average_amount,
        next_predicted_date: p.next_predicted_date,
        is_active: true,
      }));

      // Don't double-count: skip manual items that came from Plaid (source: plaid:*)
      const manual = (manualData || [])
        .filter((m: any) => !m.source || !m.source.startsWith("plaid:"))
        .map((m: any) => ({
          id: "m_" + m.id,
          clean_merchant_name: m.name,
          merchant_name: m.name,
          category: m.type,
          frequency: "MONTHLY",
          last_amount: m.amount,
          average_amount: m.amount,
          next_predicted_date: m.due_date,
          is_active: true,
        }));

      const all = [...plaid, ...manual].sort((a, b) =>
        a.next_predicted_date.localeCompare(b.next_predicted_date)
      );

      setItems(all);
      setLoading(false);
    })();
  }, [supabase]);

  if (loading) return null;

  const outflow = items.filter(i => i.category !== "income");
  const next7Days = outflow.filter(i => daysUntil(i.next_predicted_date) <= 7);
  const next30Days = outflow.filter(i => daysUntil(i.next_predicted_date) <= 30);
  const next30Total = next30Days.reduce((sum, i) => sum + (i.last_amount || i.average_amount || 0), 0);

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Repeat className="text-[#3EA758]" size={18} />
          <h3 className="text-base font-bold text-white">Upcoming Charges</h3>
          <button
            onClick={refresh}
            disabled={refreshing}
            aria-label="Refresh"
            className="ml-1 text-gray-500 hover:text-[#3EA758] transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="ml-1 flex items-center gap-1 px-2 py-1 rounded-lg bg-[#3EA758]/15 hover:bg-[#3EA758]/25 text-[#3EA758] text-xs font-semibold transition"
          >
            <Plus size={12}/> Add
          </button>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-widest">Next 30 days</p>
          <p className="text-lg font-mono font-bold text-white">{fmt(next30Total)}</p>
        </div>
      </div>

      <AddItemModal open={showAdd} onClose={() => setShowAdd(false)} onAdded={() => window.location.reload()} />

      {items.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-gray-500 mb-2">No upcoming charges yet.</p>
          <p className="text-xs text-gray-600">Connect your bank for auto-detection, or tap <span className="text-[#3EA758]">+ Add</span> to enter one manually.</p>
        </div>
      ) : next7Days.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">No charges in the next 7 days.</p>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">This week</p>
          <div className="space-y-2 mb-4">
            {next7Days.map(item => {
              const color = CATEGORY_COLORS[item.category] || "#888";
              const days = daysUntil(item.next_predicted_date);
              const amount = item.last_amount || item.average_amount;
              const dayLabel =
                days === 0 ? "Today" :
                days === 1 ? "Tomorrow" :
                `In ${days} days`;
              return (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.015] px-3 py-2.5">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + "20" }}>
                      <span className="text-xs font-bold" style={{ color }}>
                        {(item.clean_merchant_name || item.merchant_name).slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {item.clean_merchant_name || item.merchant_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {CATEGORY_LABELS[item.category] || item.category} · {dayLabel}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-mono font-bold text-white">{fmt(amount)}</p>
                    <p className="text-xs text-gray-500">{formatDateShort(item.next_predicted_date)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {next30Days.length > next7Days.length && (
        <details className="mt-2">
          <summary className="text-xs font-semibold text-[#3EA758] cursor-pointer hover:text-[#5cc77a]">
            View {next30Days.length - next7Days.length} more in the next 30 days
          </summary>
          <div className="space-y-2 mt-3">
            {next30Days.slice(next7Days.length).map(item => {
              const color = CATEGORY_COLORS[item.category] || "#888";
              const amount = item.last_amount || item.average_amount;
              return (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.015] px-3 py-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <p className="text-sm text-white truncate">{item.clean_merchant_name || item.merchant_name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-mono text-gray-300">{fmt(amount)}</p>
                    <p className="text-xs text-gray-500">{formatDateShort(item.next_predicted_date)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
