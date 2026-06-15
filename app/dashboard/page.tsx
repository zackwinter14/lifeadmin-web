"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Plus, Landmark, Loader2, Check, RefreshCw, X, DollarSign, PiggyBank, ArrowRight } from "lucide-react";
import { usePlaidLink } from "react-plaid-link";
import SetupWizard from "@/components/SetupWizard";
import MerchantLogo from "@/components/MerchantLogo";

// ── Types ─────────────────────────────────────────────────────────────────────

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
  source: string | null;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  color: string;
  emoji: string;
}

interface UpcomingItem {
  id: string;
  name: string;
  amount: number;
  color: string;
  type: ItemType;
  due_date: string | null;
  autopay: boolean;
  daysUntil: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  subscription: "#a78bfa",
  bill: "#60a5fa",
  trial: "#38BDF8",
  expense: "#34d399",
};

const INCOME_KWS = [
  "va benefit", "va payment", "veteran", "disability", "social security",
  "ssa", "payroll", "direct deposit", "unemployment", "treasury", "government benefit",
];

const EXPENSE_CATS = [
  "Food & Dining", "Transport", "Shopping", "Entertainment",
  "Health", "Utilities", "Travel", "Education", "Other",
];

const COMMON_NAMES = [
  "Netflix", "Hulu", "Disney+", "HBO Max", "Peacock", "Paramount+", "Apple TV+",
  "Amazon Prime Video", "Spotify", "Apple Music", "Amazon Prime", "Costco Membership",
  "Adobe Creative Cloud", "Microsoft 365", "Google One", "iCloud", "Dropbox",
  "Gym Membership", "Planet Fitness", "Peloton", "DoorDash", "Uber Eats", "Instacart",
  "Uber", "Lyft", "Groceries", "Gas", "Electricity", "Water", "Internet",
  "Car Insurance", "Renters Insurance", "Health Insurance", "Student Loan",
  "Car Payment", "Mortgage", "Rent", "Coffee", "Dining Out",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(n: number) {
  if (n >= 1000) return "$" + (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return fmt(n);
}

function fmtDate(d: string | null) {
  if (!d) return null;
  try { return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
  catch { return null; }
}

// Local-time date string (YYYY-MM-DD) to avoid UTC offset flipping "today" to "tomorrow"
function localDateStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDayLabel(dateStr: string): string {
  const today = localDateStr();
  const yest  = localDateStr(new Date(Date.now() - 86400000));
  const label = new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  if (dateStr === today) return `Today — ${label}`;
  if (dateStr === yest)  return `Yesterday — ${label}`;
  return label;
}

function isIncomeTx(t: any): boolean {
  const cat = (t.category || "").toUpperCase();
  return cat.includes("INCOME") || cat.includes("TRANSFER_IN");
}

// Transactions to show in the expense feed — excludes income, account transfers, and P2P
function isExpenseFeedTx(t: any): boolean {
  if (t.amount >= 0) return false; // positive = income/refund, not an expense
  const cat = (t.category || "").toUpperCase();
  if (cat.includes("INCOME"))       return false;
  if (cat.includes("TRANSFER_IN"))  return false;
  if (cat.includes("TRANSFER_OUT")) return false; // account-to-account and P2P transfers
  return true;
}

function txCatColor(t: any): string {
  const cat = (t.category || "").toUpperCase();
  if (cat.includes("INCOME")) return "#3EA758";
  if (cat.includes("FOOD") || cat.includes("DINING") || cat.includes("RESTAURANT")) return "#f59e0b";
  if (cat.includes("TRAVEL") || cat.includes("TRANSPORT") || cat.includes("GAS") || cat.includes("FUEL")) return "#60a5fa";
  if (cat.includes("SHOP") || cat.includes("MERCHANDISE") || cat.includes("RETAIL")) return "#f87171";
  if (cat.includes("ENTERTAIN") || cat.includes("SUBSCRIPTION")) return "#a78bfa";
  if (cat.includes("HEALTH") || cat.includes("MEDICAL")) return "#34d399";
  if (cat.includes("UTILITIES") || cat.includes("BILL")) return "#60a5fa";
  return "#6b7280";
}

function txCatLabel(t: any): string {
  const raw = (t.category || "").toLowerCase();
  if (raw.includes("income") || raw.includes("transfer_in")) return "Income";
  if (raw.includes("groceries") || raw.includes("grocery")) return "Groceries";
  if (raw.includes("food") || raw.includes("dining") || raw.includes("restaurant")) return "Dining";
  if (raw.includes("gas") || raw.includes("fuel")) return "Gas";
  if (raw.includes("transport")) return "Transport";
  if (raw.includes("travel")) return "Travel";
  if (raw.includes("shop") || raw.includes("merchandise") || raw.includes("retail")) return "Shopping";
  if (raw.includes("entertain")) return "Entertainment";
  if (raw.includes("subscription")) return "Subscription";
  if (raw.includes("health") || raw.includes("medical")) return "Health";
  if (raw.includes("utilities") || raw.includes("bill")) return "Bill";
  const parts = raw.split(/[_\s]+/).filter(Boolean);
  if (parts.length) return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  return "Other";
}

function txInitials(name: string): string {
  const words = (name || "?").trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (name || "?").slice(0, 2).toUpperCase();
}

function isTracked(txName: string, items: Item[]): boolean {
  const lc = (txName || "").toLowerCase().trim();
  if (lc.length < 3) return false;
  return items.some(i => {
    const name = i.name.toLowerCase().trim();
    const shorter = name.length < lc.length ? name : lc;
    const longer = name.length < lc.length ? lc : name;
    return shorter.length >= 4 && longer.includes(shorter);
  });
}

// ── MiniDonut ─────────────────────────────────────────────────────────────────

function MiniDonut({ subs, bills, expenses, income }: {
  subs: number; bills: number; expenses: number; income: number;
}) {
  const size = 44;
  const r = 17;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const total = subs + bills + expenses;
  const spentPct = income > 0 ? Math.min(Math.round((total / income) * 100), 100) : 0;

  const subsArc   = total > 0 ? (subs / total) * circ : 0;
  const billsArc  = total > 0 ? (bills / total) * circ : 0;
  const expArc    = total > 0 ? (expenses / total) * circ : 0;

  const subsRot  = 0;
  const billsRot = total > 0 ? (subs / total) * 360 : 0;
  const expRot   = total > 0 ? ((subs + bills) / total) * 360 : 0;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={5} />
        {total > 0 && <>
          {subsArc > 0 && (
            <circle cx={cx} cy={cx} r={r} fill="none" stroke="#a78bfa" strokeWidth={5}
              strokeDasharray={circ} strokeDashoffset={circ - subsArc} strokeLinecap="butt" opacity={0.9}
              style={{ transformOrigin: `${cx}px ${cx}px`, transform: `rotate(${subsRot}deg)` }} />
          )}
          {billsArc > 0 && (
            <circle cx={cx} cy={cx} r={r} fill="none" stroke="#60a5fa" strokeWidth={5}
              strokeDasharray={circ} strokeDashoffset={circ - billsArc} strokeLinecap="butt" opacity={0.9}
              style={{ transformOrigin: `${cx}px ${cx}px`, transform: `rotate(${billsRot}deg)` }} />
          )}
          {expArc > 0 && (
            <circle cx={cx} cy={cx} r={r} fill="none" stroke="#34d399" strokeWidth={5}
              strokeDasharray={circ} strokeDashoffset={circ - expArc} strokeLinecap="butt" opacity={0.9}
              style={{ transformOrigin: `${cx}px ${cx}px`, transform: `rotate(${expRot}deg)` }} />
          )}
        </>}
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff",
      }}>
        {total > 0 ? `${spentPct}%` : "—"}
      </div>
    </div>
  );
}

