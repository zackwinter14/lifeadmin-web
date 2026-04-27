"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, Pencil, Trash2, X, Check, Landmark, Loader2, Lock } from "lucide-react";
import { usePlaidLink } from "react-plaid-link";

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

const TYPE_COLORS: Record<ItemType, string> = {
  subscription: "#3EA758",
  bill: "#FFB300",
  trial: "#38BDF8",
  expense: "#FF6B35",
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
  name: "",
  amount: "",
  type: "subscription" as ItemType,
  category: "Entertainment",
  due_date: "",
  autopay: false,
  trial_days: "",
  color: ITEM_COLORS[0],
};

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ItemRow({ item, onEdit, onDelete, deleteConfirm, onConfirmDelete, onCancelDelete }: {
  item: any; onEdit: (i: any) => void; onDelete: (id: string) => void;
  deleteConfirm: string | null; onConfirmDelete: (id: string) => void; onCancelDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-black" style={{ background: item.color || TYPE_COLORS[item.type as ItemType] }}>
          {item.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold">{item.name}</p>
          <p className="text-xs text-gray-500">
            <span className="capitalize" style={{ color: TYPE_COLORS[item.type as ItemType] }}>{item.type}</span>
            {item.category ? ` · ${item.category}` : ""}
            {item.due_date ? ` · Due ${item.due_date}` : ""}
            {item.autopay ? " · Autopay" : ""}
            {item.trial_days ? ` · ${item.trial_days}d left` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-bold">${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <button onClick={() => onEdit(item)} className="rounded-lg p-2 text-gray-500 hover:bg-white/10 hover:text-white"><Pencil size={14} /></button>
        {deleteConfirm === item.id ? (
          <div className="flex items-center gap-1">
            <button onClick={() => onConfirmDelete(item.id)} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"><Check size={14} /></button>
            <button onClick={onCancelDelete} className="rounded-lg p-2 text-gray-500 hover:bg-white/10"><X size={14} /></button>
          </div>
        ) : (
          <button onClick={() => onDelete(item.id)} className="rounded-lg p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-400"><Trash2 size={14} /></button>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [income, setIncome] = useState(0);
  const [incomeInput, setIncomeInput] = useState("");
  const [editingIncome, setEditingIncome] = useState(false);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [filterType, setFilterType] = useState<ItemType | "all">("all");
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [plaidConnected, setPlaidConnected] = useState(false);
  const [detectingIncome, setDetectingIncome] = useState(false);

  const loadData = useCallback(async (userId: string) => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("monthly_income, full_name")
      .eq("id", userId)
      .single();

    if (profileData?.full_name) setProfileName(profileData.full_name);
    if (profileData?.monthly_income) {
      setIncome(profileData.monthly_income);
      setIncomeInput(String(profileData.monthly_income));
    }

    const { data: itemsData } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", userId)
      .neq("type", "expense")
      .order("created_at", { ascending: true });

    if (itemsData) setItems(itemsData as Item[]);
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

  async function saveIncome(val: string) {
    const v = parseFloat(val) || 0;
    setIncome(v);
    setEditingIncome(false);
    await supabase.from("profiles").upsert({ id: user.id, monthly_income: v });
  }

  async function createLinkToken() {
    if (!user) return;
    const res = await fetch("/api/plaid/create-link-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    const data = await res.json();
    if (data.link_token) setLinkToken(data.link_token);
  }

  async function onPlaidSuccess(publicToken: string) {
    if (!user) return;
    setDetectingIncome(true);
    await fetch("/api/plaid/exchange-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicToken, userId: user.id }),
    });
    const res = await fetch("/api/plaid/income", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    const data = await res.json();
    if (data.income > 0) {
      setIncome(data.income);
      setIncomeInput(String(data.income));
    }
    setPlaidConnected(true);
    setDetectingIncome(false);
    setLinkToken(null);
  }

  function openAdd() {
    setEditingItem(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  }

  function openEdit(item: Item) {
    setEditingItem(item);
    setForm({
      name: item.name,
      amount: String(item.amount),
      type: item.type,
      category: item.category || "Other",
      due_date: item.due_date || "",
      autopay: item.autopay,
      trial_days: item.trial_days ? String(item.trial_days) : "",
      color: item.color || ITEM_COLORS[0],
    });
    setModalOpen(true);
  }

  async function saveItem() {
    if (!form.name || !form.amount) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      name: form.name,
      amount: parseFloat(form.amount),
      type: form.type,
      category: form.category,
      due_date: form.due_date || null,
      autopay: form.autopay,
      status: "active",
      color: form.color,
      trial_days: form.type === "trial" ? (parseInt(form.trial_days) || null) : null,
      source: "manual",
    };

    if (editingItem) {
      await supabase.from("items").update(payload).eq("id", editingItem.id);
      setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...payload } as Item : i));
    } else {
      const { data } = await supabase.from("items").insert(payload).select().single();
      if (data) setItems(prev => [...prev, data as Item]);
    }

    setSaving(false);
    setModalOpen(false);
  }

  async function deleteItem(id: string) {
    await supabase.from("items").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
    setDeleteConfirm(null);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  // Plaid Link hook — must be called unconditionally
  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: linkToken || "",
    onSuccess: (public_token) => onPlaidSuccess(public_token),
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const subs = items.filter(i => i.type === "subscription");
  const bills = items.filter(i => i.type === "bill");
  const trials = items.filter(i => i.type === "trial");
  const expenses = items.filter(i => i.type === "expense");

  const subsTotal = subs.reduce((a, b) => a + b.amount, 0);
  const billsTotal = bills.reduce((a, b) => a + b.amount, 0);
  const trialsTotal = trials.reduce((a, b) => a + b.amount, 0);
  const expensesTotal = expenses.reduce((a, b) => a + b.amount, 0);
  const totalSpend = subsTotal + billsTotal + trialsTotal + expensesTotal;

  const donutData = [
    { name: "Subscriptions", value: subsTotal, color: TYPE_COLORS.subscription },
    { name: "Bills", value: billsTotal, color: TYPE_COLORS.bill },
    { name: "Trials", value: trialsTotal, color: TYPE_COLORS.trial },
    { name: "Expenses", value: expensesTotal, color: TYPE_COLORS.expense },
  ].filter(d => d.value > 0);

  const allFiltered = filterType === "all" ? items : items.filter(i => i.type === filterType);
  const manualItems = allFiltered.filter(i => !i.source || i.source === "manual");
  const bankItems   = allFiltered.filter(i => i.source && i.source !== "manual");
  const isPro       = plaidConnected || bankItems.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Hey, <span className="gradient-text">{profileName || user?.email?.split("@")[0]}</span>
          </h1>
          <p className="mt-1 text-gray-400 text-sm">Your money at a glance.</p>
        </div>
        <button onClick={handleLogout} className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5">
          Log out
        </button>
      </div>

      {/* Income + Donut row */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">

        {/* Income card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <p className="mb-1 text-sm text-gray-400">Monthly income</p>
          {editingIncome ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-400">$</span>
              <input
                autoFocus
                type="number"
                value={incomeInput}
                onChange={e => setIncomeInput(e.target.value)}
                onBlur={() => saveIncome(incomeInput)}
                onKeyDown={e => { if (e.key === "Enter") saveIncome(incomeInput); if (e.key === "Escape") setEditingIncome(false); }}
                className="w-40 bg-transparent text-3xl font-bold outline-none border-b border-brand"
              />
            </div>
          ) : (
            <button onClick={() => { setEditingIncome(true); setIncomeInput(income ? String(income) : ""); }} className="text-left">
              <span className="text-3xl font-bold">{income > 0 ? fmt(income) : <span className="text-gray-500">Tap to set</span>}</span>
              <span className="ml-2 text-xs text-brand">edit</span>
            </button>
          )}
          {income > 0 && totalSpend > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Monthly spend</span>
                <span>{Math.round((totalSpend / income) * 100)}% of income</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/5">
                <div
                  className="h-2 rounded-full bg-brand-gradient transition-all"
                  style={{ width: `${Math.min((totalSpend / income) * 100, 100)}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-gray-400">
                {fmt(totalSpend)} spent · <span className={income - totalSpend < 0 ? "text-red-400" : "text-brand"}>{fmt(Math.abs(income - totalSpend))} {income - totalSpend < 0 ? "over" : "left"}</span>
              </p>
            </div>
          )}

          {/* Connect Bank / Auto-detect income */}
          <div className="mt-4 border-t border-white/5 pt-4">
            {detectingIncome ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 size={14} className="animate-spin text-brand" />
                Detecting your income…
              </div>
            ) : plaidConnected ? (
              <div className="flex items-center gap-2 text-sm text-brand">
                <Check size={14} /> Bank connected · Income auto-detected
              </div>
            ) : linkToken && plaidReady ? (
              <button
                onClick={() => openPlaid()}
                className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-bold text-black hover:opacity-90"
              >
                <Landmark size={14} /> Open Bank Login
              </button>
            ) : (
              <button
                onClick={createLinkToken}
                className="flex items-center gap-2 rounded-xl border border-brand/30 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand hover:bg-brand/15"
              >
                <Landmark size={14} /> Auto-detect income from bank
              </button>
            )}
          </div>
        </div>

        {/* Donut card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          {donutData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                    {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {[
                  { label: "Subscriptions", total: subsTotal, color: TYPE_COLORS.subscription, count: subs.length },
                  { label: "Bills", total: billsTotal, color: TYPE_COLORS.bill, count: bills.length },
                  { label: "Trials", total: trialsTotal, color: TYPE_COLORS.trial, count: trials.length },
                  { label: "Expenses", total: expensesTotal, color: TYPE_COLORS.expense, count: expenses.length },
                ].filter(r => r.total > 0).map(row => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
                      <span className="text-gray-300">{row.label}</span>
                      <span className="text-gray-600 text-xs">({row.count})</span>
                    </div>
                    <span className="font-semibold">{fmt(row.total)}</span>
                  </div>
                ))}
                <div className="border-t border-white/5 pt-2 flex justify-between text-sm font-bold">
                  <span>Total / mo</span>
                  <span className="gradient-text">{fmt(totalSpend)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center py-4">
              <p className="text-gray-500 text-sm">Add your first item to see the breakdown.</p>
            </div>
          )}
        </div>
      </div>

      {/* Items list */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <div className="flex items-center gap-2 flex-wrap">
            {(["all", "subscription", "bill", "trial", "expense"] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filterType === t ? "bg-brand text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
              >
                {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1) + "s"}
              </button>
            ))}
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
          >
            <Plus size={15} /> Add
          </button>
        </div>

        {allFiltered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500">No items yet.</p>
            <button onClick={openAdd} className="mt-4 rounded-lg bg-brand-gradient px-6 py-2.5 text-sm font-semibold text-black hover:opacity-90">
              Add your first item
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Manual entries */}
            {manualItems.length > 0 && (
              <div>
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Manual Entries</p>
                <div className="divide-y divide-white/5">
                  {manualItems.map(item => <ItemRow key={item.id} item={item} onEdit={openEdit} onDelete={setDeleteConfirm} deleteConfirm={deleteConfirm} onConfirmDelete={deleteItem} onCancelDelete={() => setDeleteConfirm(null)} />)}
                </div>
              </div>
            )}

            {/* Bank-connected entries */}
            <div>
              <div className="mb-2 flex items-center gap-2 px-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Bank Connected</p>
                <span className="rounded-full bg-brand/20 px-2 py-0.5 text-[10px] font-bold text-brand">Pro</span>
              </div>
              {isPro ? (
                bankItems.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {bankItems.map(item => <ItemRow key={item.id} item={item} onEdit={openEdit} onDelete={setDeleteConfirm} deleteConfirm={deleteConfirm} onConfirmDelete={deleteItem} onCancelDelete={() => setDeleteConfirm(null)} />)}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-brand/20 bg-brand/5 py-8 text-center">
                    <Landmark size={24} className="mx-auto mb-2 text-brand/50" />
                    <p className="text-sm text-gray-400">Connect your bank to auto-import subscriptions and bills.</p>
                  </div>
                )
              ) : (
                <div className="relative overflow-hidden rounded-2xl border border-white/10">
                  <div className="pointer-events-none select-none divide-y divide-white/5 opacity-30 blur-[2px]">
                    {["Netflix", "Spotify", "Amazon Prime"].map(n => (
                      <div key={n} className="flex items-center gap-3 px-6 py-4">
                        <div className="h-10 w-10 rounded-xl bg-white/10" />
                        <div className="flex-1 space-y-1.5"><div className="h-3 w-24 rounded bg-white/10" /><div className="h-2 w-16 rounded bg-white/5" /></div>
                        <div className="h-3 w-12 rounded bg-white/10" />
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                    <Lock size={20} className="mb-2 text-brand" />
                    <p className="font-semibold text-white">Pro Feature</p>
                    <p className="mt-1 text-xs text-gray-400">Connect your bank to auto-import entries</p>
                    <button className="mt-3 rounded-xl bg-brand-gradient px-5 py-2 text-sm font-bold text-black hover:opacity-90">
                      Upgrade to Pro
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
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
                <input
                  autoFocus
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Netflix, Rent, Gym..."
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm text-gray-400">Amount / mo</label>
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
                  <label className="mb-1.5 block text-sm text-gray-400">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value as ItemType }))}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 outline-none focus:border-brand"
                  >
                    <option value="subscription">Subscription</option>
                    <option value="bill">Bill</option>
                    <option value="trial">Trial</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-gray-400">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 outline-none focus:border-brand"
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm text-gray-400">Due date</label>
                  <input
                    value={form.due_date}
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    placeholder="Apr 30"
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 outline-none focus:border-brand"
                  />
                </div>
                {form.type === "trial" && (
                  <div>
                    <label className="mb-1.5 block text-sm text-gray-400">Trial days left</label>
                    <input
                      type="number"
                      value={form.trial_days}
                      onChange={e => setForm(f => ({ ...f, trial_days: e.target.value }))}
                      placeholder="7"
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 outline-none focus:border-brand"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {ITEM_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className="h-7 w-7 rounded-full transition hover:scale-110"
                      style={{ background: c, outline: form.color === c ? `2px solid white` : "none", outlineOffset: 2 }}
                    />
                  ))}
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.autopay}
                  onChange={e => setForm(f => ({ ...f, autopay: e.target.checked }))}
                  className="h-4 w-4 accent-brand"
                />
                <span className="text-sm text-gray-300">Autopay</span>
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm hover:bg-white/5">
                Cancel
              </button>
              <button
                onClick={saveItem}
                disabled={saving || !form.name || !form.amount}
                className="flex-1 rounded-lg bg-brand-gradient py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : editingItem ? "Save changes" : "Add item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
