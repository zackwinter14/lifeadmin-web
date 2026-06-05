"use client";

import { useState } from "react";
import { Check } from "lucide-react";

function CheckoutButton({ plan, highlight, children }: { plan: string; highlight?: boolean; children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`mt-8 block w-full rounded-lg py-3 text-center font-semibold transition ${
        highlight
          ? "bg-brand-gradient text-black hover:opacity-90"
          : "border border-white/10 hover:bg-white/5"
      } disabled:opacity-60`}
    >
      {loading ? "Redirecting..." : children}
    </button>
  );
}

export default function Pricing() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <h1 className="text-5xl font-bold md:text-6xl">
            Simple, <span className="gradient-text">honest</span> pricing.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            Start free. Upgrade when you want more. Cancel any time. No tricks.
          </p>
        </div>

        <div className="mb-8 flex w-full items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-6 py-3 text-sm">
            <span className="gradient-text font-bold">Launch Special:</span>
            <span>Save 40% — pay $49.99/yr instead of $83.88</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Free */}
          <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="text-lg font-semibold">Free</h3>
            <div className="mt-4 flex items-end gap-1">
              <span className="text-4xl font-bold">$0</span>
              <span className="mb-1 text-sm text-gray-400">forever</span>
            </div>
            <ul className="mt-6 space-y-3">
              {[
                "Track manually — unlimited entries",
                "Subscriptions, bills, trials, expenses",
                "Net worth tracker",
                "Bill calendar",
                "Push reminders before due dates",
                "Spending history",
                "Custom themes",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check size={16} className="mt-0.5 flex-shrink-0 text-brand" />
                  <span className="text-gray-300">{f}</span>
                </li>
              ))}
            </ul>
            <a
              href="/signup"
              className="mt-8 block rounded-lg border border-white/10 py-3 text-center font-semibold transition hover:bg-white/5"
            >
              Start free
            </a>
          </div>

          {/* Monthly */}
          <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="text-lg font-semibold">Monthly</h3>
            <div className="mt-4 flex items-end gap-1">
              <span className="text-4xl font-bold">$6.99</span>
              <span className="mb-1 text-sm text-gray-400">/month</span>
            </div>
            <ul className="mt-6 space-y-3">
              {[
                "Everything in Free",
                "No ads",
                "Connect unlimited banks via Plaid",
                "Auto-detect every recurring charge",
                "AI organize subs, bills, gas, expenses",
                "Income tracking from deposits",
                "Receipt scanning with AI Vision",
                "Household sharing",
                "Bill negotiation scripts",
                "Budget goals",
                "Rewards and milestones",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check size={16} className="mt-0.5 flex-shrink-0 text-brand" />
                  <span className="text-gray-300">{f}</span>
                </li>
              ))}
            </ul>
            <CheckoutButton plan="monthly">Start monthly</CheckoutButton>
          </div>

          {/* Yearly */}
          <div className="relative rounded-2xl border border-brand bg-brand/5 p-6">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-gradient px-3 py-1 text-xs font-bold text-black">
              BEST VALUE · 40% OFF
            </div>
            <h3 className="text-lg font-semibold">Yearly</h3>
            <div className="mt-4 flex items-end gap-1">
              <span className="text-4xl font-bold">$49.99</span>
              <span className="mb-1 text-sm text-gray-400">/year</span>
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Only $4.17/month — save $33.89 vs monthly
            </div>
            <ul className="mt-6 space-y-3">
              {[
                "Everything in Monthly",
                "No ads",
                "Lock in your rate — no price increases",
                "Priority support",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check size={16} className="mt-0.5 flex-shrink-0 text-brand" />
                  <span className="text-gray-300">{f}</span>
                </li>
              ))}
            </ul>
            <CheckoutButton plan="yearly" highlight>Get yearly deal</CheckoutButton>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Note title="No hidden upcharges" body="The price you see is the price you pay. No paywall mid-feature. No surprise tier. Cancel inside the app any time." />
          <Note title="Cancel any time" body="Manage your subscription from your Apple ID or Life Admin profile. Two taps, you're out. We don't try to stop you." />
          <Note title="Same plan everywhere" body="Pay once, use the iOS app and the web app with the same account. Both stay in sync automatically." />
        </div>
      </div>
    </div>
  );
}

function Note({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <h3 className="font-bold">{title}</h3>
      <p className="mt-2 text-sm text-gray-400">{body}</p>
    </div>
  );
}
