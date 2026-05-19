"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Landmark, Loader2, Check, ChevronRight, AlertTriangle, Clock, Repeat, X, CreditCard } from "lucide-react";
import { usePlaidLink } from "react-plaid-link";
import UpgradeBanner from "@/components/UpgradeBanner";
import UpcomingCharges from "@/components/UpcomingCharges";
import HelpTip from "@/components/HelpTip";
import MerchantLogo from "@/components/MerchantLogo";
import PriceChangeAlert from "@/components/PriceChangeAlert";
import HealthScore from "@/components/HealthScore";

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

const TYPE_COLORS: Record<string, string> = {
  subscription: "#3EA758",
  bill: "#FFB300",
  trial: "#38BDF8",
  expense: "#FF6B35",
};

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

function ModalTip() {
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
    <div className="mx-5 mt-3 mb-1 flex items-start gap-2.5 rounded-xl border border-brand/20 bg-brand/5 px-3.5 py-2.5">
      <Repeat size={13} className="mt-0.5 shrink-0 text-brand" />
      <p className="flex-1 text-xs leading-relaxed text-gray-400">
        Tap the colored pill on any item to move it to the right category. The system saves your correction for future syncs.
      </p>
      <button
        onClick={dismiss}
        className="shrink-0 rounded p-0.5 text-gray-600 hover:text-gray-300"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
}

