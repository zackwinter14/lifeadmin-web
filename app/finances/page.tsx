"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import {
  DollarSign,
  Receipt,
  History,
  Repeat,
  CircleX,
  Landmark,
  Zap,
  TrendingUp,
} from "lucide-react";

const CARDS = [
  {
    href: "/income",
    title: "Income",
    desc: "Monthly income and paychecks",
    icon: DollarSign,
    color: "#00C853",
  },
  {
    href: "/expenses",
    title: "Expenses",
    desc: "Log and track your spending",
    icon: Receipt,
    color: "#FF6B35",
  },
  {
    href: "/history",
    title: "Expense History",
    desc: "Everything you've logged",
    icon: History,
    color: "#38BDF8",
  },
  {
    href: "/manual",
    title: "Subscriptions",
    desc: "Manage subscriptions and bills",
    icon: Repeat,
    color: "#3EA758",
  },
  {
    href: "/cancel",
    title: "Cancel Manager",
    desc: "Find and cancel what you don't use",
    icon: CircleX,
    color: "#FF3B30",
  },
  {
    href: "/bank",
    title: "Bank Accounts",
    desc: "Connect and sync your bank",
    icon: Landmark,
    color: "#5E8EFF",
  },
  {
    href: "/gas",
    title: "Gas Tracker",
    desc: "Track fuel fill-ups and cost",
    icon: Zap,
    color: "#FFB300",
  },
  {
    href: "/networth",
    title: "Net Worth",
    desc: "Assets minus liabilities",
    icon: TrendingUp,
    color: "#64D2FF",
  },
];

export default function FinancesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
      } else {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d0d0d] px-4 py-12">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-white">Finances</h1>
          <p className="mt-2 text-gray-400">Track your income, expenses, subscriptions, and bills.</p>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition hover:border-white/[0.14] hover:bg-white/[0.06]"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: card.color + "22" }}
                >
                  <Icon size={18} style={{ color: card.color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{card.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{card.desc}</p>
                </div>
                <span className="mt-auto text-xs font-medium text-gray-500 transition group-hover:text-gray-300">
                  Open →
                </span>
              </Link>
            );
          })}
        </div>

        {/* Tip box */}
        <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4">
          <p className="text-xs text-gray-500">
            Missing a charge? Connect your bank on the Bank Accounts page and AI will find everything automatically.
          </p>
        </div>

      </div>
    </main>
  );
}
