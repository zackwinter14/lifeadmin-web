"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis,
} from "recharts";
import {
  Landmark, Loader2, Check, ChevronRight, Repeat, X,
  CreditCard, Plus, PiggyBank, ArrowRight,
} from "lucide-react";
import { usePlaidLink } from "react-plaid-link";
import UpgradeBanner from "@/components/UpgradeBanner";
import UpcomingCharges from "@/components/UpcomingCharges";
import MerchantLogo from "@/components/MerchantLogo";
import PriceChangeAlert from "@/components/PriceChangeAlert";
import HealthScore from "@/components/HealthScore";
import SetupWizard from "@/components/SetupWizard";

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemType = "subscription" | "bill" | "trial" | "expense";

interface Item {
  id: string;
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

interface SavingsGoal {
  id: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  color: string;
  emoji: string;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  subscription: "#3EA758",
  bill: "#FFB300",
  trial: "#38BDF8",
  expense: "#FF6B35",
};

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Savings Strip ────────────────────────────────────────────────────────────

function SavingsStrip({ userId }: { userId: string }) {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`savings_goals_${userId}`);
      if (raw) setGoals(JSON.parse(raw));
    } catch {}
  }, [userId]);

  if (goals.length === 0) {
    return (
      <Link
        href="/save"
        className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-[#00C853]/20 bg-[#00C853]/5 px-5 py-4 transition hover:bg-[#00C853]/10"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00C853]/15">
            <PiggyBank size={18} style={{ color: "#00C853" }} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Start your first savings goal</p>
            <p className="text-xs text-gray-500">House, car, vacation, emergency fund — whatever you're working toward</p>
          </div>
        </div>
        <ArrowRight size={16} className="shrink-0 text-[#00C853]" />
      </Link>
    );
  }

  const display = goals.slice(0, 3);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Savings Goals</p>
        <Link href="/save" className="text-xs font-medium text-[#00C853] hover:underline">
          View all ({goals.length}) →
        </Link>
      </div>

      <div className="space-y-4">
        {display.map((goal) => {
          const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
          const remaining = goal.targetAmount - goal.currentAmount;
          const monthsLeft = goal.monthlyContribution > 0
            ? Math.ceil(remaining / goal.monthlyContribution)
            : null;
          return (
            <div key={goal.id}>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{goal.emoji}</span>
                  <span className="text-sm font-semibold text-white">{goal.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-white">{fmt(goal.currentAmount)}</span>
                  <span className="text-xs text-gray-600"> / {fmt(goal.targetAmount)}</span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: goal.color }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[11px] text-gray-600">{pct.toFixed(0)}% saved</span>
                {monthsLeft !== null && (
                  <span className="text-[11px] text-gray-500">
                    {monthsLeft <= 0 ? "Goal reached!" : `${monthsLeft} month${monthsLeft !== 1 ? "s" : ""} to go`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {goals.length > 0 && (
        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
          <span className="text-xs text-gray-500">Total saved</span>
          <span className="text-sm font-bold" style={{ color: "#00C853" }}>
            {fmt(totalSaved)} <span className="text-xs font-normal text-gray-600">of {fmt(totalTarget)}</span>
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, onClick }: {
  label: string; value: string; sub: string; color: string; onClick: () => void;
}) {
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

// ─── TypeMover ────────────────────────────────────────────────────────────────

const ALL_TYPES: { type: ItemType; label: string }[] = [
  { type: "subscription", label: "Subscription" },
  { type: "bill",         label: "Bill"         },
  { type: "expense",      label: "Expense"      },
];

function ModalTip() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    try { if (localStorage.getItem("category_tip_dismissed")) setVisible(false); } catch {}
  }, []);
  function dismiss() {
    setVisible(false);
    try { localStorage.setItem("category_tip_dismissed", "1"); } catch {}
  }
  if (!visible) return null;
  return (
    <div className="mx-5 mt-3 mb-1 flex items-start gap-2.5 rounded-xl border border-[#3EA758]/20 bg-[#3EA758]/5 px-3.5 py-2.5">
      <Repeat size={13} className="mt-0.5 shrink-0 text-[#3EA758]" />
      <p className="flex-1 text-xs leading-relaxed text-gray-400">
        Tap the colored pill on any item to move it to the right category.
      </p>
      <button onClick={dismiss} className="shrink-0 rounded p-0.5 text-gray-600 hover:text-gray-300" aria-label="Dismiss">
        <X size={13} />
      </button>
    </div>
  );
}

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

  if (saved) return <span className="text-xs font-semibold text-[#3EA758]">Saved</span>;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggle}
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

// ─── Add Expense Modal ────────────────────────────────────────────────────────

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

const inputCls = "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-[#3EA758]";

function NameAutocomplete({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
            <button key={s} type="button" onMouseDown={() => { onChange(s); setOpen(false); }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AddExpenseModal({ userId, onClose, onSaved }: {
  userId: string;
  onClose: () => void;
  onSaved: (item: Item) => void;
}) {
  const supabase = createClient();
  const [form, setForm] = useState({ name: "", amount: "", category: EXPENSE_CATS[0], due_date: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!form.name || !form.amount) return;
    setSaving(true);
    setError(null);
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
    };
    const { data, error: err } = await supabase.from("items").insert(payload).select().single();
    if (err) { setError(err.message); setSaving(false); return; }
    if (data) onSaved(data as Item);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">Add Expense</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Name *</label>
            <NameAutocomplete value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input type="number" min="0" step="0.01" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00" className={`${inputCls} pl-7`} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Date</label>
              <input type="date" value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className={inputCls} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls}>
              {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        {error && <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">{error}</div>}
        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-3 text-sm hover:bg-white/5">Cancel</button>
          <button onClick={save} disabled={saving || !form.name || !form.amount}
            className="flex-1 rounded-xl bg-brand-gradient py-3 text-sm font-bold text-black hover:opacity-90 disabled:opacity-40">
            {saving ? "Saving..." : "Add Expense"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Items Modal ──────────────────────────────────────────────────────────────

function ItemsModal({ label, color, items, onClose, onTypeChange, onAdd }: {
  label: string;
  color: string;
  items: Item[];
  onClose: () => void;
  onTypeChange: (id: string, newType: ItemType) => void;
  onAdd?: () => void;
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
            <ModalTip />
            <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                  <MerchantLogo name={item.name} color={item.color || TYPE_COLORS[item.type]} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.category}
                      {item.due_date ? ` · Due ${item.due_date}` : ""}
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
          <span className="text-xs text-gray-500">Monthly total</span>
          <div className="flex items-center gap-3">
            {onAdd && (
              <button onClick={onAdd}
                className="flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-bold text-black hover:opacity-90">
                <Plus size={12} /> Add Expense
              </button>
            )}
            <span className="font-bold" style={{ color }}>{fmt(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

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
  const [isPro, setIsPro] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [plaidConnected, setPlaidConnected] = useState(false);
  const [detectingIncome, setDetectingIncome] = useState(false);
  const [activeCard, setActiveCard] = useState<{ label: string; color: string; filterType: ItemType | "all" } | null>(null);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [creditCards, setCreditCards] = useState<{ id: string; name: string; last_four: string | null; credit_limit: number; current_balance: number; min_payment: number | null; due_date: string | null }[]>([]);
  const [recurringUpcoming, setRecurringUpcoming] = useState<{ id: string; name: string; amount: number; color: string; type: ItemType; due_date: string; autopay: boolean; daysUntil: number }[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [setupDone, setSetupDone] = useState(false);

  async function moveItemType(id: string, newType: ItemType) {
    const item = items.find(i => i.id === id);
    if (!item) { setDebugInfo("ERROR: Item not in state. ID: " + id); return; }
    const oldType = item.type;
    setItems(prev => prev.map(i => i.id === id ? { ...i, type: newType } : i));

    const { data: { user: authUser } } = await supabase.auth.getUser();
    const { data: updated, error, status, statusText } = await supabase
      .from("items")
      .update({ type: newType })
      .eq("id", id)
      .eq("user_id", authUser?.id)
      .select();

    if (error || !updated || updated.length === 0) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, type: oldType } : i));
      setDebugInfo([
        "=== MOVE DEBUG ===",
        "Item ID: " + id,
        "Old type: " + oldType + " → New type: " + newType,
        "HTTP status: " + status + " " + (statusText || ""),
        "Rows updated: " + (updated?.length ?? 0),
        "Error: " + (error ? JSON.stringify(error) : "none"),
      ].join("\n"));
      return;
    }

    setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await loadData(user.id);
    }, 500);

    try {
      localStorage.setItem("items_version", String(Date.now()));
      window.dispatchEvent(new Event("items-updated"));
    } catch {}

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

  const loadData = useCallback(async (userId: string) => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("monthly_income, full_name, is_pro")
      .eq("id", userId)
      .single();

    if (profileData?.full_name) setProfileName(profileData.full_name);
    if (profileData?.is_pro) setIsPro(true);
    if (profileData?.monthly_income) {
      setIncome(profileData.monthly_income);
      setIncomeInput(String(profileData.monthly_income));
    }

    const { data: itemsData } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (itemsData) setItems(itemsData as Item[]);

    const { data: ccData } = await supabase
      .from("credit_cards")
      .select("id, name, last_four, credit_limit, current_balance, min_payment, due_date")
      .eq("user_id", userId);
    if (ccData) setCreditCards(ccData);

    const todayStr = new Date().toISOString().slice(0, 10);
    const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const INCOME_KWS = ["va benefit", "va payment", "veteran", "disability", "social security", "ssa", "payroll", "direct deposit", "unemployment", "treasury", "government benefit"];
    const { data: recData } = await supabase
      .from("recurring_transactions")
      .select("id, merchant_name, clean_merchant_name, frequency, last_amount, average_amount, next_predicted_date, category")
      .eq("user_id", userId)
      .eq("is_active", true)
      .not("next_predicted_date", "is", null)
      .gte("next_predicted_date", todayStr)
      .lte("next_predicted_date", in7);
    if (recData) {
      const now = new Date();
      const mapped = recData
        .filter((r: any) => {
          const name = (r.clean_merchant_name || r.merchant_name || "").toLowerCase();
          return !INCOME_KWS.some(kw => name.includes(kw));
        })
        .map((r: any) => {
          const d = new Date(r.next_predicted_date);
          const daysUntil = Math.ceil((d.getTime() - now.getTime()) / 86400000);
          return {
            id: "rec_" + r.id,
            name: r.clean_merchant_name || r.merchant_name,
            amount: r.last_amount || r.average_amount || 0,
            color: TYPE_COLORS.bill,
            type: "bill" as ItemType,
            due_date: r.next_predicted_date,
            autopay: false,
            daysUntil,
          };
        });
      setRecurringUpcoming(mapped);
    }
  }, [supabase]);

  useEffect(() => {
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      const wizardDone = localStorage.getItem(`setup_wizard_done_${user.id}`) === "true";
      if (!wizardDone) setShowWizard(true);
      setSetupDone(wizardDone);
      await loadData(user.id);
      setLoading(false);

      realtimeChannel = supabase
        .channel("dashboard-sync-" + user.id)
        .on("postgres_changes", { event: "*", schema: "public", table: "items", filter: `user_id=eq.${user.id}` },
          () => loadData(user.id))
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
          () => loadData(user.id))
        .subscribe();
    }
    init();

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
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };
  }, []);

  async function saveIncome(val: string) {
    const v = parseFloat(val) || 0;
    const prev = income;
    setIncome(v);
    setEditingIncome(false);
    const res = await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, monthly_income: v }),
    });
    if (!res.ok) {
      setIncome(prev);
      setIncomeInput(String(prev));
    }
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
    try {
      await fetch("/api/plaid/exchange-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicToken, userId: user.id }),
      });
      const res = await fetch("/api/plaid/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.income > 0) { setIncome(data.income); setIncomeInput(String(data.income)); }
    } catch {}
    setPlaidConnected(true);
    setDetectingIncome(false);
    setLinkToken(null);
  }

  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: linkToken || "",
    onSuccess: (public_token) => onPlaidSuccess(public_token),
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  // ── Computed values ──────────────────────────────────────────────────────────
  const subs     = items.filter(i => i.type === "subscription");
  const bills    = items.filter(i => i.type === "bill");
  const expenses = items.filter(i => i.type === "expense");
  const subsTotal      = subs.reduce((a, b) => a + b.amount, 0);
  const billsTotal     = bills.reduce((a, b) => a + b.amount, 0);
  const expensesTotal  = expenses.reduce((a, b) => a + b.amount, 0);
  const creditMinTotal = creditCards.reduce((s, c) => s + (c.min_payment || 0), 0);
  const creditBalanceTotal = creditCards.reduce((s, c) => s + (c.current_balance || 0), 0);
  const totalSpend  = subsTotal + billsTotal + expensesTotal + creditMinTotal;
  const remaining   = income - totalSpend;
  const spendPct    = income > 0 ? Math.min(Math.round((totalSpend / income) * 100), 100) : 0;

  const donutData = [
    { name: "Subscriptions", value: subsTotal, color: TYPE_COLORS.subscription },
    { name: "Bills", value: billsTotal, color: TYPE_COLORS.bill },
    { name: "Expenses", value: expensesTotal, color: TYPE_COLORS.expense },
    { name: "Credit Payments", value: creditMinTotal, color: "#38BDF8" },
  ].filter(d => d.value > 0);

  const today = new Date();

  const creditUpcoming = creditCards
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
        due_date: c.due_date,
        autopay: false,
        daysUntil,
      };
    })
    .filter(Boolean) as { id: string; name: string; amount: number; color: string; type: ItemType; due_date: string | null; autopay: boolean; daysUntil: number }[];

  const upcoming = items
    .filter(i => i.due_date)
    .map(i => {
      const parts = i.due_date!.trim().split(" ");
      const MONTH_MAP: Record<string, number> = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
      let day = 0;
      if (parts.length === 2 && MONTH_MAP[parts[0]] !== undefined) {
        const d = new Date(today.getFullYear(), MONTH_MAP[parts[0]], parseInt(parts[1]));
        day = Math.ceil((d.getTime() - today.getTime()) / 86400000);
      } else {
        const n = parseInt(i.due_date!);
        if (!isNaN(n)) {
          const d = new Date(today.getFullYear(), today.getMonth(), n);
          if (d < today) d.setMonth(d.getMonth() + 1);
          day = Math.ceil((d.getTime() - today.getTime()) / 86400000);
        }
      }
      return { ...i, daysUntil: day };
    })
    .filter(i => i.daysUntil >= 0 && i.daysUntil <= 7)
    .concat(creditUpcoming as any[])
    .concat(recurringUpcoming as any[])
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 6);

  const INCOME_KWS_FILTER = ["va benefit", "va payment", "veteran", "disability", "social security", "ssa", "payroll", "direct deposit", "unemployment", "treasury", "government benefit"];
  const topItems = [...items]
    .filter(i => !INCOME_KWS_FILTER.some(kw => i.name.toLowerCase().includes(kw)))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6)
    .map(i => ({
      name: i.name.length > 20 ? i.name.slice(0, 18) + "\u2026" : i.name,
      amount: parseFloat(i.amount.toFixed(2)),
      fill: TYPE_COLORS[i.type] || "#888",
    }));

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">

      {/* Setup not done banner */}
      {!setupDone && !showWizard && (
        <div className="mb-6 rounded-2xl border border-[#00C853]/20 bg-[#00C853]/5 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-white">Finish setting up your account</p>
            <p className="text-xs text-gray-500 mt-0.5">Add your income, subscriptions, and bills to see your full picture.</p>
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="shrink-0 rounded-xl bg-[#00C853] px-4 py-2 text-xs font-bold text-black hover:opacity-90 transition"
          >
            Resume setup
          </button>
        </div>
      )}

      {/* Debug banner */}
      {debugInfo && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <p className="text-sm font-bold text-red-400">Could not save that change</p>
            <button onClick={() => setDebugInfo(null)} className="text-xs text-gray-500 hover:text-white">close</button>
          </div>
          <p className="text-xs text-gray-400 mb-3">Your changes have been undone. If this keeps happening, contact support.</p>
          <details>
            <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400 select-none">Show details</summary>
            <pre className="mt-2 text-xs text-gray-500 whitespace-pre-wrap font-mono overflow-auto max-h-48">{debugInfo}</pre>
          </details>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Hey, <span className="gradient-text">{profileName || user?.email?.split("@")[0]}</span>
          </h1>
          <p className="mt-1 text-sm text-gray-400">Here's your full financial picture.</p>
        </div>
        <button
          onClick={() => setAddExpenseOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-bold text-black hover:opacity-90"
        >
          <Plus size={15} /> Add Expense
        </button>
      </div>

      {/* ── 1. SAVINGS GOALS (top priority) ────────────────────────────────── */}
      {user && <SavingsStrip userId={user.id} />}

      {/* ── 2. INCOME & SPENDING ─────────────────────────────────────────────── */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Monthly Budget</div>

        <div className="mt-3 flex items-start justify-between gap-4 flex-wrap">
          {/* Income */}
          <div>
            <p className="text-xs text-gray-600 mb-1">Take-home income</p>
            {editingIncome ? (
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-400">$</span>
                <input
                  autoFocus
                  type="number"
                  value={incomeInput}
                  onChange={e => setIncomeInput(e.target.value)}
                  onBlur={() => saveIncome(incomeInput)}
                  onKeyDown={e => { if (e.key === "Enter") saveIncome(incomeInput); if (e.key === "Escape") setEditingIncome(false); }}
                  className="w-36 bg-transparent text-2xl font-bold outline-none border-b border-[#3EA758]"
                />
              </div>
            ) : (
              <button onClick={() => { setEditingIncome(true); setIncomeInput(income ? String(income) : ""); }} className="text-left group">
                <span className="text-2xl font-black">{income > 0 ? fmt(income) : <span className="text-gray-500 text-lg">Set income</span>}</span>
                <span className="ml-2 text-xs text-[#3EA758] opacity-0 group-hover:opacity-100 transition">edit</span>
              </button>
            )}
          </div>

          {/* Tracked spend */}
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">Tracked spending</p>
            <p className="text-2xl font-black text-white">{fmt(totalSpend)}</p>
          </div>

          {/* Left over */}
          {income > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-600 mb-1">{remaining >= 0 ? "Available to save" : "Over budget"}</p>
              <p className={`text-2xl font-black ${remaining < 0 ? "text-red-400" : "text-[#00C853]"}`}>
                {remaining < 0 ? "-" : "+"}{fmt(Math.abs(remaining))}
              </p>
            </div>
          )}
        </div>

        {income > 0 && (
          <div className="mt-5">
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
              <span>{spendPct}% of income tracked</span>
              {remaining > 0 && <span className="text-[#00C853]">Move {fmt(remaining)} to savings →</span>}
            </div>
          </div>
        )}

        {/* Bank connect row */}
        <div className="mt-4 border-t border-white/5 pt-4">
          {detectingIncome ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={14} className="animate-spin text-[#3EA758]" /> Detecting your income...
            </div>
          ) : plaidConnected ? (
            <div className="flex items-center gap-2 text-sm text-[#3EA758]"><Check size={14} /> Bank connected · Income auto-detected</div>
          ) : linkToken && plaidReady ? (
            <button onClick={() => openPlaid()} className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-bold text-black hover:opacity-90">
              <Landmark size={14} /> Open Bank Login
            </button>
          ) : (
            <button onClick={createLinkToken} className="flex items-center gap-2 rounded-xl border border-[#3EA758]/30 bg-[#3EA758]/10 px-4 py-2 text-sm font-semibold text-[#3EA758] hover:bg-[#3EA758]/15">
              <Landmark size={14} /> Auto-detect income from bank
            </button>
          )}
        </div>
      </div>

      {user && <PriceChangeAlert userId={user.id} />}
      <UpcomingCharges />
      <UpgradeBanner />

      {/* ── 3. STAT CARDS ─────────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Subscriptions" value={fmt(subsTotal)} sub={`${subs.length} active`}
          color={TYPE_COLORS.subscription}
          onClick={() => setActiveCard({ label: "Subscriptions", color: TYPE_COLORS.subscription, filterType: "subscription" })}
        />
        <StatCard
          label="Bills" value={fmt(billsTotal)} sub={`${bills.length} tracked`}
          color={TYPE_COLORS.bill}
          onClick={() => setActiveCard({ label: "Bills", color: TYPE_COLORS.bill, filterType: "bill" })}
        />
        <StatCard
          label="Expenses" value={fmt(expensesTotal)} sub={`${expenses.length} logged`}
          color={TYPE_COLORS.expense}
          onClick={() => setActiveCard({ label: "Expenses", color: TYPE_COLORS.expense, filterType: "expense" as any })}
        />
        <StatCard
          label="Monthly Total" value={fmt(totalSpend)} sub={`${items.length} items`}
          color="#AF52DE"
          onClick={() => setActiveCard({ label: "All Items", color: "#AF52DE", filterType: "all" })}
        />
      </div>

      {/* ── 4. CREDIT CARD STRIP ──────────────────────────────────────────────── */}
      {creditCards.length > 0 && (
        <div
          className="mb-6 flex items-center justify-between rounded-2xl border border-[#38BDF8]/20 bg-[#38BDF8]/5 px-5 py-4 cursor-pointer hover:bg-[#38BDF8]/10 transition"
          onClick={() => router.push("/credit")}
        >
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

      {/* ── 5. SPEND BREAKDOWN + DUE THIS WEEK ───────────────────────────────── */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">

        {/* Donut */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500">Spend Breakdown</p>
          {donutData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
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
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: row.color }} />
                      <span className="text-gray-300">{row.name}</span>
                    </div>
                    <span className="font-semibold">{fmt(row.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-gray-500">No items yet — add from Finances.</p>
            </div>
          )}
        </div>

        {/* Due this week */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500">Due This Week</p>
          {upcoming.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-gray-500">Nothing due in the next 7 days.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <MerchantLogo name={item.name} color={item.color || TYPE_COLORS[item.type]} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.due_date}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{fmt(item.amount)}</p>
                    <p className={`text-xs font-semibold ${item.daysUntil === 0 ? "text-red-400" : item.daysUntil <= 2 ? "text-orange-400" : "text-gray-500"}`}>
                      {item.daysUntil === 0 ? "Today" : item.daysUntil === 1 ? "Tomorrow" : `${item.daysUntil}d`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 6. TOP ITEMS BAR CHART ────────────────────────────────────────────── */}
      {topItems.length > 0 && (
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Biggest Monthly Charges</p>
          <p className="mb-4 text-xs text-gray-600">Your top recurring costs at a glance</p>
          <ResponsiveContainer width="100%" height={topItems.length * 34 + 8}>
            <BarChart data={topItems} layout="vertical" margin={{ top: 0, right: 56, left: 0, bottom: 0 }}>
              <XAxis type="number" hide domain={[0, "dataMax"]} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: any) => [fmt(v), "Monthly"]}
                contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={20}>
                {topItems.map((entry, i) => <Cell key={i} fill={entry.fill} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex gap-5 text-xs text-gray-500">
            {([
              { label: "Subscription", color: TYPE_COLORS.subscription },
              { label: "Bill", color: TYPE_COLORS.bill },
              { label: "Expense", color: TYPE_COLORS.expense },
            ] as const).map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. QUICK LINKS ────────────────────────────────────────────────────── */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <button
          onClick={() => router.push("/save")}
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 text-left hover:bg-white/[0.04] transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00C853]/10 border border-[#00C853]/20">
              <PiggyBank size={16} style={{ color: "#00C853" }} />
            </div>
            <div>
              <p className="font-semibold">Savings Goals</p>
              <p className="text-xs text-gray-500">Track your progress</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-600" />
        </button>

        <button
          onClick={() => router.push("/finances")}
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 text-left hover:bg-white/[0.04] transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/20">
              <Repeat size={16} className="text-[#38BDF8]" />
            </div>
            <div>
              <p className="font-semibold">Finances</p>
              <p className="text-xs text-gray-500">{items.length} items tracked</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-600" />
        </button>

        <button
          onClick={() => router.push("/bank")}
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 text-left hover:bg-white/[0.04] transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5E8EFF]/10 border border-[#5E8EFF]/20">
              <Landmark size={16} className="text-[#5E8EFF]" />
            </div>
            <div>
              <p className="font-semibold">Bank Accounts</p>
              <p className="text-xs text-gray-500">{isPro ? "Auto-imported" : "Connect to auto-detect"}</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-600" />
        </button>
      </div>

      {/* ── 8. HEALTH SCORE ───────────────────────────────────────────────────── */}
      {user && <HealthScore userId={user.id} />}

      {/* ── Modals ─────────────────────────────────────────────────────────────── */}
      {activeCard && (
        <ItemsModal
          label={activeCard.label}
          color={activeCard.color}
          items={activeCard.filterType === "all" ? items : items.filter(i => i.type === activeCard.filterType)}
          onClose={() => setActiveCard(null)}
          onTypeChange={moveItemType}
          onAdd={activeCard.filterType === "expense" ? () => { setActiveCard(null); setAddExpenseOpen(true); } : undefined}
        />
      )}

      {addExpenseOpen && user && (
        <AddExpenseModal
          userId={user.id}
          onClose={() => setAddExpenseOpen(false)}
          onSaved={(item) => {
            setItems(prev => [item, ...prev]);
            try { localStorage.setItem("items_version", String(Date.now())); } catch {}
          }}
        />
      )}

      {showWizard && user && (
        <SetupWizard
          userId={user.id}
          onComplete={() => { setShowWizard(false); setSetupDone(true); }}
          onDismiss={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}
