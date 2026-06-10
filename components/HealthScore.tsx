"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface ScoreData {
  total: number;
  income: { score: number; max: number; label: string; detail: string };
  subRatio: { score: number; max: number; label: string; detail: string };
  utilization: { score: number; max: number; label: string; detail: string };
  emergency: { score: number; max: number; label: string; detail: string };
}

function grade(score: number) {
  if (score >= 90) return { letter: "A+", color: "#00C853" };
  if (score >= 80) return { letter: "A",  color: "#34C759" };
  if (score >= 70) return { letter: "B",  color: "#3EA758" };
  if (score >= 60) return { letter: "C",  color: "#FFB300" };
  if (score >= 50) return { letter: "D",  color: "#FF9500" };
  return              { letter: "F",  color: "#FF3B30" };
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 44, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
      <circle
        cx="55" cy="55" r={r} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text x="55" y="50" textAnchor="middle" fill="white" fontSize="22" fontWeight="900" fontFamily="monospace">{score}</text>
      <text x="55" y="67" textAnchor="middle" fill={color} fontSize="11" fontWeight="700">{grade(score).letter}</text>
    </svg>
  );
}

export default function HealthScore({ userId }: { userId: string }) {
  const supabase = createClient();
  const [data, setData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function calc() {
      const [profileRes, itemsRes, ccRes] = await Promise.all([
        supabase.from("profiles").select("monthly_income, emergency_savings").eq("id", userId).maybeSingle(),
        supabase.from("items").select("amount, type").eq("user_id", userId).neq("type", "expense"),
        supabase.from("credit_cards").select("current_balance, credit_limit").eq("user_id", userId),
      ]);

      const income = profileRes.data?.monthly_income || 0;
      const emergencySavings = profileRes.data?.emergency_savings || 0;
      const items = itemsRes.data || [];
      const cards = ccRes.data || [];

      const monthlyExpenses = items.reduce((a: number, i: any) => a + (i.amount || 0), 0);
      const subsTotal = items.filter((i: any) => i.type === "subscription").reduce((a: number, i: any) => a + i.amount, 0);
      const remaining = income - monthlyExpenses;

      // Income coverage (0–35)
      const savingsRate = income > 0 ? remaining / income : 0;
      const incomeScore =
        savingsRate >= 0.30 ? 35 :
        savingsRate >= 0.20 ? 28 :
        savingsRate >= 0.10 ? 18 :
        savingsRate >= 0    ? 8  : 0;

      // Subscription ratio (0–20)
      const subRatioPct = income > 0 ? subsTotal / income : 0;
      const subScore =
        subRatioPct <= 0.05 ? 20 :
        subRatioPct <= 0.10 ? 14 :
        subRatioPct <= 0.20 ? 8  : 2;

      // Credit utilization (0–25)
      const totalBal = cards.reduce((a: number, c: any) => a + (c.current_balance || 0), 0);
      const totalLim = cards.reduce((a: number, c: any) => a + (c.credit_limit || 0), 0);
      const util = totalLim > 0 ? totalBal / totalLim : -1;
      const utilScore =
        util < 0   ? 20 :  // no cards = neutral
        util < 0.1 ? 25 :
        util < 0.3 ? 18 :
        util < 0.7 ? 8  : 0;

      // Emergency fund (0–20)
      const monthsCovered = monthlyExpenses > 0 ? emergencySavings / monthlyExpenses : 0;
      const emergScore =
        monthsCovered >= 6 ? 20 :
        monthsCovered >= 3 ? 15 :
        monthsCovered >= 1 ? 8  :
        emergencySavings > 0 ? 3 : 0;

      const total = incomeScore + subScore + utilScore + emergScore;

      setData({
        total,
        income: {
          score: incomeScore, max: 35,
          label: "Savings Rate",
          detail: income > 0
            ? `${Math.round(savingsRate * 100)}% of income left after fixed costs${savingsRate >= 0.2 ? "  -  great" : savingsRate >= 0.1 ? "  -  aim for 20%+" : "  -  tight"}`
            : "Set your income in Dashboard to score this",
        },
        subRatio: {
          score: subScore, max: 20,
          label: "Subscription Load",
          detail: income > 0
            ? `Subscriptions are ${Math.round(subRatioPct * 100)}% of income${subRatioPct < 0.1 ? "  -  healthy" : "  -  consider trimming"}`
            : "Add your income to score this",
        },
        utilization: {
          score: utilScore, max: 25,
          label: "Credit Utilization",
          detail: util < 0
            ? "No credit cards tracked  -  add them in Credit Cards"
            : `${Math.round(util * 100)}% utilized${util < 0.3 ? "  -  good" : "  -  pay down to boost score"}`,
        },
        emergency: {
          score: emergScore, max: 20,
          label: "Emergency Fund",
          detail: emergencySavings > 0
            ? `${monthsCovered.toFixed(1)} months covered${monthsCovered >= 3 ? "  -  solid" : "  -  aim for 3-6 months"}`
            : "Add your savings in the Emergency Fund tracker",
        },
      });
      setLoading(false);
    }
    calc();
  }, [userId]);

  if (loading || !data) return null;
  const { letter, color } = grade(data.total);

  return (
    <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition text-left"
      >
        <ScoreRing score={data.total} color={color} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-0.5">Financial Health Score</p>
          <p className="text-2xl font-black text-white">{data.total} <span className="text-lg font-bold" style={{ color }}>{letter}</span></p>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.total >= 80 ? "You're in great shape." :
             data.total >= 60 ? "Room to improve  -  tap to see where." :
             "A few changes could make a big difference."}
          </p>
        </div>
        <span className="text-xs text-gray-600 shrink-0">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="border-t border-white/5 divide-y divide-white/5">
          {[data.income, data.subRatio, data.utilization, data.emergency].map(s => {
            const pct = Math.round((s.score / s.max) * 100);
            const barColor = pct >= 80 ? "#00C853" : pct >= 50 ? "#FFB300" : "#FF3B30";
            return (
              <div key={s.label} className="px-5 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-semibold text-white">{s.label}</p>
                  <p className="text-xs font-mono text-gray-400">{s.score}/{s.max}</p>
                </div>
                <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: barColor }} />
                </div>
                <p className="text-xs text-gray-500">{s.detail}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
