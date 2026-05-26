"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { ChevronRight, Search, Sparkles, AlertTriangle, Clock, BadgePlus, Repeat } from "lucide-react";

type ItemType = "subscription" | "bill" | "trial" | "expense";

interface Item {
  id: string;
  name: string;
  amount: number;
  type: ItemType;
  category: string | null;
  color: string | null;
  due_date: string | null;
  autopay: boolean | null;
  status: string | null;
  source: string | null;
  created_at?: string | null;
}

interface RecurringTx {
  id: string;
  merchant_name: string | null;
  clean_merchant_name: string | null;
  last_amount: number | null;
  average_amount: number | null;
  next_predicted_date: string | null;
  first_seen_date: string | null;
  frequency: string | null;
  is_active: boolean | null;
}

interface RowInsight {
  rule: "price_jump" | "stale" | "new_recurring";
  detail?: string;
}

const TYPE_LABELS: Record<ItemType, string> = {
  subscription: "Subscription",
  bill: "Bill",
  trial: "Trial",
  expense: "Recurring",
};

const TYPE_COLORS: Record<ItemType, string> = {
  subscription: "#3EA758",
  bill: "#FFB300",
  trial: "#38BDF8",
  expense: "#FF6B35",
};

function fmt(n: number | null | undefined) {
  return "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return d;
  }
}

function initial(name: string) {
  return (name || "?").trim().charAt(0).toUpperCase() || "?";
}

// Estimate how many times an item has recurred since it was first seen.
// Uses real first_seen_date + frequency when available, falls back to created_at + monthly.
function timesRecurred(
  firstSeen: string | null | undefined,
  frequency: string | null | undefined,
  fallbackCreatedAt?: string | null | undefined
): number {
  const start = firstSeen || fallbackCreatedAt;
  if (!start) return 1;
  const startMs = new Date(start).getTime();
  if (!startMs || isNaN(startMs)) return 1;
  const days = (Date.now() - startMs) / 86400000;
  if (days < 0) return 1;
  const f = (frequency || "monthly").toLowerCase();
  let perDay: number;
  if (f.includes("daily") || f === "day") perDay = 1;
  else if (f.includes("biweek") || f.includes("bi-week")) perDay = 1 / 14;
  else if (f.includes("week")) perDay = 1 / 7;
  else if (f.includes("quarter")) perDay = 1 / 91;
  else if (f.includes("year") || f.includes("annual")) perDay = 1 / 365;
  else perDay = 1 / 30; // monthly default
  const n = Math.floor(days * perDay) + 1; // +1 for the first charge
  return Math.max(1, n);
}

// Build per-item insights from items list + recurring_transactions overlay.
function buildInsights(items: Item[], rtx: RecurringTx[]): Record<string, RowInsight> {
  const out: Record<string, RowInsight> = {};
  const now = Date.now();

  // NEW: any item created in the last 14 days
  for (const i of items) {
    if (i.created_at && (now - new Date(i.created_at).getTime()) < 14 * 86400000) {
      out[i.id] = { rule: "new_recurring", detail: "Added recently" };
    }
  }

  // Index recurring_transactions by normalized name
  const rtxByName: Record<string, RecurringTx> = {};
  for (const r of rtx) {
    const k = (r.clean_merchant_name || r.merchant_name || "").toLowerCase().trim();
    if (k) rtxByName[k] = r;
  }

  for (const i of items) {
    const k = (i.name || "").toLowerCase().trim();
    const r = rtxByName[k];
    if (!r) continue;

    // PRICE JUMP: last_amount differs from item.amount by 15%+
    const last = Number(r.last_amount || 0);
    const cur = Number(i.amount || 0);
    if (cur > 0 && last > 0 && Math.abs(last - cur) / cur >= 0.15) {
      out[i.id] = { rule: "price_jump", detail: `${fmt(cur)} → ${fmt(last)}` };
    }

    // STALE: no predicted next charge or last seen > 60 days ago
    if (!out[i.id]) {
      const next = r.next_predicted_date ? new Date(r.next_predicted_date).getTime() : 0;
      if (!next || next < now - 60 * 86400000) {
        out[i.id] = { rule: "stale", detail: "No recent charge" };
      }
    }
  }
  return out;
}

