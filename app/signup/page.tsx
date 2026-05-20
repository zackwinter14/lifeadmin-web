"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Check } from "lucide-react";

const SERVICES = [
  { name: "Netflix", monthly: 15.49 },
  { name: "Spotify", monthly: 11.99 },
  { name: "Hulu", monthly: 17.99 },
  { name: "Disney+", monthly: 13.99 },
  { name: "HBO Max", monthly: 15.99 },
  { name: "Amazon Prime", monthly: 14.99 },
  { name: "Gym membership", monthly: 58.00 },
  { name: "Apple TV+", monthly: 9.99 },
];

export default function Signup() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </div>
            <h1 className="mb-2 text-3xl font-bold">Check your inbox</h1>
            <p className="text-gray-400">
              We sent a confirmation email to <strong>{email}</strong>. Click the link to activate your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="grid gap-8 md:grid-cols-2 md:gap-12 items-center">

          {/* Left — the hook */}
          <div>
            {/* The stat */}
            <div className="mb-8 rounded-2xl border border-brand/20 bg-brand/5 p-6">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand">The average person thinks</p>
              <p className="text-5xl font-black text-white">$62<span className="text-2xl font-bold text-gray-400">/mo</span></p>
              <p className="mt-1 text-sm text-gray-500">on subscriptions</p>
              <div className="my-4 border-t border-white/5" />
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand">They actually spend</p>
              <p className="text-5xl font-black text-white">$273<span className="text-2xl font-bold text-gray-400">/mo</span></p>
              <p className="mt-1 text-sm text-gray-500">that's $3,276 a year</p>
              <p className="mt-3 text-xs text-gray-600">Source: West Monroe Partners, n=2,500</p>
            </div>

            {/* Annual cost examples */}
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">What monthly really costs you per year</p>
            <div className="space-y-2 mb-6">
              {SERVICES.map(s => (
                <div key={s.name} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                  <span className="text-sm text-gray-300">{s.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-600">${s.monthly.toFixed(2)}/mo</span>
                    <span className="text-sm font-bold text-brand">${(s.monthly * 12).toFixed(2)}/yr</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust points */}
            <div className="space-y-2">
              {[
                "Free forever — no credit card needed",
                "No bank connection required to start",
                "42% of people are paying for something they forgot",
                "See your real number in under 15 minutes",
              ].map(t => (
                <div key={t} className="flex items-center gap-2.5">
                  <Check size={14} className="shrink-0 text-brand" />
                  <span className="text-sm text-gray-400">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — the form */}
          <div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
              <h1 className="mb-1 text-2xl font-bold">See your real number</h1>
              <p className="mb-8 text-sm text-gray-400">
                Free forever. No credit card. No bank required to start.
              </p>

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-brand placeholder:text-gray-600"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-brand placeholder:text-gray-600"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-brand-gradient py-3.5 font-bold text-black transition hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Creating account..." : "Create free account"}
                </button>
              </form>

              <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <p className="mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">What happens next</p>
                <div className="space-y-2">
                  {[
                    "Add your subscriptions and bills",
                    "See your real monthly and annual total",
                    "Get reminders before anything hits",
                  ].map((s, i) => (
                    <div key={s} className="flex items-center gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/20 text-[10px] font-bold text-brand">{i + 1}</span>
                      <span className="text-sm text-gray-400">{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-6 text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/login" className="text-brand hover:underline">Log in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
