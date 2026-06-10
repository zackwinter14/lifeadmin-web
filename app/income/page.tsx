"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Plus, X, Trash2, Wallet, TrendingUp, ArrowUpRight, BarChart3 } from "lucide-react";
import BankIncome from "@/components/BankIncome";

interface IncomeEntry {
  id: string;
  source: string;
  amount: number;
  frequency: "monthly" | "biweekly" | "weekly" | "one-time";
  date: string;
  note?: string;
  category?: "primary" | "side";
}

interface SideLog {
  id: string;
  month: string; // "YYYY-MM"
  amount: number;
  note: string;
}

const FREQ_LABELS: Record<string, string> = {
  monthly: "Monthly",
  biweekly: "Bi-weekly",
  weekly: "Weekly",
  "one-time": "One-time",
};

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toMonthly(amount: number, freq: string) {
  if (freq === "biweekly") return amount * 26 / 12;
  if (freq === "weekly") return amount * 52 / 12;
  if (freq === "one-time") return 0;
  return amount;
}

export default function IncomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [authed, setAuthed] = useState(false);
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "recurring" | "one-time">("all");
  const [form, setForm] = useState({
    source: "", amount: "", frequency: "monthly" as IncomeEntry["frequency"], date: "", note: "", category: "primary" as "primary" | "side",
  });
  const [sideLog, setSideLog] = useState<SideLog[]>([]);
  const [showSideAdd, setShowSideAdd] = useState(false);
  const [sideForm, setSideForm] = useState({ month: new Date().toISOString().slice(0, 7), amount: "", note: "" });

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      // Load from Supabase first, fallback to localStorage
      const { data: dbEntries } = await supabase
        .from("income_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (dbEntries && dbEntries.length > 0) {
        setEntries(dbEntries);
        // Sync total to profile in case budget page reads from there
        const total = dbEntries
          .filter((e: IncomeEntry) => e.frequency !== "one-time")
          .reduce((sum: number, e: IncomeEntry) => sum + toMonthly(e.amount, e.frequency), 0);
        if (total > 0) {
          supabase.from("profiles").update({ monthly_income: Math.round(total) }).eq("id", user.id);
        }
      } else {
        try {
          const stored = localStorage.getItem("income_entries");
          if (stored) {
            const parsed = JSON.parse(stored);
            setEntries(parsed);
            // Migrate localStorage to Supabase
            if (parsed.length > 0) {
              await supabase.from("income_entries").upsert(
                parsed.map((e: IncomeEntry) => ({ ...e, user_id: user.id }))
              );
            }
          }
        } catch {}
      }

      const { data: dbSide } = await supabase
        .from("side_income_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("month", { ascending: false });

      if (dbSide && dbSide.length > 0) {
        setSideLog(dbSide);
      } else {
        try {
          const sl = localStorage.getItem("side_income_log_v1");
          if (sl) {
            const parsed = JSON.parse(sl);
            setSideLog(parsed);
            if (parsed.length > 0) {
              await supabase.from("side_income_logs").upsert(
                parsed.map((e: SideLog) => ({ ...e, user_id: user.id }))
              );
            }
          }
        } catch {}
      }

      setAuthed(true);
    }
    init();
  }, []);

  async function syncIncomeToProfile(updated: IncomeEntry[]) {
    if (!user) return;
    const total = updated
      .filter(e => e.frequency !== "one-time")
      .reduce((sum, e) => sum + toMonthly(e.amount, e.frequency), 0);
    if (total > 0) {
      await supabase.from("profiles").update({ monthly_income: Math.round(total) }).eq("id", user.id);
    }
  }

  async function save(updated: IncomeEntry[]) {
    setEntries(updated);
    try { localStorage.setItem("income_entries", JSON.stringify(updated)); } catch {}
  }

  async function saveSideLog(updated: SideLog[]) {
    setSideLog(updated);
    try { localStorage.setItem("side_income_log_v1", JSON.stringify(updated)); } catch {}
  }

  async function addEntry() {
    if (!form.source || !form.amount) return;
    const entry: IncomeEntry = {
      id: `i${Date.now()}`,
      source: form.source,
      amount: parseFloat(form.amount) || 0,
      frequency: form.frequency,
      date: form.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      note: form.note || undefined,
      category: form.category,
    };
    const updated = [entry, ...entries];
    save(updated);
    if (user) {
      await supabase.from("income_entries").upsert({ ...entry, user_id: user.id });
      await syncIncomeToProfile(updated);
    }
    setForm({ source: "", amount: "", frequency: "monthly", date: "", note: "", category: "primary" });
    setShowAdd(false);
  }

  async function addSideLog() {
    if (!sideForm.amount) return;
    const entry: SideLog = { id: `sl${Date.now()}`, month: sideForm.month, amount: parseFloat(sideForm.amount) || 0, note: sideForm.note };
    const updated = [entry, ...sideLog];
    saveSideLog(updated);
    if (user) {
      await supabase.from("side_income_logs").upsert({ ...entry, user_id: user.id });
    }
    setSideForm({ month: new Date().toISOString().slice(0, 7), amount: "", note: "" });
    setShowSideAdd(false);
  }

  async function deleteEntry(id: string) {
    const updated = entries.filter(e => e.id !== id);
    save(updated);
    setEditingId(null);
    if (user) {
      await supabase.from("income_entries").delete().eq("id", id).eq("user_id", user.id);
      await syncIncomeToProfile(updated);
    }
  }

  async function updateEntry(id: string, updates: Partial<IncomeEntry>) {
    const updated = entries.map(e => e.id === id ? { ...e, ...updates } : e);
    save(updated);
    setEditingId(null);
    if (user) {
      await supabase.from("income_entries").update(updates).eq("id", id).eq("user_id", user.id);
      await syncIncomeToProfile(updated);
    }
  }

  if (!authed) return <div className="flex min-h-screen items-center justify-center"><div className="text-gray-500">Loading...</div></div>;

  const recurring = entries.filter(e => e.frequency !== "one-time");
  const oneTime = entries.filter(e => e.frequency === "one-time");
  const monthlyTotal = recurring.reduce((a, e) => a + toMonthly(e.amount, e.frequency), 0);
  const annualTotal = monthlyTotal * 12;
  const oneTimeTotal = oneTime.reduce((a, e) => a + e.amount, 0);

  const display = filter === "recurring" ? recurring : filter === "one-time" ? oneTime : entries;

  const sourceBreakdown: Record<string, number> = {};
  recurring.forEach(e => {
    sourceBreakdown[e.source] = (sourceBreakdown[e.source] || 0) + toMonthly(e.amount, e.frequency);
  });
  const sources = Object.entries(sourceBreakdown).sort((a, b) => b[1] - a[1]);

  const inputCls = "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-brand";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Income</h1>
          <p className="mt-1 text-sm text-gray-400">Track all your income sources in one place.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-bold text-black hover:opacity-90"
        >
          <Plus size={15} /> Add Income
        </button>
      </div>

      {/* Plaid-detected bank income */}
      <BankIncome />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="col-span-2 rounded-2xl border border-brand/20 bg-brand/5 p-4 md:col-span-1">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Monthly Income</p>
          <p className="font-mono text-2xl font-black text-brand">{fmt(monthlyTotal)}</p>
          <p className="mt-1 text-xs text-gray-500">{fmt(annualTotal)} / year</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <p className="mb-1 text-xs text-gray-500">Recurring sources</p>
          <p className="font-mono text-lg font-bold">{recurring.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <p className="mb-1 text-xs text-gray-500">One-time</p>
          <p className="font-mono text-lg font-bold">{oneTimeTotal > 0 ? fmt(oneTimeTotal) : " - "}</p>
        </div>
      </div>

      {/* Source breakdown */}
      {sources.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Breakdown</p>
          <div className="space-y-2">
            {sources.map(([name, amt]) => (
              <div key={name} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand/20 bg-brand/10">
                  <Wallet size={15} className="text-brand" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{name}</p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-brand-gradient"
                      style={{ width: `${(amt / monthlyTotal) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-bold text-brand">{fmt(amt)}<span className="text-xs font-normal text-gray-500">/mo</span></p>
                  <p className="text-xs text-gray-600">{((amt / monthlyTotal) * 100).toFixed(0)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side income monthly log */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-brand" />
            <p className="text-sm font-bold">Side Income Log</p>
          </div>
          <button
            onClick={() => setShowSideAdd(v => !v)}
            className="rounded-lg border border-brand/30 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/20 transition"
          >
            + Log month
          </button>
        </div>

        {showSideAdd && (
          <div className="mb-3 rounded-2xl border border-brand/30 bg-brand/[0.04] p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Month</p>
                <input
                  type="month"
                  value={sideForm.month}
                  onChange={e => setSideForm(f => ({ ...f, month: e.target.value }))}
                  className={inputCls}
                  style={{ colorScheme: "dark" }}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Amount earned</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={sideForm.amount}
                    onChange={e => setSideForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0"
                    className={`${inputCls} pl-7 font-mono`}
                  />
                </div>
              </div>
            </div>
            <input
              value={sideForm.note}
              onChange={e => setSideForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Note (e.g. freelance design, Uber, rental)"
              className={inputCls}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowSideAdd(false)} className="flex-1 rounded-xl border border-white/10 py-2 text-sm hover:bg-white/5">Cancel</button>
              <button
                onClick={addSideLog}
                disabled={!sideForm.amount}
                className="flex-1 rounded-xl bg-brand-gradient py-2 text-sm font-bold text-black hover:opacity-90 disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {sideLog.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 py-8 text-center">
            <p className="text-sm text-gray-500">No side income logged yet.</p>
            <p className="text-xs text-gray-600 mt-1">Track freelance, gig, rental, or any extra earnings month by month.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            {/* Mini chart */}
            {sideLog.length >= 2 && (() => {
              const sorted = [...sideLog].sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
              const max = Math.max(...sorted.map(s => s.amount));
              return (
                <div className="flex items-end gap-1.5 px-4 pt-4 pb-2 h-20">
                  {sorted.map(s => (
                    <div key={s.id} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md bg-brand-gradient transition-all duration-700"
                        style={{ height: `${Math.max((s.amount / max) * 52, 4)}px` }}
                      />
                      <p className="text-[9px] text-gray-600">{s.month.slice(5)}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
            {[...sideLog].sort((a, b) => b.month.localeCompare(a.month)).map((entry, i, arr) => {
              const d = new Date(entry.month + "-01");
              const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
              return (
                <div key={entry.id} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? "border-b border-white/5" : ""}`}>
                  <div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    {entry.note && <p className="text-xs text-gray-500">{entry.note}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-mono text-sm font-bold text-brand">${entry.amount.toLocaleString()}</p>
                    <button onClick={() => saveSideLog(sideLog.filter(s => s.id !== entry.id))} className="text-gray-600 hover:text-red-400 transition">
                      <X size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
            {sideLog.length >= 2 && (
              <div className="px-4 py-2.5 border-t border-white/5 flex justify-between text-xs text-gray-500">
                <span>Total logged</span>
                <span className="font-mono font-bold text-brand">${sideLog.reduce((a, s) => a + s.amount, 0).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex gap-2">
        {([["all", "All"], ["recurring", "Recurring"], ["one-time", "One-time"]] as const).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className="rounded-full px-4 py-1.5 text-sm font-semibold transition"
            style={{
              background: filter === v ? "#3EA758" : "rgba(255,255,255,0.05)",
              color: filter === v ? "#000" : "#8E8E93",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Entries list */}
      {entries.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center">
          <TrendingUp size={36} className="mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400">No income tracked yet.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-bold text-black hover:opacity-90"
          >
            Add your first income source
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {display.map(entry =>
            editingId === entry.id ? (
              <div key={entry.id} className="rounded-xl border border-brand/30 bg-white/[0.02] p-4 space-y-3">
                <input
                  defaultValue={entry.source}
                  onChange={e => updateEntry(entry.id, { source: e.target.value })}
                  className={inputCls}
                  placeholder="Source"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    defaultValue={entry.amount}
                    onChange={e => updateEntry(entry.id, { amount: parseFloat(e.target.value) || entry.amount })}
                    className={inputCls}
                    placeholder="Amount"
                  />
                  <select
                    defaultValue={entry.frequency}
                    onChange={e => updateEntry(entry.id, { frequency: e.target.value as IncomeEntry["frequency"] })}
                    className={inputCls}
                  >
                    {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(null)} className="flex-1 rounded-lg border border-white/10 py-2 text-sm hover:bg-white/5">Done</button>
                  <button onClick={() => deleteEntry(entry.id)} className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={entry.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 hover:bg-white/5"
                onClick={() => setEditingId(entry.id)}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand/20 bg-brand/10">
                  <ArrowUpRight size={18} className="text-brand" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {entry.source}
                    {entry.note && <span className="ml-1 text-xs font-normal text-gray-500">· {entry.note}</span>}
                  </p>
                  <p className="text-xs text-gray-500">{FREQ_LABELS[entry.frequency]} · {entry.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-bold text-brand">{fmt(entry.amount)}</p>
                  {entry.frequency !== "one-time" && entry.frequency !== "monthly" && (
                    <p className="text-xs text-gray-600">{fmt(toMonthly(entry.amount, entry.frequency))}/mo</p>
                  )}
                </div>
              </div>
            )
          )}
          {display.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">No entries for this filter.</p>
          )}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Add Income</h2>
                <p className="text-xs text-gray-500">Paycheck, freelance, side income, etc.</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Source *</label>
                <input
                  autoFocus
                  value={form.source}
                  onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                  placeholder="e.g. Salary, Freelance, Side hustle"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Amount *</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={e => setForm(f => ({ ...f, frequency: e.target.value as IncomeEntry["frequency"] }))}
                    className={inputCls}
                  >
                    {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Date received</label>
                  <input
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    placeholder="May 1"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Note (optional)</label>
                  <input
                    value={form.note}
                    onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="e.g. bonus, commission"
                    className={inputCls}
                  />
                </div>
              </div>
              {form.amount && form.frequency && form.frequency !== "one-time" && form.frequency !== "monthly" && (
                <div className="rounded-xl border border-brand/20 bg-brand/5 px-3 py-2 text-xs text-gray-400">
                  = {fmt(toMonthly(parseFloat(form.amount) || 0, form.frequency))} / month
                </div>
              )}
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 rounded-xl border border-white/10 py-3 text-sm hover:bg-white/5">Cancel</button>
              <button
                onClick={addEntry}
                disabled={!form.source || !form.amount}
                className="flex-1 rounded-xl bg-brand-gradient py-3 text-sm font-bold text-black hover:opacity-90 disabled:opacity-40"
              >
                Add Income
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
