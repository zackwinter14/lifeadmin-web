"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp,
  Repeat, Receipt, Zap, DollarSign, Clock, ArrowRightLeft, CreditCard,
} from "lucide-react";
import HelpTip from "@/components/HelpTip";
import SubScanner from "@/components/SubScanner";

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
  bill:         "#FFB300",
  trial:        "#38BDF8",
  expense:      "#FF6B35",
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

const ALL_TYPES: { type: ItemType; label: string }[] = [
  { type: "subscription", label: "Subscription" },
  { type: "bill",         label: "Bill"         },
  { type: "trial",        label: "Trial"        },
  { type: "expense",      label: "Expense"      },
];

function TypeMover({ item, onMove }: { item: Item; onMove: (id: string, newType: ItemType) => void }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      const t = e.target as Node;
      if (buttonRef.current && !buttonRef.current.contains(t)) {
        const popover = document.getElementById(`type-popover-${item.id}`);
        if (!popover || !popover.contains(t)) setOpen(false);
      }
    }
    function reposition() {
      if (buttonRef.current) {
        const r = buttonRef.current.getBoundingClientRect();
        setPos({ top: r.bottom + 6, left: Math.max(8, r.right - 160) });
      }
    }
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, item.id]);

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: Math.max(8, r.right - 160) });
    }
    setOpen(o => !o);
  }

  function move(newType: ItemType) {
    setOpen(false);
    onMove(item.id, newType);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (saved) return <span className="text-xs font-semibold text-brand">Saved</span>;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggle}
        title="Move to different category"
        className="rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize transition hover:opacity-80"
        style={{ background: TYPE_COLORS[item.type] + "25", color: TYPE_COLORS[item.type] }}
      >
        {item.type}
      </button>
      {mounted && open && pos && createPortal(
        <div
          id={`type-popover-${item.id}`}
          className="fixed z-[300] w-40 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] shadow-2xl"
          style={{ top: pos.top, left: pos.left }}
        >
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Move to</p>
          {ALL_TYPES.filter(t => t.type !== item.type).map(t => (
            <button
              key={t.type}
              onClick={e => { e.stopPropagation(); move(t.type); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-white transition hover:bg-white/5"
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: TYPE_COLORS[t.type] }} />
              {t.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

function StatCard({ label, value, sub, color, onClick }: { label: string; value: string; sub: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.04] active:scale-[0.98] w-full"
    >
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color }}>{label}</p>
      <p className="font-mono text-2xl font-black text-white">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{sub} · tap to view</p>
    </button>
  );
}

function ItemsModal({ label, color, items, onClose, onTypeChange }: {
  label: string; color: string; items: Item[]; onClose: () => void;
  onTypeChange: (id: string, newType: ItemType) => void;
}) {
  const total = items.reduce((a, b) => a + b.amount, 0);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4 pb-4 sm:pb-0"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <p className="font-bold" style={{ color }}>{label}</p>
            <p className="text-xs text-gray-500">{items.length} item{items.length !== 1 ? "s" : ""} · {fmt(total)}/mo</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-white/10 hover:text-white">
            <X size={16} />
          </button>
        </div>
        {items.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">Nothing here yet.</div>
        ) : (
          <>
            <p className="px-5 pt-3 text-[10px] text-gray-600">Tap the category pill to move an item to a different type.</p>
            <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-black"
                    style={{ background: item.color || TYPE_COLORS[item.type] }}>
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.category}
                      {item.due_date ? ` · ${item.type === "expense" ? item.due_date : `Due ${item.due_date}`}` : ""}
                      {item.autopay ? " · Autopay" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <TypeMover item={item} onMove={onTypeChange} />
                    <p className="font-bold text-sm">{fmt(item.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="border-t border-white/5 px-5 py-3 flex justify-between items-center">
          <span className="text-xs text-gray-500">Total</span>
          <span className="font-bold" style={{ color }}>{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
}

function CategoryTip() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem("category_tip_dismissed")) setVisible(false);
    } catch {}
  }, []);

  function dismiss() {
    setVisible(false);
    try { localStorage.setItem("category_tip_dismissed", "1"); } catch {}
  }

  if (!visible) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-brand/20 bg-brand/5 px-4 py-3.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/15">
        <ArrowRightLeft size={13} className="text-brand" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">Tip: Fix miscategorized items</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-400">
          If something landed in the wrong section, tap the colored pill on any item —{" "}
          <span className="rounded-full bg-[#3EA75825] px-1.5 py-0.5 text-[10px] font-semibold text-[#3EA758]">subscription</span>{" "}
          <span className="rounded-full bg-[#FFB30025] px-1.5 py-0.5 text-[10px] font-semibold text-[#FFB300]">bill</span>{" "}
          <span className="rounded-full bg-[#38BDF825] px-1.5 py-0.5 text-[10px] font-semibold text-[#38BDF8]">trial</span>{" "}
          — and move it where it belongs. The system remembers your correction for next time.
        </p>
      </div>
      <button
        onClick={dismiss}
        className="mt-0.5 shrink-0 rounded-lg p-1 text-gray-600 transition hover:bg-white/10 hover:text-gray-300"
        aria-label="Dismiss tip"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function SectionHeader({
  icon, title, count, total, color, open, onToggle, onAdd,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  total: number;
  color: string;
  open: boolean;
  onToggle: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <button onClick={onToggle} className="flex flex-1 items-center gap-3 text-left">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: color + "20" }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-gray-500">{count} item{count !== 1 ? "s" : ""} · {fmt(total)}/mo</p>
        </div>
        <span className="ml-2 text-gray-600">{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
      </button>
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
        style={{ background: color + "20", color }}
      >
        <Plus size={13} /> Add
      </button>
    </div>
  );
}

export default function ManualPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [creditCards, setCreditCards] = useState<{ id: string; name: string; last_four: string | null; credit_limit: number; current_balance: number; min_payment: number | null; due_date: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [income, setIncome] = useState(0);
  const [incomeInput, setIncomeInput] = useState("");
  const [editingIncome, setEditingIncome] = useState(false);

  // Section open/close
  const [openSections, setOpenSections] = useState({ subscription: true, bill: true, trial: false, expense: true });
  const [activeCard, setActiveCard] = useState<{ label: string; color: string; filterType: ItemType | "all" } | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadData = useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("monthly_income")
      .eq("id", userId)
      .single();
    if (profile?.monthly_income) {
      setIncome(profile.monthly_income);
      setIncomeInput(String(profile.monthly_income));
    }
    const { data } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) setItems((data as Item[]).filter(i => !i.source || i.source === "manual"));

    const { data: ccData } = await supabase
      .from("credit_cards")
      .select("id, name, last_four, credit_limit, current_balance, min_payment, due_date")
      .eq("user_id", userId);
    if (ccData) setCreditCards(ccData);
  }, [supabase]);

  async function moveItemType(id: string, newType: ItemType) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const oldType = item.type;

    // Optimistic update
    setItems(prev => prev.map(i => i.id === id ? { ...i, type: newType } : i));

    // Persist
    const { data: updated, error } = await supabase
      .from("items")
      .update({ type: newType })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Failed to move item:", error);
      setItems(prev => prev.map(i => i.id === id ? { ...i, type: oldType } : i));
      alert("Couldn't save the change.\n\n" + (error.message || "Unknown error") + "\n\nOpen the browser console (F12) for full details.");
      return;
    }

    if (!updated || updated.length === 0) {
      console.error("Update returned 0 rows — RLS likely blocking the write.");
      setItems(prev => prev.map(i => i.id === id ? { ...i, type: oldType } : i));
      alert("Move didn't save. The database blocked the update (no UPDATE permission). Run the RLS fix SQL in Supabase.");
      return;
    }

    // Notify other pages
    try {
      localStorage.setItem("items_version", String(Date.now()));
      window.dispatchEvent(new Event("items-updated"));
    } catch {}

    // Save merchant rule (best effort)
    try {
      const key = (item.name || "").toLowerCase().trim();
      if (key) {
        await supabase.from("merchant_rules").upsert(
          { merchant_name: key, correct_type: newType, correct_category: item.category, last_updated: new Date().toISOString() },
          { onConflict: "merchant_name" }
        );
      }
    } catch (e) {
      console.warn("Merchant rule save skipped:", e);
    }
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      await loadData(user.id);
      setLoading(false);
    }
    init();

    // Refresh when items change elsewhere
    const onItemsUpdated = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await loadData(user.id);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === "items_version") onItemsUpdated();
    };
    window.addEventListener("items-updated", onItemsUpdated);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("items-updated", onItemsUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  async function saveIncome(val: string) {
    const v = parseFloat(val) || 0;
    setIncome(v);
    setEditingIncome(false);
    if (user) await supabase.from("profiles").upsert({ id: user.id, monthly_income: v });
  }

  function openAdd(type: ItemType) {
    setEditingItem(null);
    setForm({ ...EMPTY_FORM, type });
    setModalOpen(true);
  }

  function openEdit(item: Item) {
    setEditingItem(item);
    setForm({
      name: item.name, amount: String(item.amount), type: item.type,
      category: item.category || "Other", due_date: item.due_date || "",
      autopay: item.autopay, trial_days: item.trial_days ? String(item.trial_days) : "",
      color: item.color || ITEM_COLORS[0],
    });
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

  const subs     = items.filter(i => i.type === "subscription");
  const bills    = items.filter(i => i.type === "bill");
  const trials   = items.filter(i => i.type === "trial");
  const expenses = items.filter(i => i.type === "expense");

  const subsTotal     = subs.reduce((a, b) => a + b.amount, 0);
  const billsTotal    = bills.reduce((a, b) => a + b.amount, 0);
  const trialsTotal   = trials.reduce((a, b) => a + b.amount, 0);
  const expensesTotal = expenses.reduce((a, b) => a + b.amount, 0);
  const creditMinTotal = creditCards.reduce((s, c) => s + (c.min_payment || 0), 0);
  const creditBalanceTotal = creditCards.reduce((s, c) => s + (c.current_balance || 0), 0);
  const totalSpend    = subsTotal + billsTotal + trialsTotal + expensesTotal + creditMinTotal;
  const remaining     = income - totalSpend;
  const spendPct      = income > 0 ? Math.min(Math.round((totalSpend / income) * 100), 100) : 0;

  const donutData = [
    { name: "Subscriptions", value: subsTotal, color: TYPE_COLORS.subscription },
    { name: "Bills", value: billsTotal, color: TYPE_COLORS.bill },
    { name: "Trials", value: trialsTotal, color: TYPE_COLORS.trial },
    { name: "Expenses", value: expensesTotal, color: TYPE_COLORS.expense },
    { name: "Credit Payments", value: creditMinTotal, color: "#38BDF8" },
  ].filter(d => d.value > 0);

  // Upcoming in next 7 days
  const today = new Date();
  const creditDueThisWeek = creditCards
    .filter(c => c.due_date)
    .map(c => {
      const day = parseInt(c.due_date!);
      if (isNaN(day)) return null;
      let target = new Date(today.getFullYear(), today.getMonth(), day);
      if (target <= today) target.setMonth(target.getMonth() + 1);
      const daysUntil = Math.ceil((target.getTime() - today.getTime()) / 86400000);
      if (daysUntil < 0 || daysUntil > 7) return null;
      return {
        id: "cc_" + c.id,
        name: c.name + (c.last_four ? ` ···· ${c.last_four}` : ""),
        amount: c.min_payment || c.current_balance || 0,
        color: "#38BDF8",
        type: "bill" as ItemType,
        autopay: false,
        daysUntil,
      };
    })
    .filter(Boolean) as { id: string; name: string; amount: number; color: string; type: ItemType; autopay: boolean; daysUntil: number }[];
  const MONTH_MAP: Record<string, number> = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
  const upcoming = items
    .filter(i => i.due_date && i.type !== "expense")
    .map(i => {
      const parts = i.due_date!.trim().split(" ");
      let daysUntil = 999;
      if (parts.length === 2 && MONTH_MAP[parts[0]] !== undefined) {
        const d = new Date(today.getFullYear(), MONTH_MAP[parts[0]], parseInt(parts[1]));
        daysUntil = Math.ceil((d.getTime() - today.getTime()) / 86400000);
      } else {
        const n = parseInt(i.due_date!);
        if (!isNaN(n)) {
          const d = new Date(today.getFullYear(), today.getMonth(), n);
          if (d < today) d.setMonth(d.getMonth() + 1);
          daysUntil = Math.ceil((d.getTime() - today.getTime()) / 86400000);
        }
      }
      return { ...i, daysUntil };
    })
    .filter(i => i.daysUntil >= 0 && i.daysUntil <= 7)
    .concat(creditDueThisWeek as any[])
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const sections: { type: ItemType; label: string; icon: React.ReactNode; items: Item[]; total: number }[] = [
    { type: "subscription", label: "Subscriptions", icon: <Repeat size={16} />, items: subs, total: subsTotal },
    { type: "bill",         label: "Bills",          icon: <Zap size={16} />,    items: bills, total: billsTotal },
    { type: "expense",      label: "Expenses",       icon: <Receipt size={16} />, items: expenses, total: expensesTotal },
    { type: "trial",        label: "Free Trials",    icon: <Clock size={16} />,  items: trials, total: trialsTotal },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Finances</h1>
        <p className="mt-1 text-sm text-gray-400">
          Track everything manually — subscriptions, bills, expenses, and income.
        </p>
      </div>

      <HelpTip
        storageKey="manual_categories"
        title="What goes in each category?"
        color="#FFB300"
        body={
          <>
            <p><span className="text-[#3EA758] font-semibold">Subscriptions</span> — services billed on a repeating schedule: Netflix, Spotify, gym memberships, software. Add these first since they&apos;re the easiest to forget about.</p>
            <p className="mt-1"><span className="text-[#FFB300] font-semibold">Bills</span> — utilities, rent, phone, insurance. These are fixed monthly obligations even if the amount changes slightly.</p>
            <p className="mt-1"><span className="text-[#38BDF8] font-semibold">Trials</span> — free trials that could charge you soon. Add them so you don&apos;t get surprised when the trial ends.</p>
            <p className="mt-1"><span className="text-[#FF6B35] font-semibold">Expenses</span> — one-time or irregular purchases. Groceries, gas, dining out. Tracking these helps you understand where your &ldquo;extra&rdquo; money goes.</p>
            <p className="mt-1">If something lands in the wrong section, tap the colored pill on any item to move it.</p>
          </>
        }
      />

      {/* Income hero */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Monthly Income</p>
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
              <button
                onClick={() => { setEditingIncome(true); setIncomeInput(income ? String(income) : ""); }}
                className="text-left group"
              >
                <span className="text-3xl font-black">
                  {income > 0 ? fmt(income) : <span className="text-gray-500">Tap to set income</span>}
                </span>
                <span className="ml-2 text-xs text-brand opacity-0 group-hover:opacity-100 transition">edit</span>
              </button>
            )}
          </div>
          {income > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">{spendPct}% of income</p>
              <p className={`text-lg font-bold ${remaining < 0 ? "text-red-400" : "text-brand"}`}>
                {remaining < 0 ? "-" : "+"}{fmt(Math.abs(remaining))} {remaining < 0 ? "over budget" : "remaining"}
              </p>
            </div>
          )}
        </div>
        {income > 0 && (
          <div className="mt-4">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${spendPct}%`,
                  background: spendPct > 90 ? "#FF3B30" : spendPct > 70 ? "#FFB300" : "#3EA758",
                }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>{fmt(totalSpend)} tracked</span>
              <span>{fmt(income)} income</span>
            </div>
          </div>
        )}
      </div>

      {/* Credit card summary strip */}
      {creditCards.length > 0 && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-[#38BDF8]/20 bg-[#38BDF8]/5 px-5 py-4 cursor-pointer hover:bg-[#38BDF8]/10 transition" onClick={() => router.push("/credit")}>
          <div className="flex items-center gap-3">
            <CreditCard size={18} className="text-[#38BDF8]" />
            <div>
              <p className="text-sm font-bold text-white">Credit Card Debt</p>
              <p className="text-xs text-gray-400">{creditCards.length} card{creditCards.length !== 1 ? "s" : ""} · {creditMinTotal > 0 ? `${fmt(creditMinTotal)}/mo min payments` : "no min payments set"}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-white">{fmt(creditBalanceTotal)}</p>
            <p className="text-xs text-[#38BDF8]">View cards</p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Subscriptions" value={fmt(subsTotal)} sub={`${subs.length} active`} color={TYPE_COLORS.subscription} onClick={() => setActiveCard({ label: "Subscriptions", color: TYPE_COLORS.subscription, filterType: "subscription" })} />
        <StatCard label="Bills" value={fmt(billsTotal)} sub={`${bills.length} tracked`} color={TYPE_COLORS.bill} onClick={() => setActiveCard({ label: "Bills", color: TYPE_COLORS.bill, filterType: "bill" })} />
        <StatCard label="Expenses" value={fmt(expensesTotal)} sub={`${expenses.length} this month`} color={TYPE_COLORS.expense} onClick={() => setActiveCard({ label: "Expenses", color: TYPE_COLORS.expense, filterType: "expense" })} />
        <StatCard label="Monthly Total" value={fmt(totalSpend)} sub={`${items.length} items + credit`} color="#AF52DE" onClick={() => setActiveCard({ label: "All Items", color: "#AF52DE", filterType: "all" })} />
      </div>

      {activeCard && (
        <ItemsModal
          label={activeCard.label}
          color={activeCard.color}
          items={activeCard.filterType === "all" ? items : items.filter(i => i.type === activeCard!.filterType)}
          onClose={() => setActiveCard(null)}
          onTypeChange={moveItemType}
        />
      )}

      {/* Donut + Upcoming row */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">

        {/* Spend breakdown donut */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500">Spend Breakdown</p>
          {donutData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={32} outerRadius={50} paddingAngle={2} dataKey="value">
                    {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => fmt(v)}
                    contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5">
                {donutData.map(row => (
                  <div key={row.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: row.color }} />
                      <span className="text-gray-300">{row.name}</span>
                    </div>
                    <span className="font-semibold">{fmt(row.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-28 flex-col items-center justify-center gap-2">
              <p className="text-sm text-gray-500">Nothing tracked yet.</p>
              <p className="text-xs text-gray-600">Add a subscription or bill below to get started.</p>
            </div>
          )}
        </div>

        {/* Upcoming dues */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500">Due This Week</p>
          {upcoming.length === 0 ? (
            <div className="flex h-28 flex-col items-center justify-center gap-2">
              <p className="text-sm text-gray-500">Nothing due in the next 7 days.</p>
              <p className="text-xs text-gray-600">Set a due date on any item to see it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-black"
                    style={{ background: item.color || TYPE_COLORS[item.type] }}
                  >
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.daysUntil === 0 ? "Due today" : item.daysUntil === 1 ? "Due tomorrow" : `Due in ${item.daysUntil} days`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{fmt(item.amount)}</p>
                    {item.autopay && <p className="text-xs text-brand">Autopay</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category tip */}
      <CategoryTip />

      {/* Sections */}
      <div className="space-y-4">
        {sections.map(section => (
          <div key={section.type} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            <SectionHeader
              icon={section.icon}
              title={section.label}
              count={section.items.length}
              total={section.total}
              color={TYPE_COLORS[section.type]}
              open={openSections[section.type]}
              onToggle={() => setOpenSections(s => ({ ...s, [section.type]: !s[section.type] }))}
              onAdd={() => openAdd(section.type)}
            />

            {openSections[section.type] && (
              <>
                {/* Subscription scanner — only in the subscriptions section */}
                {section.type === "subscription" && user && (
                  <SubScanner
                    userId={user.id}
                    trackedNames={items.map(i => i.name)}
                    onAdded={() => loadData(user.id)}
                  />
                )}

                {section.items.length === 0 ? (
                  <div className="border-t border-white/5 px-5 py-8 text-center">
                    <p className="text-sm text-gray-500 mb-3">No {section.label.toLowerCase()} added yet.</p>
                    <button
                      onClick={() => openAdd(section.type)}
                      className="rounded-xl px-5 py-2 text-sm font-semibold transition hover:opacity-80"
                      style={{ background: TYPE_COLORS[section.type] + "20", color: TYPE_COLORS[section.type] }}
                    >
                      Add {section.label === "Free Trials" ? "a trial" : `a ${section.label.slice(0, -1).toLowerCase()}`}
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 border-t border-white/5">
                    {section.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-black"
                            style={{ background: item.color || TYPE_COLORS[item.type] }}
                          >
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-xs text-gray-500">
                              {item.category}
                              {item.due_date ? ` · ${item.type === "expense" ? item.due_date : `Due ${item.due_date}`}` : ""}
                              {item.autopay ? " · Autopay" : ""}
                              {item.trial_days ? ` · ${item.trial_days}d left` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TypeMover item={item} onMove={moveItemType} />
                          <span className="font-bold">{fmt(item.amount)}</span>
                          {item.type !== "expense" && (
                            <span className="text-xs text-gray-600">/mo</span>
                          )}
                          <button
                            onClick={() => openEdit(item)}
                            className="rounded-lg p-2 text-gray-500 hover:bg-white/10 hover:text-white"
                          >
                            <Pencil size={14} />
                          </button>
                          {deleteConfirm === item.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => deleteItem(item.id)} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"><Check size={14} /></button>
                              <button onClick={() => setDeleteConfirm(null)} className="rounded-lg p-2 text-gray-500 hover:bg-white/10"><X size={14} /></button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(item.id)} className="rounded-lg p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-400">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add income CTA at bottom */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
            <DollarSign size={18} className="text-brand" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Monthly Income</p>
            <p className="text-xs text-gray-500">
              {income > 0 ? `Set to ${fmt(income)}/mo — click to update` : "Set your income to see how much is left after bills"}
            </p>
          </div>
          <button
            onClick={() => setEditingIncome(true)}
            className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand hover:bg-brand/15"
          >
            {income > 0 ? "Update" : "Set income"}
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
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
                  placeholder="Netflix, Rent, Groceries..."
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm text-gray-400">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number" min="0" step="0.01"
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
                  <label className="mb-1.5 block text-sm text-gray-400">
                    {form.type === "expense" ? "Date" : "Due date"}
                  </label>
                  <input
                    value={form.due_date}
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    placeholder={form.type === "expense" ? "Apr 27" : "15"}
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
                <div className="flex flex-wrap gap-2">
                  {ITEM_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className="h-7 w-7 rounded-full transition hover:scale-110"
                      style={{ background: c, outline: form.color === c ? "2px solid white" : "none", outlineOffset: 2 }}
                    />
                  ))}
                </div>
              </div>

              {form.type !== "expense" && (
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.autopay}
                    onChange={e => setForm(f => ({ ...f, autopay: e.target.checked }))}
                    className="h-4 w-4 accent-brand"
                  />
                  <span className="text-sm text-gray-300">Autopay</span>
                </label>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm hover:bg-white/5"
              >
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
