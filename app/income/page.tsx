"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Plus, X, Trash2, Wallet, TrendingUp, ArrowUpRight } from "lucide-react";
import BankIncome from "@/components/BankIncome";

interface IncomeEntry {
  id: string;
  source: string;
  amount: number;
  frequency: "monthly" | "biweekly" | "weekly" | "one-time";
  date: string;
  note?: string;
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
    source: "", amount: "", frequency: "monthly" as IncomeEntry["frequency"], date: "", note: "",
  });

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      try {
        const stored = localStorage.getItem("income_entries");
        if (stored) setEntries(JSON.parse(stored));
      } catch {}
      setAuthed(true);
    }
    init();
  }, []);

  function save(updated: IncomeEntry[]) {
    setEntries(updated);
    try { localStorage.setItem("income_entries", JSON.stringify(updated)); } catch {}
  }

  function addEntry() {
    if (!form.source || !form.amount) return;
    const entry: IncomeEntry = {
      id: `i${Date.now()}`,
      source: form.source,
      amount: parseFloat(form.amount) || 0,
      frequency: form.frequency,
      date: form.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      note: form.note || undefined,
    };
    save([entry, ...entries]);
    setForm({ source: "", amount: "", frequency: "monthly", date: "", note: "" });
    setShowAdd(false);
  }

  function deleteEntry(id: string) {
    save(entries.filter(e => e.id !== id));
    setEditingId(null);
  }

  function updateEntry(id: string, updates: Partial<IncomeEntry>) {
    save(entries.map(e => e.id === id ? { ...e, ...updates } : e));
    setEditingId(null);
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
          <p className="font-mono text-lg font-bold">{oneTimeTotal > 0 ? fmt(oneTimeTotal) : "—"}</p>
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
