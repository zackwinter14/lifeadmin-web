"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Trophy, Lock, CheckCircle2, Star, Zap, Shield, TrendingUp, DollarSign, Target, Flame } from "lucide-react";

interface Achievement {
  id: string;
  icon: React.ElementType;
  color: string;
  title: string;
  description: string;
  xp: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  check: (stats: Stats) => boolean;
}

interface Stats {
  itemCount: number;
  expenseCount: number;
  hasIncome: boolean;
  hasBudgetGoal: boolean;
  hasNetWorth: boolean;
  totalTracked: number;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-item",
    icon: Star,
    color: "#F5C518",
    tier: "Bronze",
    title: "First Step",
    description: "Add your first subscription, bill, or trial.",
    xp: 50,
    check: s => s.itemCount >= 1,
  },
  {
    id: "five-items",
    icon: Zap,
    color: "#FF9500",
    tier: "Bronze",
    title: "Getting Organized",
    description: "Track 5 or more subscriptions and bills.",
    xp: 100,
    check: s => s.itemCount >= 5,
  },
  {
    id: "ten-items",
    icon: Shield,
    color: "#34C759",
    tier: "Silver",
    title: "Finance Pro",
    description: "Track 10 or more items in your dashboard.",
    xp: 200,
    check: s => s.itemCount >= 10,
  },
  {
    id: "income-set",
    icon: DollarSign,
    color: "#007AFF",
    tier: "Bronze",
    title: "Know Your Number",
    description: "Set your monthly income.",
    xp: 75,
    check: s => s.hasIncome,
  },
  {
    id: "first-expense",
    icon: Target,
    color: "#FF3B30",
    tier: "Bronze",
    title: "Expense Tracker",
    description: "Log your first expense.",
    xp: 50,
    check: s => s.expenseCount >= 1,
  },
  {
    id: "five-expenses",
    icon: Flame,
    color: "#FF6B35",
    tier: "Silver",
    title: "Spending Awareness",
    description: "Log 5 or more expenses.",
    xp: 150,
    check: s => s.expenseCount >= 5,
  },
  {
    id: "net-worth",
    icon: TrendingUp,
    color: "#AF52DE",
    tier: "Silver",
    title: "Net Worth Tracker",
    description: "Add at least one asset or liability.",
    xp: 150,
    check: s => s.hasNetWorth,
  },
  {
    id: "big-tracker",
    icon: Trophy,
    color: "#F5C518",
    tier: "Gold",
    title: "Life Admin Master",
    description: "Track 20+ items across your dashboard.",
    xp: 500,
    check: s => s.itemCount >= 20,
  },
  {
    id: "expense-tracker-pro",
    icon: Star,
    color: "#34C759",
    tier: "Gold",
    title: "Budget Champion",
    description: "Log 20+ expenses to master your spending.",
    xp: 400,
    check: s => s.expenseCount >= 20,
  },
];

const TIER_COLORS: Record<string, string> = {
  Bronze: "#CD7F32",
  Silver: "#C0C0C0",
  Gold: "#F5C518",
  Platinum: "#E5E4E2",
};