export default function RecurringPage() {
  const router = useRouter();
  const supabase = createClient();
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [rtx, setRtx] = useState<RecurringTx[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ItemType>("all");
  const [sort, setSort] = useState<"amount-desc" | "amount-asc" | "name" | "next">("amount-desc");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setAuthed(true);

      const [{ data: itemsData }, { data: rtxData }] = await Promise.all([
        supabase.from("items").select("*").eq("user_id", user.id),
        supabase.from("recurring_transactions")
          .select("id, merchant_name, clean_merchant_name, last_amount, average_amount, next_predicted_date, first_seen_date, frequency, is_active")
          .eq("user_id", user.id),
      ]);

      setItems((itemsData as Item[]) || []);
      setRtx((rtxData as RecurringTx[]) || []);
      setLoading(false);
    })();
  }, []);

  // Only show recurring-shaped items: subs, bills, trials. (Expenses are one-offs in this app.)
  const recurring = useMemo(
    () => items.filter(i => i.type === "subscription" || i.type === "bill" || i.type === "trial"),
    [items]
  );

  const insights = useMemo(() => buildInsights(recurring, rtx), [recurring, rtx]);

  // Search: name OR price
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qNum = parseFloat(q.replace(/[^0-9.]/g, ""));
    return recurring.filter(i => {
      if (typeFilter !== "all" && i.type !== typeFilter) return false;
      if (!q) return true;
      if ((i.name || "").toLowerCase().includes(q)) return true;
      if (!Number.isNaN(qNum) && Math.abs(Number(i.amount) - qNum) < 0.5) return true;
      return false;
    });
  }, [recurring, query, typeFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      if (sort === "amount-desc") return Number(b.amount) - Number(a.amount);
      if (sort === "amount-asc") return Number(a.amount) - Number(b.amount);
      if (sort === "name") return (a.name || "").localeCompare(b.name || "");
      if (sort === "next") {
        const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return da - db;
      }
      return 0;
    });
    return arr;
  }, [filtered, sort]);

  const totalMonthly = recurring.reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalYearly = totalMonthly * 12;

  function rtxFor(name: string): RecurringTx | undefined {
    const k = (name || "").toLowerCase().trim();
    return rtx.find(r => ((r.clean_merchant_name || r.merchant_name || "").toLowerCase().trim() === k));
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10" style={{ minHeight: "calc(100vh - 73px)" }}>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Recurring</h1>
          <p className="mt-1 text-sm text-gray-400">
            Every charge that comes back — subs, bills, trials. {recurring.length} item{recurring.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Link
          href="/autoai"
          className="hidden items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-300 transition hover:bg-purple-500/20 sm:flex"
        >
          <Sparkles size={13} /> Ask AutoAI
        </Link>
      </div>

      {/* Totals strip */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-green-400">Monthly</p>
          <p className="font-mono text-xl font-black text-white">{fmt(totalMonthly)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-yellow-400">Annual</p>
          <p className="font-mono text-xl font-black text-white">{fmt(totalYearly)}</p>
        </div>
        <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:col-span-1">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-purple-400">Tracked</p>
          <p className="font-mono text-xl font-black text-white">{recurring.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or price…"
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-purple-500/40"
        />
      </div>

      {/* Filter chips + sort */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {([
          { k: "all", l: "All" },
          { k: "subscription", l: "Subs" },
          { k: "bill", l: "Bills" },
          { k: "trial", l: "Trials" },
        ] as const).map(f => (
          <button
            key={f.k}
            onClick={() => setTypeFilter(f.k as any)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              typeFilter === f.k
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : "border border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {f.l}
          </button>
        ))}
        <div className="flex-1" />
        <select
          value={sort}
          onChange={e => setSort(e.target.value as any)}
          className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs font-semibold text-gray-300 outline-none focus:border-purple-500/40"
        >
          <option value="amount-desc">Price ↓</option>
          <option value="amount-asc">Price ↑</option>
          <option value="name">A → Z</option>
          <option value="next">Next due</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 text-center text-sm text-gray-500">Loading recurring charges…</div>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-12 text-center">
          <Repeat size={28} className="mx-auto mb-3 text-gray-500" />
          <p className="text-sm text-gray-400">
            {recurring.length === 0
              ? "No recurring items yet. Add a subscription or bill, or link a bank to auto-detect."
              : "No matches for that search."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(i => {
            const isOpen = expanded === i.id;
            const ins = insights[i.id];
            const r = rtxFor(i.name);
            const color = i.color || TYPE_COLORS[i.type];
            return (
              <div key={i.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                <button
                  onClick={() => setExpanded(isOpen ? null : i.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04]"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black"
                    style={{ background: `${color}22`, border: `1px solid ${color}40`, color }}
                  >
                    {initial(i.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-white">{i.name}</p>
                      <span
                        title="Times charged so far"
                        className="shrink-0 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-[1px] font-mono text-[10px] font-bold text-gray-300"
                      >
                        {timesRecurred(r?.first_seen_date, r?.frequency, i.created_at)}×
                      </span>
                      {ins?.rule === "price_jump" && (
                        <span className="rounded bg-red-500/15 px-1.5 py-[1px] text-[9px] font-bold tracking-wider text-red-400">
                          PRICE UP
                        </span>
                      )}
                      {ins?.rule === "stale" && (
                        <span className="rounded bg-yellow-500/15 px-1.5 py-[1px] text-[9px] font-bold tracking-wider text-yellow-400">
                          STALE
                        </span>
                      )}
                      {ins?.rule === "new_recurring" && (
                        <span className="rounded bg-green-500/15 px-1.5 py-[1px] text-[9px] font-bold tracking-wider text-green-400">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-gray-500">
                      {TYPE_LABELS[i.type]}{i.category ? ` · ${i.category}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-sm font-bold text-white">{fmt(i.amount)}</p>
                  <ChevronRight
                    size={14}
                    className={`shrink-0 text-gray-500 transition-transform ${isOpen ? "rotate-90" : ""}`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-white/5 px-4 py-3">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {[
                        { l: "Current", v: fmt(i.amount), mono: true },
                        { l: "Annual", v: fmt(Number(i.amount) * 12), mono: true },
                        { l: "Times charged", v: `${timesRecurred(r?.first_seen_date, r?.frequency, i.created_at)}×`, mono: true },
                        { l: "Started", v: fmtDate(r?.first_seen_date || i.created_at || null), mono: false },
                        { l: "Next due", v: fmtDate(r?.next_predicted_date || i.due_date || null), mono: false },
                        { l: "Frequency", v: r?.frequency || (i.type === "bill" ? "Monthly" : "Monthly"), mono: false },
                        { l: "Source", v: r ? "Bank-detected" : i.source || "Manual", mono: false },
                      ].map(s => (
                        <div key={s.l} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{s.l}</p>
                          <p className={`mt-0.5 text-sm font-semibold text-white ${s.mono ? "font-mono" : ""}`}>{s.v}</p>
                        </div>
                      ))}
                    </div>

                    {ins?.detail && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                        {ins.rule === "price_jump" ? <AlertTriangle size={13} className="mt-0.5 text-red-400" /> :
                         ins.rule === "stale" ? <Clock size={13} className="mt-0.5 text-yellow-400" /> :
                         <BadgePlus size={13} className="mt-0.5 text-green-400" />}
                        <p className="text-xs text-gray-300">{ins.detail}</p>
                      </div>
                    )}

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <Link
                        href={`/autoai?ask=${encodeURIComponent("Tell me about my " + i.name + " charge and whether I should cancel it.")}`}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-500/15 px-3 py-2 text-xs font-semibold text-purple-300 transition hover:bg-purple-500/25"
                      >
                        <Sparkles size={13} /> Ask AutoAI about {i.name}
                      </Link>
                      <Link
                        href="/cancel"
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-gray-300 transition hover:bg-white/[0.06]"
                      >
                        Cancel guide
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
