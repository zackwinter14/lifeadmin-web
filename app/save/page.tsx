"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Plus, X, ChevronRight, ChevronLeft, Check, Target, TrendingUp, Calendar, DollarSign } from "lucide-react";
import SaveSubNav from "@/components/SaveSubNav";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SavingsGoal {
  id: string;
  name: string;
  category: string;
  color: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate: string | null;
  createdAt: string;
}

interface WizardState {
  step: number;
  category: string;
  name: string;
  color: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string;
  monthlyContribution: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GOAL_CATEGORIES = [
  { id: "house",     label: "House",           color: "#00C853", hint: "Down payment, mortgage payoff" },
  { id: "car",       label: "Car",             color: "#38BDF8", hint: "New car, down payment" },
  { id: "vacation",  label: "Vacation",        color: "#FF9800", hint: "Trip, flights, hotel" },
  { id: "emergency", label: "Emergency Fund",  color: "#FFB300", hint: "3-6 months of expenses" },
  { id: "education", label: "Education",       color: "#A855F7", hint: "Tuition, courses, certifications" },
  { id: "wedding",   label: "Wedding",         color: "#EC4899", hint: "Venue, catering, dress" },
  { id: "business",  label: "Business",        color: "#06B6D4", hint: "Startup costs, equipment" },
  { id: "custom",    label: "Something Else",  color: "#00C853", hint: "Your own goal" },
];

const QUICK_AMOUNTS = [50, 100, 200, 500];

const MOTIVATIONAL: Record<string, string[]> = {
  house:     ["Your dream home is getting closer.", "Every dollar brings you closer to the keys."],
  car:       ["Your next ride is within reach.", "Keep going — the open road is waiting."],
  vacation:  ["That trip is closer than you think.", "You're earning every adventure you'll take."],
  emergency: ["Peace of mind, one contribution at a time.", "Financial security is being built right now."],
  education: ["Investing in yourself always pays off.", "Your future self will thank you for this."],
  wedding:   ["Building toward your perfect day.", "Every contribution makes it more special."],
  business:  ["Your idea deserves the capital to launch.", "Building the foundation for your dreams."],
  custom:    ["Steady progress, one month at a time.", "You're making it happen."],
};

function getMotivation(category: string, pct: number): string {
  const msgs = MOTIVATIONAL[category] ?? MOTIVATIONAL.custom;
  if (pct >= 75) return "Almost there — finish strong!";
  if (pct >= 50) return "Halfway there. Keep it up!";
  if (pct >= 25) return msgs[1] ?? msgs[0];
  return msgs[0];
}

// ─── Math helpers ─────────────────────────────────────────────────────────────

function monthsToGoal(remaining: number, monthly: number): number | null {
  if (monthly <= 0 || remaining <= 0) return null;
  return Math.ceil(remaining / monthly);
}

function projectedDate(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function progressPct(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

function fmt(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDecimal(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all"
            style={{
              background: i < step ? "#00C853" : i === step ? "#00C853" : "rgba(255,255,255,0.08)",
              color: i <= step ? "#000" : "rgba(255,255,255,0.3)",
            }}
          >
            {i < step ? <Check size={13} strokeWidth={3} /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className="h-px flex-1 w-8" style={{ background: i < step ? "#00C853" : "rgba(255,255,255,0.1)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Wizard ───────────────────────────────────────────────────────────────────

const STEP_LABELS = ["Category", "Amounts", "Timeline", "Contribution"];

function NewGoalWizard({
  onSave,
  onCancel,
}: {
  onSave: (g: Omit<SavingsGoal, "id" | "createdAt">) => void;
  onCancel: () => void;
}) {
  const [w, setW] = useState<WizardState>({
    step: 0,
    category: "",
    name: "",
    color: "#00C853",
    targetAmount: "",
    currentAmount: "",
    targetDate: "",
    monthlyContribution: "",
  });

  const cat = GOAL_CATEGORIES.find(c => c.id === w.category);
  const target = parseFloat(w.targetAmount) || 0;
  const current = parseFloat(w.currentAmount) || 0;
  const monthly = parseFloat(w.monthlyContribution) || 0;
  const remaining = Math.max(0, target - current);
  const months = monthsToGoal(remaining, monthly);

  function next() { setW(s => ({ ...s, step: s.step + 1 })); }
  function back() { setW(s => ({ ...s, step: s.step - 1 })); }

  function canNext(): boolean {
    if (w.step === 0) return !!w.category && !!w.name.trim();
    if (w.step === 1) return target > 0;
    if (w.step === 2) return true; // timeline optional
    if (w.step === 3) return monthly > 0;
    return false;
  }

  function handleSave() {
    onSave({
      name: w.name.trim(),
      category: w.category,
      color: w.color,
      targetAmount: target,
      currentAmount: current,
      monthlyContribution: monthly,
      targetDate: w.targetDate || null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg rounded-t-3xl border border-white/10 bg-[#0d0d0d] p-6 sm:rounded-3xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Step {w.step + 1} of 4 — {STEP_LABELS[w.step]}
            </p>
            <h2 className="mt-0.5 text-xl font-bold text-white">
              {w.step === 0 && "What are you saving for?"}
              {w.step === 1 && "How much do you need?"}
              {w.step === 2 && "When do you want to get there?"}
              {w.step === 3 && "How much can you save per month?"}
            </h2>
          </div>
          <button onClick={onCancel} className="rounded-xl p-2 text-gray-500 hover:bg-white/5 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <StepIndicator step={w.step} total={4} />

        {/* Step 0: Category + Name */}
        {w.step === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {GOAL_CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setW(s => ({ ...s, category: c.id, color: c.color, name: c.id === "custom" ? s.name : c.label }))}
                  className="flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-all"
                  style={{
                    background: w.category === c.id ? `${c.color}15` : "rgba(255,255,255,0.02)",
                    borderColor: w.category === c.id ? `${c.color}60` : "rgba(255,255,255,0.08)",
                  }}
                >
                  <span className="text-sm font-semibold" style={{ color: w.category === c.id ? c.color : "#fff" }}>
                    {c.label}
                  </span>
                  <span className="text-[10px] text-gray-500 leading-tight">{c.hint}</span>
                </button>
              ))}
            </div>
            {w.category && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-400">Goal name</label>
                <input
                  autoFocus
                  value={w.name}
                  onChange={e => setW(s => ({ ...s, name: e.target.value }))}
                  placeholder={cat ? `e.g. ${cat.hint.split(",")[0]}` : "Name your goal"}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-white/20"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 1: Target + Current */}
        {w.step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-400">Target amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                <input
                  autoFocus
                  type="number"
                  min="0"
                  value={w.targetAmount}
                  onChange={e => setW(s => ({ ...s, targetAmount: e.target.value }))}
                  placeholder="20,000"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-8 pr-4 text-sm text-white outline-none focus:border-white/20"
                />
              </div>
              <p className="mt-1 text-xs text-gray-600">Total amount you want to save</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-400">Already saved (optional)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                <input
                  type="number"
                  min="0"
                  value={w.currentAmount}
                  onChange={e => setW(s => ({ ...s, currentAmount: e.target.value }))}
                  placeholder="0"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-8 pr-4 text-sm text-white outline-none focus:border-white/20"
                />
              </div>
              <p className="mt-1 text-xs text-gray-600">How much you have saved already toward this goal</p>
            </div>
            {target > 0 && (
              <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <p className="text-xs text-gray-500">Still need to save</p>
                <p className="text-xl font-black text-white">{fmt(Math.max(0, target - current))}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Timeline */}
        {w.step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Set a target date if you have a deadline, or skip this and we&apos;ll calculate it based on your contribution.
            </p>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-400">Target date (optional)</label>
              <input
                type="month"
                value={w.targetDate}
                onChange={e => setW(s => ({ ...s, targetDate: e.target.value }))}
                min={new Date().toISOString().slice(0, 7)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-white/20"
                style={{ colorScheme: "dark" }}
              />
            </div>
            {w.targetDate && (
              <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <p className="text-xs text-gray-500">Months until target</p>
                <p className="text-xl font-black text-white">
                  {Math.max(1, Math.round((new Date(w.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))} months
                </p>
              </div>
            )}
            <button
              onClick={next}
              className="w-full rounded-xl border border-white/10 py-2.5 text-sm text-gray-500 hover:border-white/20 hover:text-white transition"
            >
              Skip — I&apos;ll set a date later
            </button>
          </div>
        )}

        {/* Step 3: Monthly + Preview */}
        {w.step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-400">Monthly contribution</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                <input
                  autoFocus
                  type="number"
                  min="0"
                  value={w.monthlyContribution}
                  onChange={e => setW(s => ({ ...s, monthlyContribution: e.target.value }))}
                  placeholder="500"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-8 pr-4 text-sm text-white outline-none focus:border-white/20"
                />
              </div>
            </div>

            {/* Quick amounts */}
            <div className="flex gap-2">
              {[100, 200, 300, 500].map(n => (
                <button
                  key={n}
                  onClick={() => setW(s => ({ ...s, monthlyContribution: String(n) }))}
                  className="flex-1 rounded-xl border border-white/10 py-2 text-xs font-semibold text-gray-400 hover:border-white/20 hover:text-white transition"
                >
                  ${n}
                </button>
              ))}
            </div>

            {/* Projection preview */}
            {monthly > 0 && (
              <div
                className="rounded-xl border p-4"
                style={{ background: `${w.color}10`, borderColor: `${w.color}30` }}
              >
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: w.color }}>
                  Projection
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Monthly</p>
                    <p className="text-base font-black text-white">{fmt(monthly)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Months</p>
                    <p className="text-base font-black text-white">
                      {months !== null ? months : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Finish by</p>
                    <p className="text-base font-black text-white">
                      {months !== null ? projectedDate(months) : "—"}
                    </p>
                  </div>
                </div>
                {months !== null && (
                  <p className="mt-3 text-center text-xs text-gray-500">
                    {getMotivation(w.category, progressPct(current, target))}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer nav */}
        <div className="mt-6 flex gap-3">
          {w.step > 0 && w.step < 3 && (
            <button
              onClick={back}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-gray-400 hover:border-white/20 hover:text-white transition"
            >
              <ChevronLeft size={14} /> Back
            </button>
          )}
          {w.step < 3 && (
            <button
              onClick={next}
              disabled={!canNext()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition disabled:opacity-30"
              style={{ background: w.color || "#00C853", color: "#000" }}
            >
              Continue <ChevronRight size={14} />
            </button>
          )}
          {w.step === 3 && (
            <div className="flex w-full gap-3">
              <button
                onClick={back}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-gray-400 hover:border-white/20 hover:text-white transition"
              >
                <ChevronLeft size={14} /> Back
              </button>
              <button
                onClick={handleSave}
                disabled={!canNext()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition disabled:opacity-30"
                style={{ background: w.color || "#00C853", color: "#000" }}
              >
                <Check size={15} strokeWidth={3} /> Create Goal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add Money Modal ──────────────────────────────────────────────────────────

function AddMoneyModal({
  goal,
  onAdd,
  onClose,
}: {
  goal: SavingsGoal;
  onAdd: (amount: number) => void;
  onClose: () => void;
}) {
  const [custom, setCustom] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const finalAmount = selected ?? (parseFloat(custom) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-sm rounded-t-3xl border border-white/10 bg-[#0d0d0d] p-6 sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Adding to</p>
            <h3 className="text-lg font-bold text-white">{goal.name}</h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-500 hover:bg-white/5 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map(n => (
            <button
              key={n}
              onClick={() => { setSelected(n); setCustom(""); }}
              className="rounded-xl border py-2.5 text-sm font-bold transition"
              style={{
                background: selected === n ? `${goal.color}20` : "rgba(255,255,255,0.03)",
                borderColor: selected === n ? `${goal.color}60` : "rgba(255,255,255,0.08)",
                color: selected === n ? goal.color : "#fff",
              }}
            >
              ${n}
            </button>
          ))}
        </div>

        <div className="mb-4 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
          <input
            type="number"
            min="0"
            value={custom}
            onChange={e => { setCustom(e.target.value); setSelected(null); }}
            placeholder="Custom amount"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-8 pr-4 text-sm text-white outline-none focus:border-white/20"
          />
        </div>

        <button
          onClick={() => { if (finalAmount > 0) { onAdd(finalAmount); onClose(); } }}
          disabled={finalAmount <= 0}
          className="w-full rounded-xl py-3 text-sm font-bold transition disabled:opacity-30"
          style={{ background: goal.color, color: "#000" }}
        >
          Add {finalAmount > 0 ? fmtDecimal(finalAmount) : "Money"}
        </button>
      </div>
    </div>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  onAddMoney,
  onDelete,
}: {
  goal: SavingsGoal;
  onAddMoney: () => void;
  onDelete: () => void;
}) {
  const pct = progressPct(goal.currentAmount, goal.targetAmount);
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const months = monthsToGoal(remaining, goal.monthlyContribution);
  const isComplete = goal.currentAmount >= goal.targetAmount;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02]">
      {/* Color header strip */}
      <div
        className="relative px-5 py-4"
        style={{ background: `linear-gradient(135deg, ${goal.color}25, ${goal.color}10)` }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: goal.color }}>
              {GOAL_CATEGORIES.find(c => c.id === goal.category)?.label ?? goal.category}
            </p>
            <h3 className="mt-0.5 text-lg font-black text-white">{goal.name}</h3>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Saved</p>
            <p className="text-xl font-black text-white">{fmt(goal.currentAmount)}</p>
            <p className="text-xs text-gray-500">of {fmt(goal.targetAmount)}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: goal.color }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-gray-500">
          <span>{pct}% complete</span>
          <span>{fmt(remaining)} left</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-white/8 border-t border-white/8">
        <div className="px-4 py-3 text-center">
          <p className="text-[10px] text-gray-600">Monthly</p>
          <p className="text-sm font-bold text-white">{fmt(goal.monthlyContribution)}</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-[10px] text-gray-600">Finish by</p>
          <p className="text-sm font-bold text-white">
            {isComplete
              ? "Done"
              : months !== null
              ? projectedDate(months)
              : goal.targetDate
              ? new Date(goal.targetDate + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" })
              : "—"}
          </p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-[10px] text-gray-600">On track</p>
          <p className="text-sm font-bold" style={{ color: goal.monthlyContribution > 0 ? "#00C853" : "#888" }}>
            {goal.monthlyContribution > 0 ? "Yes" : "Set contrib."}
          </p>
        </div>
      </div>

      {/* Motivation + actions */}
      <div className="flex items-center justify-between border-t border-white/8 px-4 py-3">
        <p className="text-xs text-gray-500">{isComplete ? "Goal reached! Consider setting a new target." : getMotivation(goal.category, pct)}</p>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <button
            onClick={onAddMoney}
            className="rounded-xl px-3 py-1.5 text-xs font-bold transition"
            style={{ background: `${goal.color}20`, color: goal.color }}
          >
            + Add Money
          </button>
          <button
            onClick={onDelete}
            className="rounded-xl p-1.5 text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SavePage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [addMoneyGoal, setAddMoneyGoal] = useState<SavingsGoal | null>(null);

  // Load goals from localStorage keyed by user
  const loadGoals = useCallback((uid: string) => {
    try {
      const raw = localStorage.getItem(`savings_goals_${uid}`);
      if (raw) setGoals(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const saveGoals = useCallback((uid: string, updated: SavingsGoal[]) => {
    localStorage.setItem(`savings_goals_${uid}`, JSON.stringify(updated));
    setGoals(updated);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
      loadGoals(user.id);
      setLoading(false);
    }
    init();
  }, []);

  function handleCreateGoal(g: Omit<SavingsGoal, "id" | "createdAt">) {
    if (!userId) return;
    const newGoal: SavingsGoal = {
      ...g,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...goals, newGoal];
    saveGoals(userId, updated);
    setShowWizard(false);
  }

  function handleAddMoney(goalId: string, amount: number) {
    if (!userId) return;
    const updated = goals.map(g =>
      g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g
    );
    saveGoals(userId, updated);
  }

  function handleDelete(goalId: string) {
    if (!userId) return;
    const updated = goals.filter(g => g.id !== goalId);
    saveGoals(userId, updated);
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-gray-500">Loading...</div>
    </div>
  );

  // Overview stats
  const totalSaved = goals.reduce((a, g) => a + g.currentAmount, 0);
  const totalTarget = goals.reduce((a, g) => a + g.targetAmount, 0);
  const totalMonthly = goals.reduce((a, g) => a + g.monthlyContribution, 0);
  const overallPct = progressPct(totalSaved, totalTarget);

  return (
    <>
      <SaveSubNav />
      <div className="mx-auto max-w-2xl px-4 py-10">

      {/* Modals */}
      {showWizard && (
        <NewGoalWizard
          onSave={handleCreateGoal}
          onCancel={() => setShowWizard(false)}
        />
      )}
      {addMoneyGoal && (
        <AddMoneyModal
          goal={addMoneyGoal}
          onAdd={amount => handleAddMoney(addMoneyGoal.id, amount)}
          onClose={() => setAddMoneyGoal(null)}
        />
      )}

      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Savings Goals</h1>
          <p className="mt-1 text-sm text-gray-500">
            {goals.length === 0
              ? "Build toward the things that matter most."
              : `${goals.length} active goal${goals.length > 1 ? "s" : ""}`}
          </p>
        </div>
        {goals.length > 0 && (
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#00C853] px-4 py-2.5 text-sm font-bold text-black hover:opacity-90 transition"
          >
            <Plus size={15} /> New Goal
          </button>
        )}
      </div>

      {/* Overview card — only show when there are goals */}
      {goals.length > 1 && (
        <div className="mb-6 mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500">Overview — All Goals</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">Total Saved</p>
              <p className="text-2xl font-black text-white">{fmt(totalSaved)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Target</p>
              <p className="text-2xl font-black text-white">{fmt(totalTarget)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Per Month</p>
              <p className="text-2xl font-black text-[#00C853]">{fmt(totalMonthly)}</p>
            </div>
          </div>
          {totalTarget > 0 && (
            <div className="mt-4">
              <div className="mb-1.5 h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-[#00C853] transition-all duration-700"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
              <p className="text-right text-xs text-gray-500">{overallPct}% across all goals</p>
            </div>
          )}
        </div>
      )}

      {/* Goals list */}
      {goals.length === 0 ? (
        <div className="mt-8 space-y-6">
          {/* Empty state */}
          <div className="rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00C853]/10">
              <Target size={26} className="text-[#00C853]" />
            </div>
            <h2 className="mb-2 text-lg font-bold text-white">Set your first savings goal</h2>
            <p className="mb-6 text-sm text-gray-500 max-w-xs mx-auto">
              Whether it&apos;s a house, car, vacation, or emergency fund — we&apos;ll track your progress and show you when you&apos;ll get there.
            </p>
            <button
              onClick={() => setShowWizard(true)}
              className="rounded-xl bg-[#00C853] px-8 py-3 text-sm font-bold text-black hover:opacity-90 transition"
            >
              Create My First Goal
            </button>
          </div>

          {/* Feature callouts */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { icon: TrendingUp, title: "Track progress", desc: "Watch your savings grow toward each goal in real time." },
              { icon: Calendar,   title: "Know your finish date", desc: "We calculate exactly when you'll hit your target." },
              { icon: DollarSign, title: "Find money to save", desc: "Cancel unused subscriptions and redirect that money here." },
            ].map(f => (
              <div key={f.title} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <f.icon size={18} className="mb-2 text-[#00C853]" />
                <p className="mb-1 text-sm font-semibold text-white">{f.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Tip card */}
          <div className="rounded-xl border border-[#00C853]/20 bg-[#00C853]/5 px-4 py-3">
            <p className="text-xs font-semibold text-[#00C853] mb-1">Find money to save</p>
            <p className="text-xs text-gray-400 mb-2">
              The average person wastes $240/month on forgotten subscriptions. Cancel the ones you don&apos;t use and put that money toward your goals.
            </p>
            <button
              onClick={() => router.push("/cancel")}
              className="text-xs font-semibold text-[#00C853] hover:underline"
            >
              Review subscriptions to cancel &rarr;
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {goals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onAddMoney={() => setAddMoneyGoal(goal)}
              onDelete={() => handleDelete(goal.id)}
            />
          ))}

          {/* Tip card — always shown at bottom when there are goals */}
          <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
            <p className="text-xs font-semibold text-gray-400 mb-1">Find more money to save</p>
            <p className="text-xs text-gray-600 mb-2">
              Cancel subscriptions you don&apos;t use and redirect that money toward your goals.
            </p>
            <button
              onClick={() => router.push("/cancel")}
              className="text-xs font-semibold text-[#00C853] hover:underline"
            >
              Review subscriptions to cancel &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
