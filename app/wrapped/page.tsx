"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ChevronRight, ChevronLeft, Share2 } from "lucide-react";

interface Snapshot { date: string; networth: number; }

function fmt(n: number) {
  return "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface Slide {
  emoji: string;
  label: string;
  headline: string;
  sub: string;
  color: string;
  bg: string;
}

export default function WrappedPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [idx, setIdx] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    async function build() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const currentYear = new Date().getFullYear();
      const yearStart = `${currentYear}-01-01`;
      const yearEnd = `${currentYear}-12-31`;

      const [profileRes, itemsRes, ccRes, txnRes] = await Promise.all([
        supabase.from("profiles").select("monthly_income, emergency_savings").eq("id", user.id).maybeSingle(),
        supabase.from("items").select("name, amount, type").eq("user_id", user.id).neq("type", "expense"),
        supabase.from("credit_cards").select("current_balance").eq("user_id", user.id),
        supabase.from("transactions")
          .select("amount, date, clean_merchant_name, merchant_name, category")
          .eq("user_id", user.id)
          .gte("date", yearStart)
          .lte("date", yearEnd),
      ]);

      const income = profileRes.data?.monthly_income || 0;
      const emergencySavings = profileRes.data?.emergency_savings || 0;
      const items = itemsRes.data || [];
      const cards = ccRes.data || [];
      const txns = txnRes.data || [];

      const subs = items.filter((i: any) => i.type === "subscription");
      const bills = items.filter((i: any) => i.type === "bill");
      const subsMonthly = subs.reduce((a: number, i: any) => a + i.amount, 0);
      const billsMonthly = bills.reduce((a: number, i: any) => a + i.amount, 0);
      const ccMin = cards.reduce((a: number, c: any) => a + (c.current_balance || 0), 0);
      const fixedMonthly = subsMonthly + billsMonthly;
      const annualFixed = fixedMonthly * 12;
      const annualIncome = income * 12;
      const totalDebt = cards.reduce((a: number, c: any) => a + (c.current_balance || 0), 0);

      // Transaction totals
      const txnTotal = txns.reduce((a: number, t: any) => a + Math.abs(t.amount), 0);

      // Monthly transaction breakdown for best month
      const byMonth: Record<string, number> = {};
      txns.forEach((t: any) => {
        const m = t.date?.slice(0, 7) || "unknown";
        byMonth[m] = (byMonth[m] || 0) + Math.abs(t.amount);
      });
      const monthEntries = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]));
      const bestMonth = monthEntries.sort((a, b) => a[1] - b[1])[0];
      const worstMonth = monthEntries.sort((a, b) => b[1] - a[1])[0];

      // Top merchant
      const merchantMap: Record<string, number> = {};
      txns.forEach((t: any) => {
        const name = t.clean_merchant_name || t.merchant_name || "Unknown";
        merchantMap[name] = (merchantMap[name] || 0) + Math.abs(t.amount);
      });
      const topMerchant = Object.entries(merchantMap).sort((a, b) => b[1] - a[1])[0];

      // Cancelled items
      let cancelledCount = 0;
      try {
        const stored = localStorage.getItem("cancelled_items_v1");
        if (stored) cancelledCount = JSON.parse(stored).length;
      } catch {}

      // Net worth change
      let nwChange: number | null = null;
      try {
        const hist: Snapshot[] = JSON.parse(localStorage.getItem("nw_history") || "[]");
        if (hist.length >= 2) nwChange = hist[hist.length - 1].networth - hist[0].networth;
      } catch {}

      // Savings rate
      const annualSaved = annualIncome - annualFixed - txnTotal;
      const savingsRate = annualIncome > 0 ? Math.round((annualSaved / annualIncome) * 100) : null;

      // Emergency fund
      const monthlyExpenses = fixedMonthly;
      const efMonths = monthlyExpenses > 0 ? emergencySavings / monthlyExpenses : null;

      // Build slides
      const built: Slide[] = [];

      // Intro
      built.push({
        emoji: "📊",
        label: `${currentYear} Year in Review`,
        headline: "Your year,\nby the numbers.",
        sub: "Swipe through your financial highlights.",
        color: "var(--brand-hex)",
        bg: "rgba(var(--brand-rgb) / 0.08)",
      });

      // Annual income
      if (annualIncome > 0) {
        built.push({
          emoji: "💰",
          label: "Annual Income",
          headline: `You earned\n${fmt(annualIncome)}`,
          sub: `${fmt(income)}/mo from your tracked income`,
          color: "#00C853",
          bg: "rgba(0,200,83,0.08)",
        });
      }

      // Fixed costs
      if (annualFixed > 0) {
        built.push({
          emoji: "📱",
          label: "Subscriptions & Bills",
          headline: `${fmt(annualFixed)}\non fixed costs`,
          sub: `${subs.length} subscriptions · ${bills.length} bills tracked`,
          color: "#FFB300",
          bg: "rgba(255,179,0,0.08)",
        });
      }

      // Variable spending
      if (txnTotal > 0) {
        built.push({
          emoji: "💳",
          label: "Variable Spending",
          headline: `${fmt(txnTotal)}\nspent this year`,
          sub: `${txns.length} transactions from your bank`,
          color: "#38BDF8",
          bg: "rgba(56,189,248,0.08)",
        });
      }

      // Top merchant
      if (topMerchant) {
        built.push({
          emoji: "🏪",
          label: "Top Merchant",
          headline: topMerchant[0],
          sub: `You spent ${fmt(topMerchant[1])} here this year`,
          color: "#AF52DE",
          bg: "rgba(175,82,222,0.08)",
        });
      }

      // Best spending month
      if (bestMonth) {
        const [ym] = bestMonth;
        const d = new Date(ym + "-01");
        const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        built.push({
          emoji: "📉",
          label: "Lowest Spend Month",
          headline: label,
          sub: `You spent only ${fmt(bestMonth[1])}  -  your best month`,
          color: "#00C853",
          bg: "rgba(0,200,83,0.08)",
        });
      }

      // Savings rate
      if (savingsRate !== null && annualIncome > 0) {
        const rateColor = savingsRate >= 20 ? "#00C853" : savingsRate >= 10 ? "#FFB300" : "#FF3B30";
        built.push({
          emoji: savingsRate >= 20 ? "🏆" : savingsRate >= 10 ? "💪" : "⚠️",
          label: "Savings Rate",
          headline: `${savingsRate}%\nsavings rate`,
          sub: savingsRate >= 20 ? "Excellent  -  you're building real wealth." : savingsRate >= 10 ? "Good  -  room to grow." : "Tight year  -  small cuts add up.",
          color: rateColor,
          bg: `${rateColor}15`,
        });
      }

      // Cancelled subscriptions
      if (cancelledCount > 0) {
        built.push({
          emoji: "✂️",
          label: "Subscriptions Cancelled",
          headline: `${cancelledCount} cut\nthis year`,
          sub: `Every cancellation adds up  -  great work.`,
          color: "#FF6B35",
          bg: "rgba(255,107,53,0.08)",
        });
      }

      // Net worth change
      if (nwChange !== null) {
        const up = nwChange >= 0;
        built.push({
          emoji: up ? "📈" : "📉",
          label: "Net Worth",
          headline: `${up ? "+" : "-"}${fmt(Math.abs(nwChange))}\nnet worth change`,
          sub: up ? "Your wealth grew this year." : "A setback  -  review your debt payoff plan.",
          color: up ? "#00C853" : "#FF3B30",
          bg: up ? "rgba(0,200,83,0.08)" : "rgba(255,59,48,0.08)",
        });
      }

      // Emergency fund
      if (efMonths !== null && efMonths > 0) {
        const efColor = efMonths >= 6 ? "#00C853" : efMonths >= 3 ? "#FFB300" : "#FF3B30";
        built.push({
          emoji: "🛡️",
          label: "Emergency Fund",
          headline: `${efMonths.toFixed(1)} months\ncovered`,
          sub: efMonths >= 6 ? "Rock solid emergency fund." : efMonths >= 3 ? "Getting there  -  aim for 6 months." : "Build this up next year.",
          color: efColor,
          bg: `${efColor}15`,
        });
      }

      // Credit card debt
      if (totalDebt > 0) {
        built.push({
          emoji: "💳",
          label: "Credit Card Debt",
          headline: `${fmt(totalDebt)}\nstill owed`,
          sub: "Make debt payoff a priority next year.",
          color: "#FF3B30",
          bg: "rgba(255,59,48,0.08)",
        });
      }

      // Outro
      built.push({
        emoji: "🎯",
        label: `Here's to ${currentYear + 1}`,
        headline: "Keep going.\nYou're on track.",
        sub: "Check your Budget and HealthScore to set goals for the year ahead.",
        color: "var(--brand-hex)",
        bg: "rgba(var(--brand-rgb) / 0.08)",
      });

      setSlides(built);
      setLoading(false);
    }
    build();
  }, []);

  function go(dir: 1 | -1) {
    if (animating) return;
    setAnimating(true);
    setIdx(i => Math.max(0, Math.min(slides.length - 1, i + dir)));
    setTimeout(() => setAnimating(false), 300);
  }

  async function share() {
    const slide = slides[idx];
    const text = `${slide.emoji} ${slide.headline.replace("\n", " ")}  -  Life Admin ${new Date().getFullYear()} Review`;
    if (navigator.share) {
      await navigator.share({ text, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(text);
    }
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-gray-500">Loading your year...</div>
    </div>
  );

  if (slides.length === 0) return (
    <div className="flex min-h-screen items-center justify-center flex-col gap-4 px-4">
      <p className="text-2xl">📊</p>
      <p className="text-gray-400 text-center">Not enough data yet for a year in review.<br />Track more of your finances to see your highlights.</p>
      <button onClick={() => router.push("/dashboard")} className="mt-2 rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-bold text-black">
        Go to Dashboard
      </button>
    </div>
  );

  const slide = slides[idx];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">

      {/* Slide card */}
      <div
        className="relative w-full max-w-sm rounded-3xl border p-8 text-center transition-all duration-300"
        style={{
          borderColor: slide.color + "40",
          background: slide.bg,
          opacity: animating ? 0 : 1,
          transform: animating ? "scale(0.97)" : "scale(1)",
        }}
      >
        {/* Share button */}
        <button
          onClick={share}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-600 hover:text-gray-300 transition"
        >
          <Share2 size={14} />
        </button>

        {/* Label */}
        <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: slide.color + "99" }}>
          {slide.label}
        </p>

        {/* Emoji */}
        <div className="mb-4 text-6xl leading-none">{slide.emoji}</div>

        {/* Headline */}
        <p className="mb-3 text-3xl font-black leading-tight text-white whitespace-pre-line">
          {slide.headline}
        </p>

        {/* Sub */}
        <p className="text-sm text-gray-400 leading-relaxed">{slide.sub}</p>

        {/* Progress dots */}
        <div className="mt-8 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === idx ? 20 : 6,
                background: i === idx ? slide.color : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={() => go(-1)}
          disabled={idx === 0}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition disabled:opacity-30"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm text-gray-600">{idx + 1} / {slides.length}</span>
        <button
          onClick={() => go(1)}
          disabled={idx === slides.length - 1}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
