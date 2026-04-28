"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

type ItemType = "subscription" | "bill" | "trial" | "expense";

interface Item {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  type: ItemType;
  category: string;
  color: string;
  due_date: string | null;
  autopay: boolean;
  status: string;
  trial_days: number | null;
  source: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  subscription: "#3EA758",
  bill: "#FFB300",
  trial: "#38BDF8",
  expense: "#FF9500",
};

const CATEGORIES = [
  "Entertainment", "Music", "Software", "Health", "Storage", "Career",
  "Design", "Productivity", "Utilities", "Insurance", "Internet", "Phone",
  "Food & Dining", "Transport", "Shopping", "Travel", "Education", "Other",
];

const ITEM_COLORS = [
  "#3EA758", "#FFB300", "#38BDF8", "#FF6B35", "#E50914", "#1DB954",
  "#007AFF", "#FF9500", "#AF52DE", "#FF2D55", "#5AC8FA", "#FFCC00",
];

const EMPTY_FORM = {
  name: "", amount: "", type: "subscription" as ItemType,
  category: "Entertainment", due_date: "", autopay: false, trial_days: "", color: ITEM_COLORS[0],
};

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ManualPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<ItemType | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadData = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) setItems((data as Item[]).filter(i => !i.source || i.source === "manual"));
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

  function openAdd() { setEditingItem(null); setForm({ ...EMPTY_FORM }); setModalOpen(true); }
  function openEdit(item: Item) {
    setEditingItem(item);
    setForm({ name: item.name, amount: String(item.amount), type: item.type, category: item.category || "Other", due_date: item.due_date || "", autopay: item.autopay, trial_days: item.trial_days ? String(item.trial_days) : "", color: item.color || ITEM_COLORS[0] });
    setModalOpen(true);
  }

  async function saveItem() {
    if (!form.name || !form.amount) return;
    setSaving(true);
    const payload = {
      user_id: user.id, name: form.name, amount: parseFloat(form.amount),
      type: form.type, category: form.category, due_date: form.due_date || null,
      autopay: form.type === "expense" ? false : form.autopay,
      status: "active", color: form.color,
      trial_days: form.type === "trial" ? (parseInt(form.trial_days) || null) : null,
      source: "manual",
    };
    if (editingItem) {
      await supabase.from("items").update(payload).eq("id", editingItem.id);
      setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...payload } as Item : i));
    } else {
      const { data } = await supabase.from("items").insert(payload).select().single();
      if (data) setItems(prev => [data as Item, ...prev]);
    }
    setSaving(false);
    setModalOpen(false);
  }

  async function deleteItem(id: string) {
    await supabase.from("items").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
    setDeleteConfirm(null);
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="text-gray-500">Loading...</div></div>;

  const filtered = filterType === "all" ? items : items.filter(i => i.type === filterType);
  const total = items.filter(i => i.type !== "expense").reduce((a, b) => a + b.amount, 0);
  const expenseTotal = items.filter(i => i.type === "expense").reduce((a, b) => a + b.amount, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manual Entries</h1>
          <p className="mt-1 text-sm text-gray-400">
            {items.filter(i => i.type !== "expense").length} payables · {fmt(total)}/mo
            {items.filter(i => i.type === "expense").length > 0 && (
              <span className="ml-2 text-gray-600">· {items.filter(i => i.type === "expense").length} expenses · {fmt(expenseTotal)}</span>
            )}
          </p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-bold text-black hover:opacity-90">
          <Plus size={15} /> Add
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {(["all", "subscription", "bill", "trial", "expense"] as const).map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className="rounded-full px-3 py-1.5 text-xs font-semibold transition"
            style={{ background: filterType === t ? (t === "all" ? "#3EA758" : TYPE_COLORS[t]) : "rgba(255,255,255,0.05)", color: filterType === t ? "#000" : "#9ca3af" }}
          >
            {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1) + "s"}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500 mb-4">No items yet.</p>
            <button onClick={openAdd} className="rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-semibold text-black hover:opacity-90">Add your first item</button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map(item => (
              <div key={item.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-black" style={{ background: item.color || TYPE_COLORS[item.type] }}>
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      <span className="capitalize" style={{ color: TYPE_COLORS[item.type] }}>{item.type}</span>
                      {item.category ? ` · ${item.category}` : ""}
                      {item.due_date ? ` · ${item.type === "expense" ? item.due_date : `Due ${item.due_date}`}` : ""}
                      {item.autopay ? " · Autopay" : ""}
                      {item.trial_days ? ` · ${item.trial_days}d left` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{fmt(item.amount)}</span>
                  <button onClick={() => openEdit(item)} className="rounded-lg p-2 text-gray-500 hover:bg-white/10 hover:text-white"><Pencil size={14} /></button>
                  {deleteConfirm === item.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => deleteItem(item.id)} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"><Check size={14} /></button>
                      <button onClick={() => setDeleteConfirm(null)} className="rounded-lg p-2 text-gray-500 hover:bg-white/10"><X size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(item.id)} className="rounded-lg p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-400"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingItem ? "Edit item" : "Add item"}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-gray-400">Name</label>
                <input autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Netflix, Rent, Groceries..." className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 outline-none focus:border-brand" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm text-gray-400">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pl-7 pr-3 outline-none focus:border-brand" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-gray-400">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ItemType }))} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 outline-none focus:border-brand">
                    <option value="subscription">Subscription</option>
                    <option value="bill">Bill</option>
                    <option value="trial">Trial</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-gray-400">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 outline-none focus:border-brand">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm text-gray-400">{form.type === "expense" ? "Date" : "Due date"}</label>
                  <input value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} placeholder={form.type === "expense" ? "Apr 27" : "Apr 30"} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 outline-none focus:border-brand" />
                </div>
                {form.type === "trial" && (
                  <div>
                    <label className="mb-1.5 block text-sm text-gray-400">Trial days left</label>
                    <input type="number" value={form.trial_days} onChange={e => setForm(f => ({ ...f, trial_days: e.target.value }))} placeholder="7" className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 outline-none focus:border-brand" />
                  </div>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {ITEM_COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className="h-7 w-7 rounded-full transition hover:scale-110" style={{ background: c, outline: form.color === c ? "2px solid white" : "none", outlineOffset: 2 }} />
                  ))}
                </div>
              </div>
              {form.type !== "expense" && (
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={form.autopay} onChange={e => setForm(f => ({ ...f, autopay: e.target.checked }))} className="h-4 w-4 accent-brand" />
                  <span className="text-sm text-gray-300">Autopay</span>
                </label>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm hover:bg-white/5">Cancel</button>
              <button onClick={saveItem} disabled={saving || !form.name || !form.amount} className="flex-1 rounded-lg bg-brand-gradient py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50">
                {saving ? "Saving..." : editingItem ? "Save changes" : "Add item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
