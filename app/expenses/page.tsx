"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Plus, Pencil, Trash2, X, DollarSign } from "lucide-react";

interface Expense {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category: string;
  due_date: string | null;
  type: "expense";
}

const EXPENSE_CATS = [
  "Food & Dining", "Transport", "Shopping", "Entertainment",
  "Health", "Utilities", "Travel", "Education", "Other",
];

const COMMON_NAMES = [
  "Netflix", "Hulu", "YouTube Premium", "Disney+", "HBO Max", "Peacock",
  "Paramount+", "Apple TV+", "Amazon Prime Video", "Crunchyroll",
  "Spotify", "Apple Music", "Tidal", "Pandora", "SiriusXM",
  "Amazon Prime", "Costco Membership", "Sam's Club",
  "Adobe Creative Cloud", "Microsoft 365", "Google One", "iCloud",
  "Dropbox", "Notion", "Canva Pro",
  "Gym Membership", "Planet Fitness", "Peloton", "ClassPass",
  "DoorDash", "Uber Eats", "Grubhub", "Instacart",
  "Uber", "Lyft",
  "Groceries", "Gas", "Electricity", "Water", "Internet",
  "Car Insurance", "Renters Insurance", "Health Insurance",
  "Student Loan", "Car Payment", "Mortgage", "Rent",
  "Coffee", "Dining Out", "Fast Food",
];

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const inputCls = "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-brand";

function NameInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const suggestions = value.trim().length > 0
    ? COMMON_NAMES.filter(n => n.toLowerCase().includes(value.toLowerCase())).slice(0, 6)
    : [];

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <input
        autoFocus
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="e.g. Netflix, Groceries, Haircut"
        className={inputCls}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] shadow-xl">
          {suggestions.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={() => { onChange(s); setOpen(false); }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExpensesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", amount: "", category: EXPENSE_CATS[0], due_date: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .order("created_at", { ascending: false });

      if (data) setExpenses(data as Expense[]);
      setLoading(false);
    }
    load();
  }, []);

  function openAdd() {
    setEditingId(null);
    setForm({ name: "", amount: "", category: EXPENSE_CATS[0], due_date: "" });
    setSaveError(null);
    setModalOpen(true);
  }

  function openEdit(exp: Expense) {
    setEditingId(exp.id);
    setForm({
      name: exp.name,
      amount: String(exp.amount),
      category: exp.category || EXPENSE_CATS[0],
      due_date: exp.due_date || "",
    });
    setSaveError(null);
    setModalOpen(true);
  }

  async function save() {
    if (!form.name || !form.amount || !userId) return;
    setSaving(true);
    setSaveError(null);

    const payload = {
      user_id: userId,
      name: form.name,
      amount: parseFloat(form.amount),
      category: form.category,
      due_date: form.due_date || null,
      type: "expense" as const,
      status: "active",
      color: "#FF6B35",
      autopay: false,
      source: "manual",
    };

    if (editingId) {
      const { error } = await supabase.from("items").update(payload).eq("id", editingId);
      if (error) { setSaveError(error.message); setSaving(false); return; }
      setExpenses(prev => prev.map(e => e.id === editingId ? { ...e, ...payload } as Expense : e));
    } else {
      const { data, error } = await supabase.from("items").insert(payload).select().single();
      if (error) { setSaveError(error.message); setSaving(false); return; }
      if (data) setExpenses(prev => [data as Expense, ...prev]);
    }

    setSaving(false);
    setModalOpen(false);
  }

  async function deleteExpense(id: string) {
    await supabase.from("items").delete().eq("id", id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    setDeleteConfirm(null);
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="text-gray-500">Loading...</div></div>;

  const total = expenses.reduce((a, b) => a + b.amount, 0);

  const byCat: Record<string, Expense[]> = {};
  expenses.forEach(e => {
    const cat = e.category || "Other";
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(e);
  });
  const catEntries = Object.entries(byCat).sort((a, b) => b[1].reduce((s, i) => s + i.amount, 0) - a[1].reduce((s, i) => s + i.amount, 0));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="mt-1 text-sm text-gray-400">{expenses.length} items · {fmt(total)} total</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-bold text-black hover:opacity-90"
        >
          <Plus size={15} /> Add Expense
        </button>
      </div>

      {/* Summary bar */}
      {expenses.length > 0 && (
        <div className="mb-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Total Spent</p>
              <p className="font-mono text-2xl font-black text-orange-400">{fmt(total)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{catEntries.length} categories</p>
              <p className="text-xs text-gray-500">{expenses.length} entries</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {expenses.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center">
          <DollarSign size={36} className="mx-auto mb-3 text-gray-600" />
          <p className="mb-1 font-semibold text-gray-300">No expenses yet</p>
          <p className="mb-6 text-sm text-gray-500">Log anything you spend money on.</p>
          <button onClick={openAdd} className="rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-bold text-black hover:opacity-90">
            Add your first expense
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {catEntries.map(([cat, items]) => {
            const catTotal = items.reduce((a, b) => a + b.amount, 0);
            return (
              <div key={cat}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">{cat}</p>
                  <span className="font-mono text-xs text-gray-500">{fmt(catTotal)}</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                  {items.map((exp, i) => (
                    <div key={exp.id} className={`flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] ${i < items.length - 1 ? "border-b border-white/5" : ""}`}>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
                        <DollarSign size={16} className="text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{exp.name}</p>
                        {exp.due_date && <p className="text-xs text-gray-500">{exp.due_date}</p>}
                      </div>
                      <span className="mr-2 font-mono text-sm font-bold">{fmt(exp.amount)}</span>
                      <button onClick={() => openEdit(exp)} className="rounded-lg p-2 text-gray-500 hover:bg-white/10 hover:text-white">
                        <Pencil size={14} />
                      </button>
                      {deleteConfirm === exp.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => deleteExpense(exp.id)} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10">
                            <X size={14} />
                          </button>
                          <button onClick={() => setDeleteConfirm(null)} className="rounded-lg p-2 text-gray-500 hover:bg-white/10">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(exp.id)} className="rounded-lg p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingId ? "Edit Expense" : "Add Expense"}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Name *</label>
                <NameInput value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className={`${inputCls} pl-7`} />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls}>
                  {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {saveError && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">{saveError}</div>
            )}
            <div className="mt-5 flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 rounded-xl border border-white/10 py-3 text-sm hover:bg-white/5">Cancel</button>
              <button onClick={save} disabled={saving || !form.name || !form.amount} className="flex-1 rounded-xl bg-brand-gradient py-3 text-sm font-bold text-black hover:opacity-90 disabled:opacity-40">
                {saving ? "Saving..." : editingId ? "Save Changes" : "Add Expense"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
