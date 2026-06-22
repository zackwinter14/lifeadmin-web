"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, ChevronDown, ChevronUp, BookOpen, TrendingUp, Shield, CreditCard, PiggyBank, DollarSign } from "lucide-react";

interface Lesson {
  id: string;
  icon: React.ElementType;
  color: string;
  category: string;
  title: string;
  summary: string;
  body: string[];
}

const LESSONS: Lesson[] = [
  {
    id: "50-30-20",
    icon: PiggyBank,
    color: "#3EA758",
    category: "Budgeting",
    title: "The 50/30/20 Rule",
    summary: "A simple framework to split every paycheck.",
    body: [
      "50% → Needs: rent, groceries, utilities, insurance, minimum debt payments.",
      "30% → Wants: dining out, subscriptions, entertainment, hobbies.",
      "20% → Savings & debt payoff: emergency fund, retirement, extra debt payments.",
      "Tip: Automate the savings 20% the moment your paycheck hits so you never accidentally spend it.",
    ],
  },
  {
    id: "emergency-fund",
    icon: Shield,
    color: "#FF9500",
    category: "Saving",
    title: "Build Your Emergency Fund",
    summary: "3–6 months of expenses in a high-yield savings account.",
    body: [
      "Start small  -  even $500 covers most single emergencies.",
      "Goal: 3 months of essential expenses (rent + food + utilities + transport).",
      "Stable job? 3 months is fine. Variable income? Aim for 6.",
      "Keep it in a HYSA (High-Yield Savings Account)  -  earn 4–5% APY instead of 0.01%.",
      "Don't touch it unless it's a true emergency. Car repair = emergency. Sale at the mall = not.",
    ],
  },
  {
    id: "debt-avalanche",
    icon: CreditCard,
    color: "#FF3B30",
    category: "Debt",
    title: "Debt Avalanche vs. Snowball",
    summary: "Two proven strategies to wipe out debt faster.",
    body: [
      "Avalanche: Pay minimums on all debts. Put extra money toward the highest interest rate first. Saves the most money mathematically.",
      "Snowball: Pay minimums on all debts. Put extra toward the smallest balance first. Wins psychologically  -  quick wins keep you motivated.",
      "Which to use: If you need motivation, do Snowball. If you want to save the most interest, do Avalanche.",
      "Both beat doing nothing. Pick one and stick to it.",
    ],
  },
  {
    id: "subscriptions",
    icon: DollarSign,
    color: "#007AFF",
    category: "Saving",
    title: "Slash Your Subscriptions",
    summary: "The average person wastes $300+/month on unused subscriptions.",
    body: [
      "List every subscription you pay for  -  check your bank statement for recurring charges.",
      "Ask: Did I use this in the last 30 days? If no, cancel it.",
      "Share plans: Spotify, Netflix, Apple One, YouTube Premium all allow family plans.",
      "Pause instead of cancel: Many services (Hulu, Amazon) let you pause for 1–3 months.",
      "Annual vs monthly: Annual plans are usually 15–20% cheaper if you know you'll use it.",
      "Use Life Admin to track all subscriptions in one place so nothing slips through.",
    ],
  },
  {
    id: "credit-score",
    icon: TrendingUp,
    color: "#AF52DE",
    category: "Credit",
    title: "How Credit Scores Work",
    summary: "5 factors that determine your score  -  and how to improve each.",
    body: [
      "Payment History (35%): Never miss a payment. Set autopay for at least the minimum.",
      "Credit Utilization (30%): Keep balances below 30% of your limit. Below 10% is ideal.",
      "Length of History (15%): Keep old cards open, even if you don't use them.",
      "Credit Mix (10%): Having both revolving (credit cards) and installment (loans) helps.",
      "New Inquiries (10%): Don't apply for multiple cards at once. Each hard inquiry drops your score temporarily.",
      "Quick win: Ask your credit card company to increase your limit  -  it improves utilization without spending more.",
    ],
  },
  {
    id: "invest-early",
    icon: BookOpen,
    color: "#34C759",
    category: "Investing",
    title: "Why Starting Early Matters",
    summary: "Compound interest is the most powerful force in personal finance.",
    body: [
      "If you invest $200/month from age 22 to 32 and stop, you'll have more at 65 than someone who invests $200/month from age 32 to 65.",
      "That's 10 years of contributions vs 33 years  -  and the early starter wins. That's compound interest.",
      "Step 1: Get your full employer 401k match  -  it's a 50–100% instant return.",
      "Step 2: Max out a Roth IRA ($7,000/year in 2025)  -  tax-free growth forever.",
      "Step 3: Max out your 401k ($23,500/year in 2025).",
      "Index funds (like S&P 500 ETFs) beat most actively managed funds over 20+ year periods.",
    ],
  },
  {
    id: "negotiate-bills",
    icon: Shield,
    color: "#FF6B35",
    category: "Negotiation",
    title: "Negotiate Any Bill Down",
    summary: "A proven script that works on internet, insurance, phone, and more.",
    body: [
      "Call retention/loyalty department (not general customer service).",
      "Say: 'I've been a customer for X years and I'm considering canceling. I found a better rate with [competitor].'",
      "They'll often offer 20–40% off immediately.",
      "If the first agent says no, hang up and call again  -  different agents have different authority.",
      "Bills that almost always work: internet, cable, phone, gym, insurance, medical.",
      "Best time to call: weekday mornings when call centers are less busy.",
    ],
  },
  {
    id: "sinking-funds",
    icon: PiggyBank,
    color: "#38BDF8",
    category: "Saving",
    title: "Sinking Funds: Plan for Big Expenses",
    summary: "Never be blindsided by a car repair, vacation, or holiday season again.",
    body: [
      "A sinking fund is money set aside each month for a known future expense.",
      "Examples: Car maintenance ($50/mo), Vacation ($100/mo), Holiday gifts ($75/mo), Annual insurance ($60/mo).",
      "Calculate: Annual expense ÷ 12 = monthly amount to save.",
      "Keep each fund in a separate savings account or labeled bucket in your HYSA.",
      "When the expense hits, the money is already there  -  no stress, no debt.",
    ],
  },
];

