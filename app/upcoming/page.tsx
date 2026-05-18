"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { AlertTriangle, Bell, Copy, Check, Calendar, ChevronRight } from "lucide-react";
import MerchantLogo from "@/components/MerchantLogo";

interface Item {
  id: string;
  name: string;
  amount: number;
  type: "subscription" | "bill" | "trial" | "expense";
  category: string;
  color: string;
  due_date: string | null;
  autopay: boolean;
  status: string;
  trial_days: number | null;
}

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseDueDate(due: string | null): number | null {
  if (!due) return null;
  const now = new Date();
  // Try "Apr 30" style
  const months: Record<string, number> = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
  const m = due.match(/^([A-Za-z]+)\s+(\d+)$/);
  if (m) {
    const mo = months[m[1]];
    if (mo !== undefined) {
      const d = new Date(now.getFullYear(), mo, parseInt(m[2]));
      if (d < now) d.setFullYear(d.getFullYear() + 1);
      return Math.ceil((d.getTime() - now.getTime()) / 86400000);
    }
  }
  // Try numeric "2025-04-30"
  const d2 = new Date(due);
  if (!isNaN(d2.getTime())) return Math.ceil((d2.getTime() - now.getTime()) / 86400000);
  return null;
}

function daysLabel(days: number | null): string {
  if (days === null) return "";
  if (days < 0) return "Overdue";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

function daysColor(days: number | null): string {
  if (days === null) return "#8E8E93";
  if (days < 0) return "#FF3B30";
  if (days <= 3) return "#FF3B30";
  if (days <= 7) return "#FF9500";
  return "#34C759";
}

function ItemRow({ item }: { item: Item & { daysUntil: number | null } }) {
  const color = item.color || "#3EA758";
  const days = item.daysUntil;
  const dc = daysColor(days);

  return (
    <div className="flex items-center justify-between border-b border-white/5 px-5 py-4 last:border-0 hover:bg-white/[0.02]">
      <div className="flex items-center gap-3">
        <MerchantLogo name={item.name} color={color} size={40} />
        <div>
          <p className="font-semibold text-sm">{item.name}</p>
          <p className="text-xs text-gray-500">
            <span className="capitalize" style={{ color }}>{item.type}</span>
            {item.category ? ` · ${item.category}` : ""}
            {item.autopay ? " · Autopay" : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-bold text-sm">{fmt(item.amount)}</p>
          {item.due_date && (
            <p className="text-xs font-semibold" style={{ color: dc }}>
              {item.due_date} · {daysLabel(days)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UpcomingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .neq("type", "expense")
        .order("created_at", { ascending: true });
      if (data) setItems(data as Item[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="text-gray-500">Loading...</div></div>;

  // Enrich with days until
  const enriched = items.map(i => ({ ...i, daysUntil: parseDueDate(i.due_date) }));

  // Groups
  const urgent = enriched.filter(i => i.status === "urgent" || (i.daysUntil !== null && i.daysUntil <= 3));
  const trials = enriched.filter(i => i.type === "trial");
  const duplicates = enriched.filter(i => i.status === "duplicate");

  // All upcoming sorted by due date
  const withDates = enriched
    .filter(i => i.daysUntil !== null)
    .sort((a, b) => (a.daysUntil ?? 999) - (b.daysUntil ?? 999));

  const noDates = enriched.filter(i => i.daysUntil === null && i.type !== "expense");

  const totalUrgent = urgent.reduce((a, b) => a + b.amount, 0);
  const totalTrials = trials.reduce((a, b) => a + b.amount, 0);

  const alertCount = urgent.length + trials.length + duplicates.length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Upcoming</h1>
        <p className="mt-1 text-sm text-gray-400">Bills &amp; subscriptions that need your attention.</p>
      </div>

      {/* Summary chips */}
      {alertCount > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { label: "Due Soon", count: urgent.length, total: totalUrgent, color: "#FF3B30" },
            { label: "Trials Ending", count: trials.length, total: totalTrials, color: "#FF9500" },
            { label: "Duplicates", count: duplicates.length, total: 0, color: "#FF6B35" },
          ].filter(s => s.count > 0).map(s => (
            <div key={s.label} className="rounded-2xl border p-4 text-center" style={{ borderColor: s.color + "30", background: s.color + "10" }}>
              <p className="font-mono text-2xl font-black" style={{ color: s.color }}>{s.count}</p>
              <p className="mt-0.5 text-xs font-semibold" style={{ color: s.color + "cc" }}>{s.label}</p>
              {s.total > 0 && <p className="mt-0.5 font-mono text-xs" style={{ color: s.color + "99" }}>{fmt(s.total)}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Urgent section */}
      {urgent.length > 0 && (
        <div className="mb-5">
          <div className="mb-3 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-bold text-red-400">Due Soon</p>
              <p className="text-xs text-gray-400">These bills are due very soon and need immediate action.</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            {urgent.map(item => <ItemRow key={item.id} item={item} />)}
          </div>
        </div>
      )}

      {/* Trials ending */}
      {trials.length > 0 && (
        <div className="mb-5">
          <div className="mb-3 flex items-start gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3">
            <Bell size={18} className="mt-0.5 shrink-0 text-orange-400" />
            <div>
              <p className="text-sm font-bold text-orange-400">Trials Ending</p>
              <p className="text-xs text-gray-400">Free trials that will auto-charge when they expire. Cancel if you don&apos;t want them.</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            {trials.map(item => <ItemRow key={item.id} item={item} />)}
          </div>
          <p className="mt-2 px-1 text-xs text-orange-400">
            Cancel before trials end to avoid <strong>{fmt(totalTrials)}/mo</strong>.
          </p>
        </div>
      )}

      {/* Duplicates */}
      {duplicates.length > 0 && (
        <div className="mb-5">
          <div className="mb-3 flex items-start gap-3 rounded-xl border border-orange-400/20 bg-orange-400/5 px-4 py-3">
            <Copy size={18} className="mt-0.5 shrink-0 text-orange-400" />
            <div>
              <p className="text-sm font-bold text-orange-400">Possible Duplicates</p>
              <p className="text-xs text-gray-400">We detected possible duplicate charges for the same service. Review and remove one.</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            {duplicates.map(item => <ItemRow key={item.id} item={item} />)}
          </div>
        </div>
      )}

      {/* All upcoming by date */}
      {withDates.length > 0 && (
        <div className="mb-5">
          <div className="mb-3 flex items-center gap-2">
            <Calendar size={15} className="text-brand" />
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">All Upcoming (by due date)</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            {withDates.map(item => <ItemRow key={item.id} item={item} />)}
          </div>
        </div>
      )}

      {/* No due date */}
      {noDates.length > 0 && (
        <div className="mb-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">No Due Date Set</p>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            {noDates.map(item => <ItemRow key={item.id} item={item} />)}
          </div>
        </div>
      )}

      {/* All clear */}
      {items.length === 0 && (
        <div className="py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-brand bg-brand/10">
            <Check size={28} className="text-brand" />
          </div>
          <h2 className="mb-2 text-xl font-bold">All clear!</h2>
          <p className="text-gray-400">No items need attention right now.</p>
          <button onClick={() => router.push("/dashboard")} className="mt-6 rounded-xl border border-white/10 px-6 py-2.5 text-sm hover:bg-white/5">
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