function XPBar({ earned, total }: { earned: number; total: number }) {
  const pct = Math.min((earned / total) * 100, 100);
  return (
    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-brand transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function RewardsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState<Stats>({ itemCount: 0, expenseCount: 0, hasIncome: false, hasBudgetGoal: false, hasNetWorth: false, totalTracked: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [{ data: items }, { data: profile }] = await Promise.all([
        supabase.from("items").select("id, type").eq("user_id", user.id),
        supabase.from("profiles").select("monthly_income").eq("id", user.id).single(),
      ]);

      const all = items || [];
      const expenses = all.filter(i => i.type === "expense");
      const nonExpenses = all.filter(i => i.type !== "expense");

      // Check localStorage for net worth
      let hasNW = false;
      try {
        const a = localStorage.getItem("nw_assets");
        const l = localStorage.getItem("nw_liabs");
        const parsed = [...JSON.parse(a || "[]"), ...JSON.parse(l || "[]")];
        hasNW = parsed.length > 0;
      } catch {}

      setStats({
        itemCount: nonExpenses.length,
        expenseCount: expenses.length,
        hasIncome: !!(profile?.monthly_income && profile.monthly_income > 0),
        hasBudgetGoal: false,
        hasNetWorth: hasNW,
        totalTracked: all.length,
      });
      setLoading(false);
      setAuthed(true);
    }
    init();
  }, []);

  if (loading || !authed) return <div className="flex min-h-screen items-center justify-center"><div className="text-gray-500">Loading...</div></div>;

  const earned = ACHIEVEMENTS.filter(a => a.check(stats));
  const locked = ACHIEVEMENTS.filter(a => !a.check(stats));
  const totalXP = earned.reduce((s, a) => s + a.xp, 0);
  const maxXP = ACHIEVEMENTS.reduce((s, a) => s + a.xp, 0);

  const tierCounts: Record<string, { earned: number; total: number }> = {};
  ACHIEVEMENTS.forEach(a => {
    if (!tierCounts[a.tier]) tierCounts[a.tier] = { earned: 0, total: 0 };
    tierCounts[a.tier].total++;
    if (earned.find(e => e.id === a.id)) tierCounts[a.tier].earned++;
  });

  const level = Math.floor(totalXP / 200) + 1;
  const levelXP = totalXP % 200;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Rewards</h1>
        <p className="mt-1 text-sm text-gray-400">Earn achievements for building better money habits.</p>
      </div>

      {/* XP Hero */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500/20 border border-yellow-500/30">
            <Trophy size={24} className="text-yellow-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-yellow-500/70">Level {level}</p>
              <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-black text-yellow-400">{totalXP} XP</span>
            </div>
            <p className="mt-0.5 text-xl font-black text-yellow-300">{earned.length}/{ACHIEVEMENTS.length} Achievements</p>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-yellow-400 transition-all duration-700" style={{ width: `${(levelXP / 200) * 100}%` }} />
            </div>
            <p className="mt-1 text-xs text-yellow-500/60">{levelXP}/200 XP to Level {level + 1}</p>
          </div>
        </div>

        {/* Tier breakdown */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {["Bronze", "Silver", "Gold", "Platinum"].map(tier => (
            <div key={tier} className="rounded-xl bg-black/20 p-2.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TIER_COLORS[tier] }}>{tier}</p>
              <p className="font-mono text-sm font-black text-white">{tierCounts[tier]?.earned ?? 0}/{tierCounts[tier]?.total ?? 0}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Earned */}
      {earned.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-green-400">Earned · {earned.length}</p>
          <div className="space-y-2">
            {earned.map(a => {
              const Icon = a.icon;
              return (
                <div key={a.id} className="flex items-center gap-4 rounded-2xl border border-green-500/20 bg-green-500/5 px-5 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: a.color + "20" }}>
                    <Icon size={18} style={{ color: a.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{a.title}</p>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: TIER_COLORS[a.tier] + "25", color: TIER_COLORS[a.tier] }}>{a.tier}</span>
                    </div>
                    <p className="text-xs text-gray-500">{a.description}</p>
                  </div>
                  <div className="text-right">
                    <CheckCircle2 size={18} className="text-green-400" />
                    <p className="text-xs font-bold text-green-400">+{a.xp} XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Locked · {locked.length}</p>
          <div className="space-y-2">
            {locked.map(a => {
              const Icon = a.icon;
              return (
                <div key={a.id} className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.01] px-5 py-4 opacity-60">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
                    <Lock size={16} className="text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-400">{a.title}</p>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: TIER_COLORS[a.tier] + "20", color: TIER_COLORS[a.tier] + "aa" }}>{a.tier}</span>
                    </div>
                    <p className="text-xs text-gray-600">{a.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-600">+{a.xp} XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {earned.length === ACHIEVEMENTS.length && (
        <div className="mt-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 py-8 text-center">
          <Trophy size={32} className="mx-auto mb-2 text-yellow-400" />
          <p className="text-lg font-black text-yellow-300">All achievements unlocked!</p>
          <p className="mt-1 text-sm text-gray-500">You're a Life Admin master. More coming soon.</p>
        </div>
      )}
    </div>
  );
}