export default function SchoolPage() {
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");

  const categories = ["All", ...Array.from(new Set(LESSONS.map(l => l.category)))];
  const filtered = filter === "All" ? LESSONS : LESSONS.filter(l => l.category === filter);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">School</h1>
        <p className="mt-1 text-sm text-gray-400">Finance tips and lessons to level up your money game.</p>
      </div>

      {/* Category filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className="rounded-full border px-4 py-1.5 text-sm font-semibold transition"
            style={{
              borderColor: filter === cat ? "#38BDF8" : "rgba(255,255,255,0.1)",
              background: filter === cat ? "#38BDF820" : "transparent",
              color: filter === cat ? "#38BDF8" : "#9ca3af",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Lessons */}
      <div className="space-y-3">
        {filtered.map(lesson => {
          const Icon = lesson.icon;
          const isOpen = open === lesson.id;
          return (
            <div
              key={lesson.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition"
              style={isOpen ? { borderColor: lesson.color + "40" } : {}}
            >
              <button
                onClick={() => setOpen(isOpen ? null : lesson.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: lesson.color + "15", border: `1px solid ${lesson.color}30` }}
                >
                  <Icon size={18} style={{ color: lesson.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                      style={{ background: lesson.color + "20", color: lesson.color }}
                    >
                      {lesson.category}
                    </span>
                  </div>
                  <p className="mt-0.5 font-semibold">{lesson.title}</p>
                  <p className="text-xs text-gray-500">{lesson.summary}</p>
                </div>
                <div className="text-gray-600">
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-white/5 px-5 py-4">
                  <ul className="space-y-2.5">
                    {lesson.body.map((line, i) => (
                      <li key={i} className="flex gap-2.5 text-sm text-gray-300 leading-relaxed">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: lesson.color }} />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 text-center">
        <GraduationCap size={24} className="mx-auto mb-2 text-cyan-400" />
        <p className="font-semibold text-cyan-300">Have a finance question?</p>
        <p className="mt-1 text-sm text-gray-500">Ask AutoAI  -  your personal finance assistant.</p>
        <Link
          href="/signup"
          className="mt-3 inline-block rounded-xl px-5 py-2 text-sm font-semibold text-black"
          style={{ background: "linear-gradient(135deg,#38BDF8,#0ea5e9)" }}
        >
          Try Life Admin Free
        </Link>
      </div>
    </div>
  );
}
