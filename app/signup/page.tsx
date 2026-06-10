"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Check, Eye, EyeOff } from "lucide-react";

const HEAR_ABOUT_OPTS = [
  "TikTok","Instagram","YouTube","Facebook",
  "Google Search","App Store","Reddit","Friend or Family",
  "Twitter / X","Podcast","Other",
];

const LOOKING_FOR_OPTS = [
  "Track my subscriptions",
  "Save money",
  "Budget my spending",
  "Cancel unused services",
  "Monitor bills",
  "See where money goes",
  "Reach a savings goal",
  "Stop overspending",
  "Build an emergency fund",
  "Other",
];

export default function Signup() {
  const supabase = createClient();

  // Step state: 1 = how did you hear, 2 = what are you looking for, 3 = account details
  const [step, setStep] = useState(1);

  // Survey answers
  const [hearAbout, setHearAbout] = useState("");
  const [lookingFor, setLookingFor] = useState<string[]>([]);

  // Account fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [referral, setReferral] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleLookingFor = (opt: string) =>
    setLookingFor(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    if (!email || !password) { setError("Email and password are required"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password2 && password !== password2) { setError("Passwords do not match"); return; }
    setLoading(true);
    setError(null);

    const { data, error: signupErr } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });

    if (signupErr) {
      const msg = signupErr.message.toLowerCase();
      const isBenign = msg.includes("already") || msg.includes("registered") ||
        msg.includes("rate") || msg.includes("wait") || msg.includes("60 second") ||
        msg.includes("email link") || msg.includes("too many");
      if (isBenign) { setLoading(false); setSuccess(true); return; }
      setError(signupErr.message); setLoading(false); return;
    }

    // Save profile via server route so it works even before email is confirmed
    if (data?.user?.id) {
      fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: data.user.id,
          full_name: name.trim(),
          phone: phone.trim(),
          hear_about: hearAbout,
          looking_for: lookingFor.join(","),
          referral_code: referral.trim(),
        }),
      }).catch(() => {});
    }

    setLoading(false);
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10">
            <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
              <Check className="h-8 w-8 text-brand" />
            </div>
            <h1 className="mb-2 text-3xl font-bold">Check your inbox</h1>
            <p className="text-gray-400">
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account and get started.
            </p>
            <p className="mt-4 text-sm text-gray-600">Didn&apos;t get it? Check your spam folder.</p>
          </div>
        </div>
      </div>
    );
  }

  // Progress dots
  const progressDots = (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map(n => (
        <div
          key={n}
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: n === step ? 24 : 6,
            background: n <= step ? "#3EA758" : "rgba(255,255,255,0.1)",
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="grid gap-8 md:grid-cols-2 md:gap-12 items-start">

          {/* Left  -  stats (always visible) */}
          <div>
            <div className="mb-6 rounded-2xl border border-brand/20 bg-brand/5 p-6">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand">The average person thinks</p>
              <p className="text-5xl font-black text-white">$62<span className="text-2xl font-bold text-gray-400">/mo</span></p>
              <p className="mt-1 text-sm text-gray-500">on subscriptions</p>
              <div className="my-4 border-t border-white/5" />
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand">They actually spend</p>
              <p className="text-5xl font-black text-white">$273<span className="text-2xl font-bold text-gray-400">/mo</span></p>
              <p className="mt-1 text-sm text-gray-500">that&apos;s $3,276 a year</p>
              <p className="mt-3 text-xs text-gray-600">Source: West Monroe Partners, n=2,500</p>
            </div>
            <div className="space-y-2">
              {[
                "Free forever  -  no credit card needed",
                "No bank connection required to start",
                "42% of people pay for things they forgot about",
                "See your real number in under 15 minutes",
              ].map(t => (
                <div key={t} className="flex items-center gap-2.5">
                  <Check size={14} className="shrink-0 text-brand" />
                  <span className="text-sm text-gray-400">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right  -  multi-step form */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
            {progressDots}

            {/* ── STEP 1: How did you hear about us? ── */}
            {step === 1 && (
              <div>
                <h1 className="text-2xl font-bold mb-1">How did you hear about us?</h1>
                <p className="text-sm text-gray-400 mb-6">Helps us know where to show up for people like you.</p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {HEAR_ABOUT_OPTS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setHearAbout(hearAbout === opt ? "" : opt)}
                      className="px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150"
                      style={{
                        borderColor: hearAbout === opt ? "#3EA758" : "rgba(255,255,255,0.1)",
                        background: hearAbout === opt ? "rgba(62,167,88,0.15)" : "transparent",
                        color: hearAbout === opt ? "#3EA758" : "#888",
                        fontWeight: hearAbout === opt ? 700 : 500,
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full rounded-lg bg-brand-gradient py-3.5 font-bold text-black transition hover:opacity-90"
                >
                  Next
                </button>
                <button type="button" onClick={() => setStep(3)} className="w-full mt-3 text-sm text-gray-600 hover:text-gray-400 transition">
                  Skip
                </button>
              </div>
            )}

            {/* ── STEP 2: What are you looking for? ── */}
            {step === 2 && (
              <div>
                <h1 className="text-2xl font-bold mb-1">What are you looking for?</h1>
                <p className="text-sm text-gray-400 mb-6">Pick all that apply. We&apos;ll set things up for you.</p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {LOOKING_FOR_OPTS.map(opt => {
                    const sel = lookingFor.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleLookingFor(opt)}
                        className="px-4 py-2 rounded-full text-sm border transition-all duration-150"
                        style={{
                          borderColor: sel ? "#3EA758" : "rgba(255,255,255,0.1)",
                          background: sel ? "rgba(62,167,88,0.15)" : "transparent",
                          color: sel ? "#3EA758" : "#888",
                          fontWeight: sel ? 700 : 500,
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-full rounded-lg bg-brand-gradient py-3.5 font-bold text-black transition hover:opacity-90"
                >
                  Next
                </button>
                <button type="button" onClick={() => setStep(1)} className="w-full mt-3 text-sm text-gray-600 hover:text-gray-400 transition">
                  Back
                </button>
              </div>
            )}

            {/* ── STEP 3: Account details ── */}
            {step === 3 && (
              <div>
                <h1 className="text-2xl font-bold mb-1">Create your account</h1>
                <p className="text-sm text-gray-400 mb-6">Free forever. No bank required to start.</p>
                <form onSubmit={handleSignup} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-brand">Your Name <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="First and last name"
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-brand placeholder:text-gray-600"
                    />
                  </div>
                  {/* Phone */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-400">Phone <span className="text-gray-600 font-normal">(optional)</span></label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-brand placeholder:text-gray-600"
                    />
                  </div>
                  {/* Email */}
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-brand">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-brand placeholder:text-gray-600"
                    />
                  </div>
                  {/* Password */}
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-brand">Password</label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        required
                        minLength={8}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 pr-12 text-sm outline-none focus:border-brand placeholder:text-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(p => !p)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  {/* Confirm password */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-400">Confirm Password</label>
                    <input
                      type={showPass ? "text" : "password"}
                      value={password2}
                      onChange={e => setPassword2(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full rounded-lg border bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-gray-600"
                      style={{
                        borderColor: password2
                          ? password === password2 ? "#3EA758" : "#ef4444"
                          : "rgba(255,255,255,0.1)",
                      }}
                    />
                  </div>
                  {/* Referral code */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-400">Referral Code <span className="text-gray-600 font-normal">(optional)</span></label>
                    <input
                      type="text"
                      value={referral}
                      onChange={e => setReferral(e.target.value)}
                      placeholder="e.g. ABCD-1234"
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

                <button type="button" onClick={() => setStep(2)} className="w-full mt-3 text-sm text-gray-600 hover:text-gray-400 transition">
                  Back
                </button>
                <p className="mt-5 text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link href="/login" className="text-brand hover:underline">Log in</Link>
                </p>
                <p className="mt-3 text-center text-xs text-gray-700">Your data is encrypted. We never sell your information.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