const ALL_TYPES: { type: ItemType; label: string }[] = [
  { type: "subscription", label: "Subscription" },
  { type: "bill",         label: "Bill"         },
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

function ItemsModal({ label, color, items, onClose, onTypeChange }: {
  label: string;
  color: string;
  items: Item[];
  onClose: () => void;
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
          <span className="font-bold" style={{ color }}>{fmt(total)}</span>
        </div>
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
  const [isPro, setIsPro] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [plaidConnected, setPlaidConnected] = useState(false);
  const [detectingIncome, setDetectingIncome] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeCard, setActiveCard] = useState<{ label: string; color: string; filterType: ItemType | "all" } | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [creditCards, setCreditCards] = useState<{ id: string; name: string; last_four: string | null; credit_limit: number; current_balance: number; min_payment: number | null; due_date: string | null }[]>([]);

  async function moveItemType(id: string, newType: ItemType) {
    const item = items.find(i => i.id === id);
    if (!item) {
      setDebugInfo("ERROR: Item not in state. ID: " + id);
      return;
    }
    const oldType = item.type;

    // Optimistic update
    setItems(prev => prev.map(i => i.id === id ? { ...i, type: newType } : i));

    // Get current auth user for diagnostics
    const { data: { user: authUser } } = await supabase.auth.getUser();

    // Persist to items table
    const { data: updated, error, status, statusText } = await supabase
      .from("items")
      .update({ type: newType })
      .eq("id", id)
      .eq("user_id", authUser?.id)
      .select();

    const debugLines = [
      "=== MOVE DEBUG ===",
      "Item ID: " + id,
      "Item name: " + item.name,
      "Old type: " + oldType + " → New type: " + newType,
      "Item user_id: " + (item as any).user_id,
      "Auth user_id: " + (authUser?.id || "NOT LOGGED IN"),
      "User IDs match: " + ((item as any).user_id === authUser?.id ? "YES ✓" : "NO ✗"),
      "Item source: " + (item.source || "null"),
      "HTTP status: " + status + " " + (statusText || ""),
      "Rows updated: " + (updated?.length ?? 0),
      "Error: " + (error ? JSON.stringify(error) : "none"),
    ];
    const debugText = debugLines.join("\n");

    if (error || !updated || updated.length === 0) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, type: oldType } : i));
      setDebugInfo(debugText);
      return;
    }

    // Force a fresh reload from the database to confirm save stuck
    setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await loadData(user.id);
    }, 500);

    // Tell other open tabs/pages to refresh
    try {
      localStorage.setItem("items_version", String(Date.now()));
      window.dispatchEvent(new Event("items-updated"));
    } catch {}

    // Save merchant rule (best effort — won't fail the move if table is missing)
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
      .neq("type", "expense")
      .order("created_at", { ascending: true });

    if (itemsData) setItems(itemsData as Item[]);

    const { data: ccData } = await supabase
      .from("credit_cards")
      .select("id, name, last_four, credit_limit, current_balance, min_payment, due_date")
      .eq("user_id", userId);
    if (ccData) setCreditCards(ccData);
  }, [supabase]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      await loadData(user.id);
      setLoading(false);
      // Auto-sync DISABLED. It was overwriting manual category corrections.
      // Use the "Sync from bank" button to manually sync.
    }
    init();

    // Listen for changes from other tabs/pages
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

  async function autoSyncRecurring(userId: string) {
    try {
      const res = await fetch("/api/plaid/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const result = await res.json().catch(() => ({}));
        if (result.income > 0) {
          setIncome(result.income);
          setIncomeInput(String(result.income));
        }
      }
    } catch (e) {
      console.error("Sync failed:", e);
    }
  }

  async function refreshRecurring() {
    if (!user) return;
    setSyncing(true);
    await autoSyncRecurring(user.id);
    setSyncing(false);
    // Force reload to pick up new data
    window.location.reload();
  }

  async function saveIncome(val: string) {
    const v = parseFloat(val) || 0;
    const prev = income;
    setIncome(v);
    setEditingIncome(false);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, monthly_income: v });
    if (error) {
      // Revert if save failed
      setIncome(prev);
      setIncomeInput(String(prev));
      console.error("saveIncome failed:", error.message);
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
      // sync populates transactions + recurring + income in one pass
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

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="text-gray-500">Loading...</div></div>;

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

  // Upcoming due in next 7 days
  const today = new Date();

  // Credit card upcoming payments
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
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .concat(creditUpcoming as any[])
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">

      {/* DEBUG BANNER */}
      {debugInfo && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <p className="text-sm font-bold text-red-400">Couldn't save that change</p>
            <button onClick={() => setDebugInfo(null)} className="text-xs text-gray-500 hover:text-white">close</button>
          </div>
          <p className="text-xs text-gray-400 mb-3">This item couldn't be moved. Your changes have been undone. If this keeps happening, contact support.</p>
          <details className="group">
            <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400 select-none">Show details</summary>
            <pre className="mt-2 text-xs text-gray-500 whitespace-pre-wrap font-mono overflow-auto max-h-48">{debugInfo}</pre>
          </details>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Hey, <span className="gradient-text">{profileName || user?.email?.split("@")[0]}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-400">Here's your financial snapshot.</p>
      </div>

      <HelpTip
        storageKey="dashboard_welcome"
        title="Start here — set your monthly income"
        body={
          <>
            <p>This is your financial command center. Tap <span className="text-white font-medium">Set income</span> above to enter your monthly take-home pay — that&apos;s your paycheck after taxes, not your salary.</p>
            <p className="mt-1">Once you set it, the progress bar shows exactly how much of your income goes to bills, subscriptions, and credit card minimums — and what&apos;s left over to save or spend freely. The bar turns yellow at 70% and red at 90%.</p>
          </>
        }
      />

      {/* Income hero */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
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
              <button onClick={() => { setEditingIncome(true); setIncomeInput(income ? String(income) : ""); }} className="text-left group">
                <span className="text-3xl font-black">{income > 0 ? fmt(income) : <span className="text-gray-500">Set income</span>}</span>
                <span className="ml-2 text-xs text-brand opacity-0 group-hover:opacity-100 transition">edit</span>
              </button>
            )}
          </div>
          {income > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">{spendPct}% used</p>
              <p className={`text-lg font-bold ${remaining < 0 ? "text-red-400" : "text-brand"}`}>
                {remaining < 0 ? "-" : "+"}{fmt(Math.abs(remaining))} {remaining < 0 ? "over" : "left"}
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
              <span>{fmt(totalSpend)} tracked spend</span>
              <span>{fmt(income)} income</span>
            </div>
          </div>
        )}

        {/* Bank connect */}
        <div className="mt-4 border-t border-white/5 pt-4">
          {detectingIncome ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={14} className="animate-spin text-brand" /> Detecting your income…
            </div>
          ) : plaidConnected ? (
            <div className="flex items-center gap-2 text-sm text-brand"><Check size={14} /> Bank connected · Income auto-detected</div>
          ) : linkToken && plaidReady ? (
            <button onClick={() => openPlaid()} className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-bold text-black hover:opacity-90">
              <Landmark size={14} /> Open Bank Login
            </button>
          ) : (
            <button onClick={createLinkToken} className="flex items-center gap-2 rounded-xl border border-brand/30 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand hover:bg-brand/15">
              <Landmark size={14} /> Auto-detect income from bank
            </button>
          )}
        </div>
      </div>

      {user && <PriceChangeAlert userId={user.id} />}

      {/* Upcoming recurring charges from Plaid */}
      <UpcomingCharges />

      {/* Upgrade banner — hidden for Pro users */}
      <UpgradeBanner />

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Subscriptions" value={fmt(subsTotal)} sub={`${subs.length} active`} color={TYPE_COLORS.subscription} onClick={() => setActiveCard({ label: "Subscriptions", color: TYPE_COLORS.subscription, filterType: "subscription" })} />
        <StatCard label="Bills" value={fmt(billsTotal)} sub={`${bills.length} tracked`} color={TYPE_COLORS.bill} onClick={() => setActiveCard({ label: "Bills", color: TYPE_COLORS.bill, filterType: "bill" })} />
        <StatCard label="Expenses" value={fmt(expensesTotal)} sub={`${expenses.length} tracked`} color={TYPE_COLORS.expense} onClick={() => setActiveCard({ label: "Expenses", color: TYPE_COLORS.expense, filterType: "expense" as any })} />
        <StatCard label="Monthly Total" value={fmt(totalSpend)} sub={`${items.length} items + credit`} color="#AF52DE" onClick={() => setActiveCard({ label: "All Items", color: "#AF52DE", filterType: "all" })} />
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

      {activeCard && (
        <ItemsModal
          label={activeCard.label}
          color={activeCard.color}
          items={activeCard.filterType === "all" ? items : items.filter(i => i.type === activeCard.filterType)}
          onClose={() => setActiveCard(null)}
          onTypeChange={moveItemType}
        />
      )}

      {/* Donut + Upcoming row */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">

        {/* Donut breakdown */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500">Spend Breakdown</p>
          {donutData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={32} outerRadius={50} paddingAngle={2} dataKey="value">
                    {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
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
            <div className="flex h-24 items-center justify-center">
              <p className="text-sm text-gray-500">No items yet — add from Manual Entries.</p>
            </div>
          )}
        </div>

        {/* Upcoming */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500">Due This Week</p>
          {upcoming.length === 0 ? (
            <div className="flex h-24 items-center justify-center">
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
                  <div className="text-right">
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

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          onClick={() => router.push("/manual")}
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 text-left hover:bg-white/[0.04] transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 border border-brand/20">
              <Repeat size={16} className="text-brand" />
            </div>
            <div>
              <p className="font-semibold">Manual Entries</p>
              <p className="text-xs text-gray-500">{items.filter(i => !i.source || i.source === "manual").length} items tracked</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-600" />
        </button>

        <button
          onClick={() => router.push("/bank")}
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 text-left hover:bg-white/[0.04] transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Landmark size={16} className="text-blue-400" />
            </div>
            <div className="flex items-center gap-2">
              <div>
                <p className="font-semibold">Bank Connected</p>
                <p className="text-xs text-gray-500">{isPro ? "Auto-imported entries" : "Upgrade to Pro"}</p>
              </div>
              {isPro && <span className="rounded-full bg-yellow-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-yellow-400">Pro</span>}
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-600" />
        </button>

        <button
          onClick={() => router.push("/credit")}
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 text-left hover:bg-white/[0.04] transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/20">
              <CreditCard size={16} className="text-[#38BDF8]" />
            </div>
            <div>
              <p className="font-semibold">Credit Cards</p>
              <p className="text-xs text-gray-500">Track balances & utilization</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-600" />
        </button>
      </div>

      {user && <HealthScore userId={user.id} />}
    </div>
  );
}
