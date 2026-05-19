"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Plus, X, Target, CreditCard, Shield, Pencil, Check } from "lucide-react";
import HelpTip from "@/components/HelpTip";

interface Item {
  id: string;
  name: string;
  amount: number;
  type: "subscription" | "bill" | "trial" | "expense";
}

interface Goal {
  id: number;
  label: string;
  target: number;
  priority: "high" | "medium" | "low";
  deadline?: string;
  current_saved?: number;
}

const PRIORITY = {
  high:   { label: "High",   color: "#FF3B30", bg: "#FF3B3015" },
  medium: { label: "Medium", color: "#FFB300", bg: "#FFB30015" },
  low:    { label: "Low",    color: "#00C853", bg: "#00C85315" },
};

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function BudgetPage() {
  const router = useRouter();
  const supabase = createClient();

  const [items, setItems] = useState<Item[]>([]);
  const [creditCards, setCreditCards] = useState<{ id: string; name: string; min_payment: number | null; current_balance: number }[]>([]);
  const [income, setIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [goalLabel, setGoalLabel] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalPriority, setGoalPriority] = useState<"high" | "medium" | "low">("medium");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [goalCurrentSaved, setGoalCurrentSaved] = useState("");
  const [emergencySavings, setEmergencySavings] = useState(0);
  const [editingEF, setEditingEF] = useState(false);
  const [efInput, setEfInput] = useState("");
  const [efSaving, setEfSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      setUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("monthly_income, emergency_savings")
        .eq("id", user.id)
        .single();
      if (profile?.emergency_savings) setEmergencySavings(profile.emergency_savings);

      // 1. Try bank transactions first (most accurate — real deposits this month)
      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);
      thisMonthStart.setHours(0, 0, 0, 0);
      const since = thisMonthStart.toISOString().slice(0, 10);

      const { data: txns } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user.id)
        .gt("amount", 0)
        .gte("date", since);

      const bankIncome = txns && txns.length > 0
        ? Math.round(txns.reduce((sum, t) => sum + Number(t.amount), 0))
        : 0;

      // 2. Fall back to income_entries (manually added income)
      const { data: incomeEntries } = await supabase
        .from("income_entries")
        .select("amount, frequency")
        .eq("user_id", user.id);

      function toMonthly(amount: number, freq: string) {
        if (freq === "biweekly") return amount * 26 / 12;
        if (freq === "weekly") return amount * 52 / 12;
        if (freq === "one-time") return 0;
        return amount;
      }

      const entriesTotal = (incomeEntries || [])
        .filter((e: any) => e.frequency !== "one-time")
        .reduce((sum: number, e: any) => sum + toMonthly(e.amount, e.frequency), 0);

      // 3. Final fallback: profile field
      const resolvedIncome = bankIncome > 0 ? bankIncome : entriesTotal > 0 ? entriesTotal : (profile?.monthly_income || 0);
      setIncome(resolvedIncome);

      const { data: itemsData } = await supabase
        .from("items")
        .select("id, name, amount, type")
        .eq("user_id", user.id)
        .neq("type", "expense");
      if (itemsData) setItems(itemsData as Item[]);

      const { data: ccData } = await supabase
        .from("credit_cards")
        .select("id, name, min_payment, current_balance")
        .eq("user_id", user.id);
      if (ccData) setCreditCards(ccData);

      try {
        const stored = localStorage.getItem("budget_goals_v2");
        if (stored) setGoals(JSON.parse(stored));
      } catch {}

      setLoading(false);
    }
    load();
  }, []);

  function saveGoals(updated: Goal[]) {
    setGoals(updated);
    try { localStorage.setItem("budget_goals_v2", JSON.stringify(updated)); } catch {}
  }

  function addGoal() {
    if (!goalLabel || !goalAmount) return;
    const g: Goal = {
      id: Date.now(),
      label: goalLabel,
      target: parseFloat(goalAmount),
      priority: goalPriority,
      deadline: goalDeadline || undefined,
      current_saved: goalCurrentSaved ? parseFloat(goalCurrentSaved) : undefined,
    };
    saveGoals([...goals, g]);
    setGoalLabel(""); setGoalAmount(""); setGoalPriority("medium");
    setGoalDeadline(""); setGoalCurrentSaved(""); setModalOpen(false);
  }

  async function saveEmergencyFund() {
    if (!userId) return;
    const val = parseFloat(efInput) || 0;
    setEfSaving(true);
    await supabase.from("profiles").update({ emergency_savings: val }).eq("id", userId);
    setEmergencySavings(val);
    setEditingEF(false);
    setEfSaving(false);
  }

  function removeGoal(id: number) {
    saveGoals(goals.filter(g => g.id !== id));
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="text-gray-500">Loading...</div></div>;

  const subs = items.filter(i => i.type === "subscription");
  const bills = items.filter(i => i.type === "bill");
  const trials = items.filter(i => i.type === "trial");

  const subsTotal = subs.reduce((a, b) => a + b.amount, 0);
  const billsTotal = bills.reduce((a, b) => a + b.amount, 0);
  const trialsTotal = trials.reduce((a, b) => a + b.amount, 0);
  const creditMinTotal = creditCards.reduce((s, c) => s + (c.min_payment || 0), 0);
  const creditBalanceTotal = creditCards.reduce((s, c) => s + (c.current_balance || 0), 0);
  const totalSpend = subsTotal + billsTotal + trialsTotal + creditMinTotal;
  const remaining = income - totalSpend;
  const spendPct = income > 0 ? Math.min((totalSpend / income) * 100, 100) : 0;

  const healthColor = spendPct < 30 ? "#00C853" : spendPct < 50 ? "#FFB300" : "#FF3B30";
  const healthLabel = spendPct < 30 ? "Healthy" : spendPct < 50 ? "Watch it" : "Over budget";

  const sortedGoals = [...goals].sort((a, b) => {
    const order = { high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });

  const monthsToGoal = (target: number, currentSaved = 0) => {
    const needed = Math.max(target - currentSaved, 0);
    return remaining > 0 ? Math.ceil(needed / remaining) : null;
  };

  function completionDate(months: number | null) {
    if (months === null) return null;
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  const monthlyExpenses = subsTotal + billsTotal + trialsTotal + creditMinTotal;
  const efMonths = monthlyExpenses > 0 ? emergencySavings / monthlyExpenses : 0;
  const efColor = efMonths >= 6 ? "#00C853" : efMonths >= 3 ? "#FFB300" : "#FF3B30";
  const efLabel = efMonths >= 6 ? "Solid — 6+ months covered" : efMonths >= 3 ? "Getting there — aim for 6 months" : emergencySavings > 0 ? "Low — build toward 3 months" : "Not started";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Budget</h1>
        <p className="mt-1 text-sm text-gray-400">Your income vs. what you&apos;re spending.</p>
      </div>

      <HelpTip
        storageKey="budget_explainer"
        title="How to read your budget"
        color="#00C853"
        body={
          <>
            <p>The bar compares your total fixed spending (bills + subscriptions + credit minimums) against your monthly income. <span className="text-[#00C853] font-semibold">Green</span> means you&apos;re in good shape — under 50% spent. <span className="text-[#FFB300] font-semibold">Yellow</span> is 50–70% — watch it. <span className="text-red-400 font-semibold">Red</span> is over 70% — time to cut something.</p>
            <p className="mt-1">The <span className="text-white font-medium">money left over</span> is what&apos;s available for food, fun, and saving. A healthy rule of thumb: try to keep at least 20% of your income unspoken for savings.</p>
            <p className="mt-1"><span className="text-white font-medium">Savings goals</span> below show how many months it would take to reach each target using your leftover amount — so you can see exactly when you&apos;d hit your vacation fund, emergency fund, or anything else.</p>
          </>
        }
      />

      {/* Income vs Spend */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Monthly Income</p>
            <p className="font-mono text-3xl font-black">{income > 0 ? fmt(income) : <span className="text-gray-500">Not set</span>}</p>
          </div>
          <div className="text-right">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Total Spent</p>
            <p className="font-mono text-3xl font-black" style={{ color: healthColor }}>{fmt(totalSpend)}</p>
          </div>
        </div>

        <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${spendPct}%`, background: healthColor }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-bold" style={{ color: healthColor }}>{healthLabel} · {Math.round(spendPct)}% of income</span>
          <span className="text-gray-400">{fmt(remaining)} left</span>
        </div>

        {income === 0 && (
          <p className="mt-4 text-center text-sm text-gray-500">
            Connect your bank on the Bank page to auto-detect income.
          </p>
        )}
      </div>

      {/* Category cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Subscriptions", amount: subsTotal, color: "#00C853", count: subs.length },
          { label: "Bills",         amount: billsTotal, color: "#FFB300", count: bills.length },
          { label: "Trials",        amount: trialsTotal, color: "#38BDF8", count: trials.length },
          { label: "Credit Pmts",   amount: creditMinTotal, color: "#38BDF8", count: creditCards.length },
        ].map(cat => (
          <div key={cat.label} className="rounded-2xl border bg-white/[0.02] p-4" style={{ borderColor: cat.color + "38" }}>
            <div className="mb-2 h-2 w-2 rounded-full" style={{ background: cat.color }} />
            <p className="font-mono text-lg font-black">{fmt(cat.amount)}</p>
            <p className="text-xs font-semibold text-gray-400">{cat.label}</p>
            <p className="text-xs font-bold" style={{ color: cat.color }}>{cat.count} items</p>
          </div>
        ))}
      </div>

      {/* Spending breakdown */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <p className="mb-4 font-bold">Spending Breakdown</p>
        {[
          { label: "Subscriptions",   amount: subsTotal,      color: "#00C853" },
          { label: "Bills",           amount: billsTotal,     color: "#FFB300" },
          { label: "Trials",          amount: trialsTotal,    color: "#38BDF8" },
          { label: "Credit Payments", amount: creditMinTotal, color: "#38BDF8" },
        ].map(row => (
          <div key={row.label} className="mb-4 last:mb-0">
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="font-semibold">{row.label}</span>
              <span className="font-mono text-gray-400">{fmt(row.amount)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: totalSpend > 0 ? `${(row.amount / totalSpend) * 100}%` : "0%", background: row.color }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {totalSpend > 0 ? Math.round((row.amount / totalSpend) * 100) : 0}% of total spend
            </p>
          </div>
        ))}
      </div>

      {/* Credit card debt snapshot */}
      {creditCards.length > 0 && (
        <div className="mb-6 rounded-2xl border border-[#38BDF8]/20 bg-[#38BDF8]/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-[#38BDF8]" />
              <p className="font-bold text-white">Credit Card Debt</p>
            </div>
            <p className="text-lg font-black text-white">{fmt(creditBalanceTotal)}</p>
          </div>
          <div className="space-y-2">
            {creditCards.map(c => {
              const pct = c.current_balance && creditBalanceTotal > 0
                ? Math.round((c.current_balance / creditBalanceTotal) * 100) : 0;
              return (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{c.name}</span>
                  <div className="text-right">
                    <span className="font-semibold text-white">{fmt(c.current_balance || 0)}</span>
                    {c.min_payment ? <span className="text-xs text-gray-500 ml-2">min {fmt(c.min_payment)}/mo</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Emergency Fund Tracker */}
      <div className="mb-6 rounded-2xl border overflow-hidden" style={{ borderColor: efColor + "30", background: efColor + "06" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Shield size={15} style={{ color: efColor }} />
            <p className="font-bold text-white">Emergency Fund</p>
          </div>
          <button
            onClick={() => { setEfInput(String(emergencySavings || "")); setEditingEF(v => !v); }}
            className="rounded-lg p-1.5 text-gray-500 hover:text-white"
          >
            <Pencil size={14} />
          </button>
        </div>
        <div className="p-5">
          {editingEF ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  autoFocus
                  type="number"
                  value={efInput}
                  onChange={e => setEfInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveEmergencyFund(); }}
                  placeholder="0"
                  className="w-full rounded-xl border border-white/10 bg-black/30 pl-7 pr-3 py-2.5 text-sm outline-none focus:border-brand/50 font-mono font-bold"
                />
              </div>
              <button
                onClick={saveEmergencyFund}
                disabled={efSaving}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition"
                style={{ background: efColor + "20", color: efColor }}
              >
                <Check size={13} /> Save
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-end gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Saved</p>
                  <p className="font-mono text-2xl font-black" style={{ color: efColor }}>{fmt(emergencySavings)}</p>
                </div>
                <div className="pb-1">
                  <p className="text-xs text-gray-500 mb-0.5">Covers</p>
                  <p className="font-mono text-lg font-bold text-white">{efMonths.toFixed(1)} mo</p>
                </div>
              </div>
              <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((efMonths / 6) * 100, 100)}%`, background: efColor }}
                />
              </div>
              <p className="text-xs" style={{ color: efColor }}>{efLabel}</p>
              {emergencySavings === 0 && (
                <button
                  onClick={() => { setEfInput(""); setEditingEF(true); }}
                  className="mt-3 text-xs font-semibold underline underline-offset-2"
                  style={{ color: efColor }}
                >
                  Add your emergency savings amount
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Savings Goals */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Savings Goals</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-brand/10 px-4 py-2 text-sm font-bold text-brand hover:bg-brand/20"
        >
          <Plus size={15} /> Add
        </button>
      </div>

      {sortedGoals.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-12 text-center">
          <Target size={32} className="mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400">No savings goals yet.</p>
          <button onClick={() => setModalOpen(true)} className="mt-4 rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-semibold text-black hover:opacity-90">
            Add your first goal
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedGoals.map(g => {
            const p = PRIORITY[g.priority || "medium"];
            const saved = g.current_saved || 0;
            const months = monthsToGoal(g.target, saved);
            const pctSaved = Math.min((saved / g.target) * 100, 100);
            const cd = completionDate(months);
            return (
              <div key={g.id} className="rounded-2xl border bg-white/[0.02] p-5" style={{ borderColor: p.color + "35" }}>
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold">{g.label}</p>
                      <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: p.bg, color: p.color }}>
                        {p.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-400">
                      {saved > 0 ? <>{fmt(saved)} <span className="text-gray-600">of</span> {fmt(g.target)}</> : <>Target: {fmt(g.target)}</>}
                    </p>
                    {g.deadline && <p className="text-xs text-gray-600 mt-0.5">Deadline: {new Date(g.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    {cd && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-brand">{cd}</p>
                        <p className="text-xs text-gray-500">est. done</p>
                      </div>
                    )}
                    <button onClick={() => removeGoal(g.id)} className="rounded-lg p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400">
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className="mb-1.5 h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pctSaved}%`, background: p.color }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {Math.round(pctSaved)}% saved · {months !== null ? `${months} months to go at ${fmt(Math.max(remaining, 0))}/mo` : "Set income to project timeline"}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">New Savings Goal</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <input
                autoFocus
                value={goalLabel}
                onChange={e => setGoalLabel(e.target.value)}
                placeholder="Goal name (e.g. Vacation Fund)"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-brand"
              />
              <input
                type="number"
                value={goalAmount}
                onChange={e => setGoalAmount(e.target.value)}
                placeholder="Target amount (e.g. 2000)"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-brand"
              />
              <input
                type="number"
                value={goalCurrentSaved}
                onChange={e => setGoalCurrentSaved(e.target.value)}
                placeholder="Already saved (optional, e.g. 500)"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-brand"
              />
              <div>
                <p className="mb-1 text-xs font-semibold text-gray-500 uppercase tracking-widest">Target deadline (optional)</p>
                <input
                  type="date"
                  value={goalDeadline}
                  onChange={e => setGoalDeadline(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-brand text-white"
                  style={{ colorScheme: "dark" }}
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-bold">Priority Level</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["high", "medium", "low"] as const).map(key => {
                    const p = PRIORITY[key];
                    return (
                      <button
                        key={key}
                        onClick={() => setGoalPriority(key)}
                        className="rounded-xl py-2.5 text-sm font-bold transition"
                        style={{
                          border: `2px solid ${goalPriority === key ? p.color : "rgba(255,255,255,0.1)"}`,
                          background: goalPriority === key ? p.bg : "transparent",
                          color: goalPriority === key ? p.color : "#8E8E93",
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 rounded-xl border border-white/10 py-3 text-sm hover:bg-white/5">
                Cancel
              </button>
              <button
                onClick={addGoal}
                disabled={!goalLabel || !goalAmount}
                className="flex-1 rounded-xl bg-brand-gradient py-3 text-sm font-bold text-black hover:opacity-90 disabled:opacity-40"
              >
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
