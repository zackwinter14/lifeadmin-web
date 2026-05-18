"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Plus, X, Target, CreditCard } from "lucide-react";
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

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("monthly_income")
        .eq("id", user.id)
        .single();
      if (profile?.monthly_income) setIncome(profile.monthly_income);

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
    const g: Goal = { id: Date.now(), label: goalLabel, target: parseFloat(goalAmount), priority: goalPriority };
    saveGoals([...goals, g]);
    setGoalLabel(""); setGoalAmount(""); setGoalPriority("medium"); setModalOpen(false);
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

  const monthsToGoal = (target: number) => remaining > 0 ? Math.ceil(target / remaining) : null;

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
          <button
            onClick={() => router.push("/profile")}
            className="mt-4 w-full rounded-xl border border-brand/30 bg-brand/5 py-2.5 text-sm font-semibold text-brand hover:bg-brand/10"
          >
            Set your income in Profile →
          </button>
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
            const months = monthsToGoal(g.target);
            return (
              <div key={g.id} className="rounded-2xl border bg-white/[0.02] p-5" style={{ borderColor: p.color + "35" }}>
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{g.label}</p>
                      <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: p.bg, color: p.color }}>
                        {p.label} Priority
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-400">Target: {fmt(g.target)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-brand">{months !== null ? `${months} mo` : "∞"}</p>
                      <p className="text-xs text-gray-500">to reach</p>
                    </div>
                    <button onClick={() => removeGoal(g.id)} className="rounded-lg p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400">
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className="mb-1.5 h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: remaining > 0 ? `${Math.min((remaining / g.target) * 100 * 2, 100)}%` : "0%", background: p.color }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {fmt(Math.max(remaining, 0))}/mo available · reach goal in {months !== null ? `${months} months` : "—"}
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
