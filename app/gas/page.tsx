"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Plus, X, Trash2, Fuel } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

interface Fillup {
  id: string;
  merchant: string;
  amount: number;
  gallons: number;
  pricePer: number;
  date: string;
  note?: string;
}

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function currentMonth() {
  return new Date().toLocaleDateString("en-US", { month: "short" });
}

function lastMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toLocaleDateString("en-US", { month: "short" });
}

function EditRow({ tx, onSave, onDelete, onCancel }: { tx: Fillup; onSave: (u: Partial<Fillup>) => void; onDelete: () => void; onCancel: () => void }) {
  const [merchant, setMerchant] = useState(tx.merchant);
  const [amount, setAmount] = useState(String(tx.amount));
  const [note, setNote] = useState(tx.note || "");

  return (
    <div className="mb-2 overflow-hidden rounded-xl border border-yellow-500/30 bg-white/[0.02]">
      <div className="flex flex-col gap-2 p-4">
        <input value={merchant} onChange={e => setMerchant(e.target.value)} placeholder="Station / merchant"
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-yellow-400" />
        <div>
          <p className="mb-1 text-xs text-gray-500">Amount $</p>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm outline-none focus:border-yellow-400" />
        </div>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)"
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-yellow-400" />
        <div className="flex gap-2">
          <button onClick={() => onSave({ merchant, amount: parseFloat(amount) || tx.amount, note })}
            className="flex-1 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-600 py-2 text-sm font-bold text-black hover:opacity-90">
            Save
          </button>
          <button onClick={onCancel} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-gray-400 hover:bg-white/5">
            Cancel
          </button>
          <button onClick={onDelete} className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GasPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [authed, setAuthed] = useState(false);
  const [income, setIncome] = useState(0);
  const [txns, setTxns] = useState<Fillup[]>([]);
  const [filter, setFilter] = useState<"all" | "thisMonth" | "lastMonth">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ merchant: "", amount: "", gallons: "", pricePer: "", date: "", note: "" });

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      const { data: profile } = await supabase.from("profiles").select("monthly_income").eq("id", user.id).single();
      if (profile?.monthly_income) setIncome(profile.monthly_income);

      // Load from Supabase first, fall back to localStorage cache
      const { data: rows, error } = await supabase
        .from("gas_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && rows) {
        const fillups: Fillup[] = rows.map((r: any) => ({
          id: r.id,
          merchant: r.merchant,
          amount: r.amount,
          gallons: r.gallons ?? 0,
          pricePer: r.price_per ?? 0,
          date: r.date,
          note: r.note ?? undefined,
        }));
        setTxns(fillups);
        try { localStorage.setItem(`gas_txns_${user.id}`, JSON.stringify(fillups)); } catch {}
      } else {
        // Table may not exist yet — fall back to localStorage
        try {
          const stored = localStorage.getItem(`gas_txns_${user.id}`) || localStorage.getItem("gas_txns");
          if (stored) setTxns(JSON.parse(stored));
        } catch {}
      }

      setAuthed(true);
    }
    init();
  }, []);

  function localCache(updated: Fillup[]) {
    if (user) {
      try { localStorage.setItem(`gas_txns_${user.id}`, JSON.stringify(updated)); } catch {}
    }
  }

  async function addFillup() {
    if (!form.merchant || !form.amount || saving) return;
    setSaving(true);
    const amt = parseFloat(form.amount) || 0;
    const gal = parseFloat(form.gallons) || 0;
    const ppg = gal > 0 ? amt / gal : parseFloat(form.pricePer) || 0;
    const dateStr = form.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

    // Try to save to Supabase
    const { data: inserted, error } = await supabase.from("gas_logs").insert({
      user_id: user.id,
      merchant: form.merchant,
      amount: amt,
      gallons: gal || parseFloat((amt / (ppg || 4.20)).toFixed(1)),
      price_per: parseFloat(ppg.toFixed(2)),
      date: dateStr,
      note: form.note || null,
    }).select().single();

    let newTx: Fillup;
    if (!error && inserted) {
      newTx = {
        id: inserted.id,
        merchant: inserted.merchant,
        amount: inserted.amount,
        gallons: inserted.gallons ?? 0,
        pricePer: inserted.price_per ?? 0,
        date: inserted.date,
        note: inserted.note ?? undefined,
      };
    } else {
      // Supabase failed (table may not exist) — use local ID
      newTx = {
        id: `g${Date.now()}`,
        merchant: form.merchant,
        amount: amt,
        gallons: gal || parseFloat((amt / (ppg || 4.20)).toFixed(1)),
        pricePer: parseFloat(ppg.toFixed(2)),
        date: dateStr,
        note: form.note || undefined,
      };
    }

    const updated = [newTx, ...txns];
    setTxns(updated);
    localCache(updated);
    setForm({ merchant: "", amount: "", gallons: "", pricePer: "", date: "", note: "" });
    setShowAdd(false);
    setSaving(false);
  }

  async function updateTx(id: string, updates: Partial<Fillup>) {
    // Optimistic update
    const updated = txns.map(x => x.id === id ? { ...x, ...updates } : x);
    setTxns(updated);
    localCache(updated);
    setEditingId(null);

    // Persist to Supabase
    await supabase.from("gas_logs").update({
      merchant: updates.merchant,
      amount: updates.amount,
      note: updates.note ?? null,
    }).eq("id", id).eq("user_id", user.id);
  }

  async function deleteTx(id: string) {
    const updated = txns.filter(x => x.id !== id);
    setTxns(updated);
    localCache(updated);
    setEditingId(null);
    await supabase.from("gas_logs").delete().eq("id", id).eq("user_id", user.id);
  }

  if (!authed) return <div className="flex min-h-screen items-center justify-center"><div className="text-gray-500">Loading...</div></div>;

  const thisM = currentMonth();
  const lastM = lastMonth();
  const thisTxns = txns.filter(tx => tx.date.includes(thisM));
  const lastTxns = txns.filter(tx => tx.date.includes(lastM));
  const display = filter === "thisMonth" ? thisTxns : filter === "lastMonth" ? lastTxns : txns;

  const thisTotal = thisTxns.reduce((a, b) => a + b.amount, 0);
  const lastTotal = lastTxns.reduce((a, b) => a + b.amount, 0);
  const diff = thisTotal - lastTotal;
  const totalSpent = display.reduce((a, b) => a + b.amount, 0);
  const totalGal = display.reduce((a, b) => a + b.gallons, 0);
  const avgPpg = totalGal > 0 ? totalSpent / totalGal : 0;
  const gasPct = income > 0 ? (thisTotal / income) * 100 : 0;

  const stationTotals: Record<string, number> = {};
  display.forEach(tx => { stationTotals[tx.merchant] = (stationTotals[tx.merchant] || 0) + tx.amount; });
  const stations = Object.entries(stationTotals).sort((a, b) => b[1] - a[1]);
  const stationTotal = Object.values(stationTotals).reduce((a, b) => a + b, 0);

  const inputCls = "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-yellow-400";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gas Tracker</h1>
          <p className="mt-1 text-sm text-gray-400">Manually logged fill-ups.</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 px-4 py-2.5 text-sm font-bold text-black hover:opacity-90">
          <Plus size={15} /> Add Fill-up
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="col-span-2 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 md:col-span-1">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">This Month</p>
          <p className="font-mono text-2xl font-black text-yellow-400">{fmt(thisTotal)}</p>
          {lastTotal > 0 && (
            <p className="mt-1 text-xs font-semibold" style={{ color: diff > 0 ? "#FF3B30" : "#34C759" }}>
              {diff > 0 ? "+" : ""}{fmt(diff)} vs last month
            </p>
          )}
        </div>
        {[
          { label: "Avg / gallon", value: avgPpg > 0 ? `$${avgPpg.toFixed(2)}` : "—" },
          { label: "% of income", value: income > 0 ? `${gasPct.toFixed(1)}%` : "—", color: gasPct > 5 ? "#FF9500" : "#34C759" },
          { label: "Total gallons", value: totalGal > 0 ? `${totalGal.toFixed(1)} gal` : "—" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="mb-1 text-xs text-gray-500">{s.label}</p>
            <p className="font-mono text-lg font-bold" style={{ color: (s as any).color || "white" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ─────────────────────────────────────────────────── */}
      {txns.length >= 2 && (() => {
        const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const now2 = new Date();
        const monthlyChartData = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now2.getFullYear(), now2.getMonth() - 5 + i, 1);
          const m = MONTH_ABBR[d.getMonth()];
          const spent = txns.filter(t => t.date.includes(m)).reduce((s, t) => s + t.amount, 0);
          return { month: m, spent: parseFloat(spent.toFixed(2)) };
        });
        const hasMonthlyData = monthlyChartData.some(d => d.spent > 0);

        const ppgData = [...txns].filter(t => t.pricePer > 0).reverse().slice(-12)
          .map(t => ({ name: t.date, ppg: parseFloat(t.pricePer.toFixed(2)) }));

        const STATION_COLORS = ["#F5C518","#E8A010","#FFD700","#D4891A","#C47A00","#FFC300"];
        const stationPieData = stations.slice(0, 6).map(([name, amt], i) => ({
          name: name.length > 14 ? name.slice(0, 14) + "…" : name,
          value: parseFloat(amt.toFixed(2)),
          color: STATION_COLORS[i] || "#F5C518",
        }));

        return (
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            {/* Monthly spending area chart */}
            {hasMonthlyData && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">Monthly Spending</p>
                <p className="mb-4 font-mono text-2xl font-black text-yellow-400">{fmt(thisTotal)}<span className="text-sm font-normal text-gray-500"> this month</span></p>
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={monthlyChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gasGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F5C518" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#F5C518" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                    <Tooltip
                      formatter={(v: any) => [fmt(v), "Spent"]}
                      contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                      cursor={{ stroke: "rgba(245,197,24,0.2)", strokeWidth: 1 }}
                    />
                    <Area type="monotone" dataKey="spent" stroke="#F5C518" strokeWidth={2} fill="url(#gasGrad)" dot={{ fill: "#F5C518", r: 3 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Station breakdown donut */}
            {stationPieData.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">By Station</p>
                <p className="mb-4 font-mono text-2xl font-black text-white">{stations.length}<span className="text-sm font-normal text-gray-500"> stations logged</span></p>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={120} height={120}>
                    <PieChart>
                      <Pie data={stationPieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={3} dataKey="value">
                        {stationPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => [fmt(v), ""]} contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5">
                    {stationPieData.map((s, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
                          <span className="text-xs text-gray-400 truncate max-w-[90px]">{s.name}</span>
                        </div>
                        <span className="text-xs font-bold text-yellow-400">{fmt(s.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Price per gallon trend */}
            {ppgData.length >= 2 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:col-span-2">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">Price Per Gallon — Last {ppgData.length} Fill-ups</p>
                <p className="mb-4 font-mono text-2xl font-black text-white">
                  ${ppgData[ppgData.length - 1]?.ppg.toFixed(2)}<span className="text-sm font-normal text-gray-500"> most recent</span>
                </p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={ppgData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} domain={["auto", "auto"]} />
                    <Tooltip
                      formatter={(v: any) => [`$${Number(v).toFixed(2)}/gal`, "Price"]}
                      contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="ppg" fill="#F5C518" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );
      })()}
      {/* ── End Charts ─────────────────────────────────────────────── */}

      <div className="mb-5 flex gap-2">
        {([["all", "All time"], ["thisMonth", thisM], ["lastMonth", lastM]] as const).map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className="rounded-full px-4 py-1.5 text-sm font-semibold transition"
            style={{ background: filter === v ? "#F5C518" : "rgba(255,255,255,0.05)", color: filter === v ? "#0a0a0f" : "#8E8E93" }}>
            {l}
          </button>
        ))}
      </div>

      {txns.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center">
          <Fuel size={36} className="mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400">No fill-ups logged yet.</p>
          <button onClick={() => setShowAdd(true)} className="mt-4 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 px-6 py-2.5 text-sm font-bold text-black hover:opacity-90">
            Log your first fill-up
          </button>
        </div>
      ) : (
        <>
          {stations.length > 0 && (
            <div className="mb-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Stations</p>
              <div className="space-y-2">
                {stations.map(([name, amt]) => (
                  <div key={name} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-yellow-500/20 bg-yellow-500/10">
                      <Fuel size={16} className="text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{name}</p>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600" style={{ width: `${(amt / stationTotal) * 100}%` }} />
                      </div>
                    </div>
                    <span className="font-mono text-sm font-bold text-yellow-400">{fmt(amt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Fill-ups</p>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 rounded-lg bg-yellow-500/10 px-3 py-1.5 text-xs font-bold text-yellow-400 hover:bg-yellow-500/20">
              <Plus size={12} /> Add
            </button>
          </div>
          <div>
            {display.map(tx =>
              editingId === tx.id ? (
                <EditRow key={tx.id} tx={tx} onSave={u => updateTx(tx.id, u)} onDelete={() => deleteTx(tx.id)} onCancel={() => setEditingId(null)} />
              ) : (
                <div key={tx.id} className="mb-2 flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 hover:bg-white/5"
                  onClick={() => setEditingId(tx.id)}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-yellow-500/20 bg-yellow-500/10">
                    <Fuel size={18} className="text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      {tx.merchant}
                      {tx.note && <span className="ml-1 text-xs font-normal text-gray-500">· {tx.note}</span>}
                    </p>
                    <p className="text-xs text-gray-500">{tx.date} · {tx.gallons} gal · ${tx.pricePer}/gal</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-yellow-400">{fmt(tx.amount)}</p>
                    <p className="text-xs text-gray-600">tap to edit</p>
                  </div>
                </div>
              )
            )}
          </div>

          {display.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No fill-ups for this period.</p>}

          {totalSpent > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-yellow-500/15 bg-yellow-500/5 px-4 py-3">
              <Fuel size={14} className="shrink-0 text-yellow-400" />
              <p className="text-sm text-gray-400">
                Spent <strong className="text-white">{fmt(thisTotal)}</strong> this month on gas.
                {avgPpg > 0 && <> Avg <strong className="text-white">${avgPpg.toFixed(2)}/gal</strong>.</>}
              </p>
            </div>
          )}
        </>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Add Fill-up</h2>
                <p className="text-xs text-gray-500">Log a gas purchase manually</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Station / Merchant *</label>
                <input autoFocus value={form.merchant} onChange={e => setForm(f => ({ ...f, merchant: e.target.value }))} placeholder="e.g. Shell, Chevron, Costco" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Total $ *</label>
                  <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Gallons</label>
                  <input type="number" value={form.gallons} onChange={e => setForm(f => ({ ...f, gallons: e.target.value }))} placeholder="0.0" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Price / Gal</label>
                  <input type="number" value={form.pricePer} onChange={e => setForm(f => ({ ...f, pricePer: e.target.value }))} placeholder="4.19" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Date</label>
                  <input value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} placeholder="May 18" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Note (optional)</label>
                <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="e.g. paid cash, highway trip" className={inputCls} />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 rounded-xl border border-white/10 py-3 text-sm hover:bg-white/5">Cancel</button>
              <button onClick={addFillup} disabled={!form.merchant || !form.amount || saving}
                className="flex-1 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 py-3 text-sm font-bold text-black hover:opacity-90 disabled:opacity-40">
                {saving ? "Saving..." : "Add Fill-up"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