// ── SavingsStrip ──────────────────────────────────────────────────────────────

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
        className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-[#00C853]/20 bg-[#00C853]/5 px-5 py-4 transition hover:bg-[#00C853]/10"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00C853]/15">
            <PiggyBank size={18} style={{ color: "#00C853" }} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Start your first savings goal</p>
            <p className="text-xs text-gray-500">House, car, vacation, emergency fund</p>
          </div>
        </div>
        <ArrowRight size={16} className="shrink-0 text-[#00C853]" />
      </Link>
    );
  }

  return (
    <div className="mb-4 rounded-2xl border border-[#00C853]/15 bg-[#00C853]/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#00C853]">Savings Goals</p>
        <Link href="/save" className="text-[10px] font-semibold text-[#00C853] opacity-60 hover:opacity-100">
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {goals.slice(0, 4).map(goal => {
          const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
          const remaining = goal.targetAmount - goal.currentAmount;
          const monthsLeft = goal.monthlyContribution > 0 ? Math.ceil(remaining / goal.monthlyContribution) : null;
          return (
            <div key={goal.id}>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{goal.emoji}</span>
                  <span className="text-xs font-semibold text-white">{goal.name}</span>
                </div>
                <span className="text-[10px] text-gray-500">
                  <strong className="text-gray-300">{fmtShort(goal.currentAmount)}</strong>
                  {" "}/{" "}{fmtShort(goal.targetAmount)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: goal.color }} />
              </div>
              {monthsLeft !== null && (
                <p className="mt-1 text-[10px] text-gray-600">
                  {monthsLeft <= 0 ? "Goal reached!" : `~${monthsLeft} mo to go`}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── NameAutocomplete ──────────────────────────────────────────────────────────

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
  const cls = "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-white/20";
  return (
    <div className="relative" ref={ref}>
      <input autoFocus value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="e.g. Netflix, Groceries"
        className={cls}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] shadow-xl">
          {suggestions.map(s => (
            <button key={s} type="button"
              onMouseDown={() => { onChange(s); setOpen(false); }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AddExpenseModal ───────────────────────────────────────────────────────────

function AddExpenseModal({ userId, onClose, onSaved }: {
  userId: string; onClose: () => void; onSaved: (item: Item) => void;
}) {
  const supabase = createClient();
  const [form, setForm] = useState({ name: "", amount: "", category: EXPENSE_CATS[0], due_date: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cls = "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-white/20";

  async function save() {
    if (!form.name || !form.amount) return;
    setSaving(true); setError(null);
    const { data, error: err } = await supabase.from("items").insert({
      user_id: userId, name: form.name, amount: parseFloat(form.amount),
      category: form.category, due_date: form.due_date || null,
      type: "expense", status: "active", color: "#34d399", autopay: false,
    }).select().single();
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
                  placeholder="0.00" className={`${cls} pl-7`} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Date</label>
              <input type="date" value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className={cls} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={cls}>
              {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        {error && <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">{error}</div>}
        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-3 text-sm hover:bg-white/5">Cancel</button>
          <button onClick={save} disabled={saving || !form.name || !form.amount}
            className="flex-1 rounded-xl bg-[#3EA758] py-3 text-sm font-bold text-black hover:opacity-90 disabled:opacity-40">
            {saving ? "Saving..." : "Add Expense"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── BalanceBar ────────────────────────────────────────────────────────────────

function BalanceBar({
  isConnected, plaidBalance, balanceUpdatedAt, accountName, accountMask,
  income, spentThisMonth, onConnect, linkToken, plaidReady, detectingIncome, plaidJustConnected,
  updating, syncError, onRetry,
}: {
  isConnected: boolean;
  plaidBalance: number | null;
  balanceUpdatedAt: string | null;
  accountName: string | null;
  accountMask: string | null;
  income: number;
  spentThisMonth: number;
  onConnect: () => void;
  linkToken: string | null;
  plaidReady: boolean;
  detectingIncome: boolean;
  plaidJustConnected: boolean;
  updating: boolean;
  syncError: string | null;
  onRetry: () => void;
}) {
  if (isConnected) {
    const updatedLabel = balanceUpdatedAt
      ? "Updated " + new Date(balanceUpdatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      : null;

    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-white/7 bg-white/[0.025] px-6 py-5">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#3EA758]" />
            <span className="text-xs font-semibold text-[#8899bb]">
              {accountName || "Checking"}
              {accountMask ? ` ···· ${accountMask}` : ""}
            </span>
          </div>
          <div className="font-mono text-4xl font-black tracking-tight">
            {plaidBalance != null ? fmt(plaidBalance) : syncError ? (
              <div>
                <span className="text-base text-[#f87171]">Could not load balance</span>
                <button onClick={onRetry}
                  className="ml-3 rounded-md border border-white/15 bg-white/8 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/12">
                  Retry
                </button>
              </div>
            ) : (
              <span className="text-2xl text-gray-500">
                {updating ? "Loading balance..." : "Fetching balance..."}
              </span>
            )}
          </div>
          {updatedLabel && (
            <p className="mt-1 text-[10px] font-semibold text-[#3EA758]">{updatedLabel}</p>
          )}
          {syncError && !updating && (
            <p className="mt-1 text-[10px] text-[#f87171]">{syncError}</p>
          )}
        </div>
        <div className="flex gap-8">
          {spentThisMonth > 0 && (
            <div className="text-right">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#445566]">Spent This Month</p>
              <p className="font-mono text-xl font-black text-[#f87171]">-{fmt(spentThisMonth)}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Free / disconnected
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/7 bg-white/[0.025] px-6 py-5">
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600">Monthly Income</p>
        <p className="font-mono text-4xl font-black">{income > 0 ? fmt(income) : <span className="text-2xl text-gray-500">Set income</span>}</p>
        <p className="mt-1 text-xs text-gray-600">No bank connected · showing manual data only</p>
      </div>
      <div>
        {detectingIncome ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 size={14} className="animate-spin text-[#3EA758]" /> Detecting income...
          </div>
        ) : plaidJustConnected ? (
          <div className="flex items-center gap-2 text-sm text-[#3EA758]"><Check size={14} /> Bank connected</div>
        ) : linkToken && plaidReady ? (
          <button onClick={onConnect}
            className="flex items-center gap-2 rounded-xl bg-[#3EA758] px-5 py-2.5 text-sm font-bold text-black hover:opacity-90">
            <Landmark size={14} /> Open Bank Login
          </button>
        ) : (
          <button onClick={onConnect}
            className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-2.5 text-sm font-semibold text-indigo-400 hover:bg-indigo-500/15 transition">
            <Landmark size={14} /> Connect Bank — it&apos;s free
          </button>
        )}
      </div>
    </div>
  );
}

// ── TxRow ─────────────────────────────────────────────────────────────────────

function TxRow({ tx, items }: { tx: any; items: Item[] }) {
  const name = tx.clean_merchant_name || tx.merchant_name || tx.description || "Unknown";
  const income = isIncomeTx(tx);
  const tracked = !income && isTracked(name, items);
  const catColor = txCatColor(tx);
  const catLabel = txCatLabel(tx);
  const timeStr = tx.authorized_datetime || tx.datetime
    ? new Date(tx.authorized_datetime || tx.datetime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <div className="flex items-center gap-3 border-b border-white/[0.025] px-4 py-2.5 transition hover:bg-white/[0.025] last:border-0">
      <MerchantLogo name={name} color={catColor} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight">{name}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
            style={{ background: catColor + "18", color: catColor }}
          >
            {catLabel}
          </span>
          {tracked && (
            <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-500">
              Tracked
            </span>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className={`text-sm font-bold tabular-nums ${income ? "text-[#3EA758]" : "text-[#f87171]"}`}>
          {income ? "+" : "-"}{fmt(Math.abs(tx.amount))}
        </p>
        {timeStr && <p className="mt-0.5 text-[9px] text-gray-600">{timeStr}</p>}
      </div>
    </div>
  );
}

// ── TxFeedConnected ───────────────────────────────────────────────────────────

function TxFeedConnected({ transactions, items, updating, onUpdate, onLoadMore, hasMore }: {
  transactions: any[];
  items: Item[];
  updating: boolean;
  onUpdate: () => void;
  onLoadMore: () => void;
  hasMore: boolean;
}) {
  // Only show real expenses — exclude income, account transfers, P2P
  const feedTxs = transactions.filter(isExpenseFeedTx);

  // Group by date (transactions are already sorted date desc)
  const groups: { date: string; txs: any[]; daySpend: number }[] = [];
  for (const tx of feedTxs) {
    const last = groups[groups.length - 1];
    if (last && last.date === tx.date) {
      last.txs.push(tx);
      last.daySpend += Math.abs(tx.amount);
    } else {
      groups.push({ date: tx.date, txs: [tx], daySpend: Math.abs(tx.amount) });
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Live Activity</span>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#3EA758]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3EA758]" />
            Connected
          </div>
        </div>
        <button
          onClick={onUpdate}
          disabled={updating}
          className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-400 transition hover:border-white/15 hover:text-white disabled:opacity-50"
        >
          <RefreshCw size={10} className={updating ? "animate-spin" : ""} />
          {updating ? "Updating..." : "Update"}
        </button>
      </div>

      {/* Feed */}
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-gray-500">No transactions yet</p>
          <p className="mt-1 text-xs text-gray-600">Click Update to pull from your bank</p>
        </div>
      ) : feedTxs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-gray-500">No expense transactions in range</p>
          <p className="mt-1 text-xs text-gray-600">Income and transfers are filtered out</p>
        </div>
      ) : (
        <>
          {groups.map(group => (
            <div key={group.date}>
              <div className="flex items-center justify-between px-4 py-2 pt-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-700">
                  {fmtDayLabel(group.date)}
                </span>
                <span className="text-[9px] font-bold tabular-nums text-gray-600">
                  -{fmt(group.daySpend)}
                </span>
              </div>
              {group.txs.map((tx, i) => <TxRow key={tx.id || tx.plaid_transaction_id || i} tx={tx} items={items} />)}
            </div>
          ))}
          {hasMore && (
            <div className="border-t border-white/5 px-4 py-3 text-center">
              <button
                onClick={onLoadMore}
                className="text-xs font-semibold text-gray-600 transition hover:text-gray-300"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── TxFeedFree ────────────────────────────────────────────────────────────────

function TxFeedFree({ items, onConnectBank }: { items: Item[]; onConnectBank: () => void }) {
  const manualItems = items.filter(i => i.status !== "cancelled").slice(0, 10);
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Activity</span>
        <span className="rounded-md bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gray-600">
          Manual only
        </span>
      </div>

      {/* Nudge banner */}
      <div className="m-3 flex items-start gap-3 rounded-xl border border-indigo-500/18 bg-indigo-500/7 p-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-base">
          🏦
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">See every purchase automatically</p>
          <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
            Connect your bank and this feed fills with real transactions — live balance, every charge, auto-categorized.
          </p>
          <button
            onClick={onConnectBank}
            className="mt-2.5 rounded-lg border border-indigo-500/35 bg-indigo-500/15 px-3 py-1.5 text-xs font-bold text-indigo-400 transition hover:bg-indigo-500/25"
          >
            Connect Bank — it&apos;s free
          </button>
        </div>
      </div>

      {/* Manual items */}
      {manualItems.length > 0 && (
        <>
          <div className="px-4 pb-1 pt-2 text-[9px] font-bold uppercase tracking-widest text-gray-700">
            Manually added
          </div>
          {manualItems.map(item => (
            <div key={item.id} className="flex items-center gap-3 border-b border-white/[0.025] px-4 py-2.5 last:border-0">
              <MerchantLogo name={item.name} color={TYPE_COLORS[item.type] || "#888"} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.name}</p>
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                  style={{ background: (TYPE_COLORS[item.type] || "#888") + "18", color: TYPE_COLORS[item.type] || "#888" }}
                >
                  {item.type}
                </span>
              </div>
              <p className="flex-shrink-0 text-sm font-bold tabular-nums text-[#f87171]">
                -{fmt(item.amount)}
              </p>
            </div>
          ))}
        </>
      )}

      {manualItems.length === 0 && (
        <div className="pb-8 pt-4 text-center">
          <p className="text-xs text-gray-600">No items added yet</p>
          <Link href="/tracker" className="mt-1 block text-xs font-semibold text-indigo-400 hover:underline">
            Add from the tracker →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── TrackedSpending ───────────────────────────────────────────────────────────

function TrackedSpending({ items, monthlyTxTotal, income }: {
  items: Item[];
  monthlyTxTotal: number;
  income: number;
}) {
  const subs    = items.filter(i => i.type === "subscription" || i.type === "trial").reduce((s, i) => s + i.amount, 0);
  const bills   = items.filter(i => i.type === "bill").reduce((s, i) => s + i.amount, 0);
  const tracked = items.filter(i => i.type === "expense").reduce((s, i) => s + i.amount, 0);
  const expenses = tracked + monthlyTxTotal;
  const total   = subs + bills + expenses;
  const leftToSave = income > 0 ? income - total : null;

  const subsCount  = items.filter(i => i.type === "subscription" || i.type === "trial").length;
  const billsCount = items.filter(i => i.type === "bill").length;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Tracked Spending</span>
        <Link href="/tracker" className="text-[10px] font-semibold text-gray-500 transition hover:text-white">
          Tracker →
        </Link>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {[
          { label: "Subscriptions", count: `${subsCount} active`, amount: subs, color: "#a78bfa" },
          { label: "Bills", count: `${billsCount} tracked`, amount: bills, color: "#60a5fa" },
          { label: "Bank Expenses", count: "This month", amount: expenses, color: "#34d399" },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: row.color }} />
              <div>
                <p className="text-sm text-gray-200">{row.label}</p>
                <p className="text-[10px] text-gray-600">{row.count}</p>
              </div>
            </div>
            <p className="text-sm font-bold tabular-nums" style={{ color: row.color }}>{fmt(row.amount)}</p>
          </div>
        ))}
      </div>

      {/* Total row with mini donut */}
      <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-3">
          <MiniDonut subs={subs} bills={bills} expenses={expenses} income={income} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Monthly Total</p>
            <p className="text-lg font-black tabular-nums">{fmt(total)}</p>
          </div>
        </div>
        {leftToSave !== null && (
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600">of income</p>
            <p className={`text-sm font-bold ${leftToSave < 0 ? "text-[#f87171]" : "text-[#3EA758]"}`}>
              {leftToSave < 0 ? "-" : "+"}{fmt(Math.abs(leftToSave))} left
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── UpcomingChargesPanel ──────────────────────────────────────────────────────

function UpcomingChargesPanel({ upcoming, upcomingMonth }: {
  upcoming: UpcomingItem[];
  upcomingMonth: UpcomingItem[];
}) {
  const [view, setView] = useState<"week" | "month">("week");
  const list = view === "week" ? upcoming : upcomingMonth;
  const monthTotal = upcomingMonth.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Upcoming Charges</span>
        <div className="flex items-center gap-0.5 rounded-lg bg-white/[0.04] p-0.5">
          {(["week", "month"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="rounded-md px-3 py-1 text-[10px] font-bold capitalize transition"
              style={{
                background: view === v ? "rgba(255,255,255,0.08)" : "transparent",
                color: view === v ? "#fff" : "#666",
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-gray-600">
            {view === "week" ? "Nothing due in the next 7 days" : "Nothing due this month"}
          </p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-white/[0.04]">
            {list.map(item => {
              const urgency = item.daysUntil <= 2 ? "#f87171" : item.daysUntil <= 5 ? "#f59e0b" : "#6b7280";
              const bgUrgency = item.daysUntil <= 2 ? "rgba(239,68,68,0.12)" : item.daysUntil <= 5 ? "rgba(245,158,11,0.12)" : "rgba(107,114,128,0.08)";
              return (
                <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex h-10 w-10 flex-shrink-0 flex-col items-center justify-center rounded-xl text-center"
                    style={{ background: bgUrgency }}>
                    {view === "week" ? (
                      <>
                        <p className="text-sm font-black leading-none" style={{ color: urgency }}>
                          {item.daysUntil === 0 ? "Now" : `${item.daysUntil}d`}
                        </p>
                        <p className="text-[8px] font-semibold uppercase opacity-70" style={{ color: urgency }}>left</p>
                      </>
                    ) : (
                      <p className="text-[10px] font-black leading-tight" style={{ color: urgency }}>
                        {fmtDate(item.due_date) || `${item.daysUntil}d`}
                      </p>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="text-[10px] text-gray-600">
                      {item.due_date}
                      {item.autopay ? " · Autopay on" : " · No autopay"}
                    </p>
                  </div>
                  <p className="flex-shrink-0 text-sm font-bold tabular-nums" style={{ color: item.daysUntil <= 2 ? "#f87171" : "#ccc" }}>
                    {fmt(item.amount)}
                  </p>
                </div>
              );
            })}
          </div>
          {view === "month" && monthTotal > 0 && (
            <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.02] px-4 py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Month total</span>
              <span className="text-sm font-black tabular-nums">{fmt(monthTotal)}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser]                   = useState<any>(null);
  const [profileName, setProfileName]     = useState<string | null>(null);
  const [items, setItems]                 = useState<Item[]>([]);
  const [income, setIncome]               = useState(0);
  const [loading, setLoading]             = useState(true);
  const [isConnected, setIsConnected]     = useState(false);
  const [plaidBalance, setPlaidBalance]   = useState<number | null>(null);
  const [balanceUpdatedAt, setBalanceUpdatedAt] = useState<string | null>(null);
  const [accountName, setAccountName]     = useState<string | null>(null);
  const [accountMask, setAccountMask]     = useState<string | null>(null);
  const [transactions, setTransactions]   = useState<any[]>([]);
  const [txOffset, setTxOffset]           = useState(500);
  const [txHasMore, setTxHasMore]         = useState(true);
  const [monthlyTxTotal, setMonthlyTxTotal] = useState(0);
  const [creditCards, setCreditCards]     = useState<any[]>([]);
  const [recurringAll, setRecurringAll]   = useState<any[]>([]);
  const [updating, setUpdating]           = useState(false);
  const [linkToken, setLinkToken]         = useState<string | null>(null);
  const [detectingIncome, setDetectingIncome] = useState(false);
  const [plaidJustConnected, setPlaidJustConnected] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [showWizard, setShowWizard]       = useState(false);
  const [setupDone, setSetupDone]         = useState(false);
  const [debugInfo, setDebugInfo]         = useState<string | null>(null);
  const [syncError, setSyncError]         = useState<string | null>(null);
  const autoSyncFired = useRef(false);

  // ── Load data ───────────────────────────────────────────────────────────────

  const loadData = useCallback(async (userId: string) => {
    const since90 = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
    const todayStr = new Date().toISOString().slice(0, 10);
    const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

    const [profileRes, itemsRes, txRes, ccRes, recRes] = await Promise.all([
      // select("*") so the query doesn't break if optional columns (plaid_balance etc) haven't been migrated yet
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("items").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("transactions").select("*").eq("user_id", userId)
        .gte("date", since90).order("date", { ascending: false }).order("created_at", { ascending: false }).limit(500),
      supabase.from("credit_cards").select("*").eq("user_id", userId),
      supabase.from("recurring_transactions").select("*").eq("user_id", userId)
        .eq("is_active", true).not("next_predicted_date", "is", null)
        .gte("next_predicted_date", todayStr).lte("next_predicted_date", in30),
    ]);

    const profile = profileRes.data;
    if (profile) {
      if (profile.full_name)       setProfileName(profile.full_name);
      if (profile.monthly_income)  setIncome(profile.monthly_income);
      if (profile.plaid_access_token) setIsConnected(true);
      // Balance columns — may not exist yet, handled gracefully
      if ((profile as any).plaid_balance != null)             setPlaidBalance((profile as any).plaid_balance);
      if ((profile as any).plaid_balance_updated_at)          setBalanceUpdatedAt((profile as any).plaid_balance_updated_at);
      if ((profile as any).plaid_account_name)                setAccountName((profile as any).plaid_account_name);
      if ((profile as any).plaid_account_mask)                setAccountMask((profile as any).plaid_account_mask);
    }

    const allItems = ((itemsRes.data as Item[]) ?? []).filter(i => i.status !== "cancelled");
    setItems(allItems);
    setCreditCards(ccRes.data ?? []);
    setRecurringAll(recRes.data ?? []);

    // Transactions
    const txData = (txRes.data as any[]) ?? [];
    setTransactions(txData);
    setTxHasMore(txData.length === 500);

    // Monthly total for TrackedSpending (expenses only, current month)
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const monthExpenses = txData.filter(t => {
      if (t.date < monthStart) return false;
      if (t.amount >= 0) return false; // stored negative = expense
      const cat = (t.category || "").toUpperCase();
      return !cat.includes("INCOME") && !cat.includes("TRANSFER_IN");
    });
    setMonthlyTxTotal(monthExpenses.reduce((s: number, t: any) => s + Math.abs(t.amount), 0));
  }, [supabase]);

  // ── Init ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      const wizardDone = localStorage.getItem(`setup_wizard_done_${user.id}`) === "true";
      if (!wizardDone) setShowWizard(true);
      setSetupDone(wizardDone);
      await loadData(user.id);
      setLoading(false);

      channel = supabase.channel("dash-live-" + user.id)
        .on("postgres_changes", { event: "*", schema: "public", table: "items", filter: `user_id=eq.${user.id}` },
          () => loadData(user.id))
        .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` },
          () => loadData(user.id))
        .subscribe();
    }
    init();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  // Shared sync helper — always safe to call, never throws to the caller
  async function callSync(uid: string): Promise<boolean> {
    try {
      const res = await fetch("/api/plaid/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid }),
      });
      let data: any = {};
      try { data = await res.json(); } catch { /* empty body — handled below */ }
      if (!res.ok) {
        const msg = data?.error || `Sync error (${res.status})`;
        setSyncError(msg);
        setDebugInfo(msg);
        return false;
      }
      if (data.income > 0) setIncome(data.income);
      // balance_error means sync succeeded but balance fetch specifically failed
      if (data.balance_error) {
        setSyncError("Balance: " + data.balance_error);
      } else {
        setSyncError(null);
      }
      return true;
    } catch (e: any) {
      const msg = "Sync failed: " + (e?.message ?? "network error");
      setSyncError(msg);
      setDebugInfo(msg);
      return false;
    }
  }

  // Auto-sync once on page load when connected but balance hasn't been fetched yet
  useEffect(() => {
    if (!isConnected || plaidBalance !== null || !user || autoSyncFired.current) return;
    autoSyncFired.current = true;
    setUpdating(true);
    callSync(user.id)
      .then(ok => { if (ok) return loadData(user.id); })
      .finally(() => setUpdating(false));
  }, [isConnected, plaidBalance, user]);

  // ── Update button ─────────────────────────────────────────────────────────

  async function handleUpdate() {
    if (!user || updating) return;
    setSyncError(null);
    setUpdating(true);
    try {
      const ok = await callSync(user.id);
      if (ok) await loadData(user.id);
    } finally {
      setUpdating(false);
    }
  }

  // ── Load more transactions ────────────────────────────────────────────────

  async function loadMoreTx() {
    if (!user) return;
    const since90 = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
    const { data } = await supabase.from("transactions").select("*").eq("user_id", user.id)
      .gte("date", since90).order("date", { ascending: false }).range(txOffset, txOffset + 499);
    if (data && data.length > 0) {
      setTransactions(prev => [...prev, ...(data as any[])]);
      setTxOffset(prev => prev + 500);
      setTxHasMore(data.length === 500);
    } else {
      setTxHasMore(false);
    }
  }

  // ── Plaid connect ─────────────────────────────────────────────────────────

  async function createLinkToken() {
    if (!user) return;
    const res = await fetch("/api/plaid/create-link-token", {
      method: "POST", headers: { "Content-Type": "application/json" },
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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicToken, userId: user.id }),
      });
      const res = await fetch("/api/plaid/sync", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.income > 0) setIncome(data.income);
      setIsConnected(true);
      await loadData(user.id);
    } catch {}
    setDetectingIncome(false);
    setPlaidJustConnected(true);
    setLinkToken(null);
  }

  function handleConnectBank() {
    if (linkToken && plaidReady) { openPlaid(); return; }
    createLinkToken();
  }

  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: linkToken || "",
    onSuccess: (public_token) => onPlaidSuccess(public_token),
  });

  // When link token becomes ready, auto-open the modal
  useEffect(() => {
    if (linkToken && plaidReady) openPlaid();
  }, [linkToken, plaidReady]);

  // ── Upcoming charges ──────────────────────────────────────────────────────

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  function computeUpcoming(maxDays: number): UpcomingItem[] {
    const cutoff = new Date(Date.now() + maxDays * 86400000).toISOString().slice(0, 10);

    const fromItems: UpcomingItem[] = items
      .filter(i => i.due_date)
      .flatMap(i => {
        const n = parseInt(i.due_date!);
        if (isNaN(n)) return [];
        let d = new Date(today.getFullYear(), today.getMonth(), n);
        if (d.toISOString().slice(0, 10) < todayStr) d.setMonth(d.getMonth() + 1);
        const daysUntil = Math.ceil((d.getTime() - today.getTime()) / 86400000);
        if (daysUntil < 0 || daysUntil > maxDays) return [];
        const due_date = `${d.getMonth() + 1}/${d.getDate()}`;
        return [{ id: i.id, name: i.name, amount: i.amount, color: i.color, type: i.type, due_date, autopay: i.autopay, daysUntil }];
      });

    const fromCC: UpcomingItem[] = creditCards
      .filter(c => c.due_date)
      .flatMap(c => {
        const n = parseInt(c.due_date);
        if (isNaN(n)) return [];
        let d = new Date(today.getFullYear(), today.getMonth(), n);
        if (d.toISOString().slice(0, 10) < todayStr) d.setMonth(d.getMonth() + 1);
        const daysUntil = Math.ceil((d.getTime() - today.getTime()) / 86400000);
        if (daysUntil < 0 || daysUntil > maxDays) return [];
        return [{
          id: "cc_" + c.id, name: c.name + (c.last_four ? ` ···· ${c.last_four}` : ""),
          amount: (c.min_payment || c.current_balance || 0) as number,
          color: "#38BDF8", type: "bill" as ItemType,
          due_date: `${d.getMonth() + 1}/${d.getDate()}`,
          autopay: false, daysUntil,
        }];
      });

    const fromRec: UpcomingItem[] = recurringAll
      .filter(r => r.next_predicted_date && r.next_predicted_date <= cutoff)
      .filter(r => !INCOME_KWS.some(kw => (r.clean_merchant_name || r.merchant_name || "").toLowerCase().includes(kw)))
      .map(r => {
        const d = new Date(r.next_predicted_date + "T12:00:00");
        const daysUntil = Math.ceil((d.getTime() - today.getTime()) / 86400000);
        return {
          id: "rec_" + r.id, name: r.clean_merchant_name || r.merchant_name,
          amount: r.last_amount || r.average_amount || 0,
          color: TYPE_COLORS.bill, type: "bill" as ItemType,
          due_date: fmtDate(r.next_predicted_date),
          autopay: false, daysUntil,
        };
      });

    return [...fromItems, ...fromCC, ...fromRec]
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }

  const upcomingWeek  = computeUpcoming(7);
  const upcomingMonth = computeUpcoming(30);

  // ── Derived ───────────────────────────────────────────────────────────────

  const spentThisMonth = (() => {
    const subs  = items.filter(i => i.type === "subscription" || i.type === "trial").reduce((s, i) => s + i.amount, 0);
    const bills = items.filter(i => i.type === "bill").reduce((s, i) => s + i.amount, 0);
    const exp   = items.filter(i => i.type === "expense").reduce((s, i) => s + i.amount, 0);
    return subs + bills + exp + monthlyTxTotal;
  })();

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">

      {/* Setup banner */}
      {!setupDone && !showWizard && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-[#00C853]/20 bg-[#00C853]/5 p-4">
          <div>
            <p className="text-sm font-bold text-white">Finish setting up your account</p>
            <p className="mt-0.5 text-xs text-gray-500">Add your income, subscriptions, and bills to see your full picture.</p>
          </div>
          <button onClick={() => setShowWizard(true)}
            className="shrink-0 rounded-xl bg-[#00C853] px-4 py-2 text-xs font-bold text-black hover:opacity-90 transition">
            Resume setup
          </button>
        </div>
      )}

      {/* Debug banner */}
      {debugInfo && (
        <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-red-400">Something went wrong</p>
            <button onClick={() => setDebugInfo(null)} className="text-xs text-gray-500 hover:text-white">close</button>
          </div>
          <p className="mt-1 text-xs text-gray-500">{debugInfo}</p>
        </div>
      )}

      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">
          Hey, <span className="gradient-text">{profileName || user?.email?.split("@")[0]}</span>
        </h1>
        <button
          onClick={() => setAddExpenseOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-[#3EA758] px-4 py-2.5 text-sm font-bold text-black hover:opacity-90"
        >
          <Plus size={14} /> Add Expense
        </button>
      </div>

      {/* Balance bar */}
      <BalanceBar
        isConnected={isConnected}
        plaidBalance={plaidBalance}
        balanceUpdatedAt={balanceUpdatedAt}
        accountName={accountName}
        accountMask={accountMask}
        income={income}
        spentThisMonth={spentThisMonth}
        onConnect={handleConnectBank}
        linkToken={linkToken}
        plaidReady={plaidReady}
        detectingIncome={detectingIncome}
        plaidJustConnected={plaidJustConnected}
        updating={updating}
        syncError={syncError}
        onRetry={handleUpdate}
      />

      {/* Savings strip */}
      {user && <SavingsStrip userId={user.id} />}

      {/* Two-column body */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">

        {/* Left: activity feed */}
        {isConnected ? (
          <TxFeedConnected
            transactions={transactions}
            items={items}
            updating={updating}
            onUpdate={handleUpdate}
            onLoadMore={loadMoreTx}
            hasMore={txHasMore}
          />
        ) : (
          <TxFeedFree items={items} onConnectBank={handleConnectBank} />
        )}

        {/* Right: tracking panel */}
        <div className="flex flex-col gap-4">
          <TrackedSpending items={items} monthlyTxTotal={monthlyTxTotal} income={income} />
          <UpcomingChargesPanel upcoming={upcomingWeek} upcomingMonth={upcomingMonth} />
        </div>
      </div>

      {/* Modals */}
      {addExpenseOpen && user && (
        <AddExpenseModal
          userId={user.id}
          onClose={() => setAddExpenseOpen(false)}
          onSaved={item => {
            setItems(prev => [item, ...prev]);
            setAddExpenseOpen(false);
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
