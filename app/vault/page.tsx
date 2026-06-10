"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Plus, Pencil, Trash2, X, Check, PiggyBank, TrendingUp, Landmark, Wallet, DollarSign, Home, Shield } from "lucide-react";
import SaveSubNav from "@/components/SaveSubNav";

interface SavingsEntry {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category: string;
  color: string;
  note: string | null;
}

const ACCOUNT_TYPES = [
  { label: "Savings Account", icon: Landmark },
  { label: "Checking Account", icon: Wallet },
  { label: "Emergency Fund", icon: Shield },
  { label: "Cash",            icon: DollarSign },
  { label: "Investments",     icon: TrendingUp },
  { label: "Home Equity",     icon: Home },
  { label: "Other",           icon: PiggyBank },
];

const COLORS = [
  "#3EA758", "#FFB300", "#38BDF8", "#007AFF",
  "#AF52DE", "#FF6B35", "#FF2D55", "#5AC8FA",
];

const EMPTY_FORM = {
  name: "", amount: "", category: "Savings Account", color: COLORS[0], note: "",
};

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function motivationalMessage(total: number): string {
  if (total === 0) return "Add your first savings bucket to get started.";
  if (total < 500) return "Every dollar saved is a dollar working for you.";
  if (total < 1000) return "You're building a foundation. Keep going.";
  if (total < 5000) return "Solid start. Most Americans have less than $500 saved.";
  if (total < 10000) return "You're ahead of most people. Keep stacking.";
  if (total < 25000) return "Strong savings. You have real financial cushion.";
  if (total < 50000) return "You're in the top tier. This is real wealth-building.";
  return "Exceptional. You've built serious financial security.";
}

export default function VaultPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [entries, setEntries] = useState<SavingsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadData = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "savings")
      .order("created_at", { ascending: false });
    if (data) setEntries(data as SavingsEntry[]);
  }, [supabase]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      await loadData(user.id);
      setLoading(false);
    }
    init();
  }, []);

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  }

  function openEdit(entry: SavingsEntry) {
    setEditingId(entry.id);
    setForm({
      name: entry.name,
      amount: String(entry.amount),
      category: entry.category || "Savings Account",
      color: entry.color || COLORS[0],
      note: entry.note || "",
    });
    setModalOpen(true);
  }

  async function saveEntry() {
    if (!form.name || !form.amount) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      name: form.name,
      amount: parseFloat(form.amount),
      type: "savings",
      category: form.category,
      color: form.color,
      note: form.note || null,
      status: "active",
      source: "manual",
    };
    if (editingId) {
      await supabase.from("items").update(payload).eq("id", editingId);
      setEntries(prev => prev.map(e => e.id === editingId ? { ...e, ...payload } as SavingsEntry : e));
    } else {
      const { data } = await supabase.from("items").insert(payload).select().single();
      if (data) setEntries(prev => [data as SavingsEntry, ...prev]);
    }
    setSaving(false);
    setModalOpen(false);
  }

  async function deleteEntry(id: string) {
    await supabase.from("items").delete().eq("id", id);
    setEntries(prev => prev.filter(e => e.id !== id));
    setDeleteConfirm(null);
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="text-gray-500">Loading...</div></div>;

  const total = entries.reduce((a, b) => a + b.amount, 0);
  const largest = entries.length > 0 ? Math.max(...entries.map(e => e.amount)) : 0;

  return (
    <>
      <SaveSubNav />
      <div className="mx-auto max-w-2xl px-4 py-10">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Savings Vault</h1>
          <p className="mt-1 text-sm text-gray-400">Everything you have saved  -  accounts, cash, funds.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-bold text-black hover:opacity-90"
        >
          <Plus size={15} /> Add
        </button>
      </div>

      {/* Total hero */}
      <div className="mb-6 rounded-2xl border border-brand/20 bg-brand/5 p-6 text-center">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand">Total Saved</p>
        <p className="text-5xl font-black text-white">{fmt(total)}</p>
        <p className="mt-2 text-sm text-gray-400">{motivationalMessage(total)}</p>
        {entries.length > 1 && (
          <p className="mt-1 text-xs text-gray-600">{entries.length} accounts · largest: {fmt(largest)}</p>
        )}
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center">
          <PiggyBank size={36} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-500 mb-2">No savings added yet.</p>
          <p className="text-xs text-gray-600 mb-6">Add your savings account, emergency fund, or cash on hand.</p>
          <button
            onClick={openAdd}
            className="rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-semibold text-black hover:opacity-90"
          >
            Add your first bucket
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => {
            const TypeIcon = ACCOUNT_TYPES.find(t => t.label === entry.category)?.icon || PiggyBank;
            const pct = largest > 0 ? (entry.amount / largest) * 100 : 100;
            return (
              <div
                key={entry.id}
                className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 hover:bg-white/[0.03] transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: (entry.color || COLORS[0]) + "20" }}
                  >
                    <TypeIcon size={20} style={{ color: entry.color || COLORS[0] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{entry.name}</p>
                    <p className="text-xs text-gray-500">{entry.category}{entry.note ? ` · ${entry.note}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-black" style={{ color: entry.color || COLORS[0] }}>{fmt(entry.amount)}</p>
                    <button onClick={() => openEdit(entry)} className="rounded-lg p-2 text-gray-500 hover:bg-white/10 hover:text-white">
                      <Pencil size={14} />
                    </button>
                    {deleteConfirm === entry.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => deleteEntry(entry.id)} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"><Check size={14} /></button>
                        <button onClick={() => setDeleteConfirm(null)} className="rounded-lg p-2 text-gray-500 hover:bg-white/10"><X size={14} /></button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(entry.id)} className="rounded-lg p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {/* Progress bar relative to largest */}
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: entry.color || COLORS[0] }}
                  />
                </div>
              </div>
            );
          })}

          {/* Total row */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-between px-5 py-4">
            <span className="text-sm font-semibold text-gray-400">Total across all accounts</span>
            <span className="text-xl font-black text-brand">{fmt(total)}</span>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4 pb-4 sm:pb-0"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingId ? "Edit savings" : "Add savings"}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-gray-400">Name</label>
                <input
                  autoFocus
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Chase Savings, Emergency Fund, Cash..."
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-gray-400">Amount saved</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pl-7 pr-3 outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-gray-400">Account type</label>
                <div className="grid grid-cols-2 gap-2">
                  {ACCOUNT_TYPES.map(t => {
                    const Icon = t.icon;
                    const active = form.category === t.label;
                    return (
                      <button
                        key={t.label}
                        onClick={() => setForm(f => ({ ...f, category: t.label }))}
                        className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left transition"
                        style={{
                          borderColor: active ? "#3EA758" : "rgba(255,255,255,0.08)",
                          background: active ? "rgba(62,167,88,0.12)" : "rgba(255,255,255,0.02)",
                          color: active ? "#fff" : "#9ca3af",
                        }}
                      >
                        <Icon size={14} className={active ? "text-brand" : ""} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-gray-400">Note (optional)</label>
                <input
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="High-yield, 4.5% APY, goal: $10k..."
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">Color</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className="h-7 w-7 rounded-full transition hover:scale-110"
                      style={{ background: c, outline: form.color === c ? "2px solid white" : "none", outlineOffset: 2 }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={saveEntry}
                disabled={saving || !form.name || !form.amount}
                className="flex-1 rounded-lg bg-brand-gradient py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Save changes" : "Add to vault"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
