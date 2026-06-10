"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Shield } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 2FA challenge state
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaVerifying, setMfaVerifying] = useState(false);
  const mfaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("remembered_email");
    if (saved) { setEmail(saved); setRememberMe(true); }
  }, []);

  useEffect(() => {
    if (mfaStep && mfaInputRef.current) mfaInputRef.current.focus();
  }, [mfaStep]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    if (rememberMe) {
      localStorage.setItem("remembered_email", email);
    } else {
      localStorage.removeItem("remembered_email");
    }

    // Check if user has MFA enabled
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const totpFactor = factorsData?.totp?.[0];

    setLoading(false);

    if (aalData?.nextLevel === "aal2" && aalData?.currentLevel === "aal1" && totpFactor) {
      // User has MFA enrolled  -  challenge them
      setMfaFactorId(totpFactor.id);
      setMfaStep(true);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function verifyMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaFactorId || mfaCode.length !== 6) return;
    setMfaVerifying(true);
    setError(null);
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: mfaFactorId,
      code: mfaCode,
    });
    setMfaVerifying(false);
    if (verifyError) {
      setError(verifyError.message);
      setMfaCode("");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function cancelMfa() {
    await supabase.auth.signOut();
    setMfaStep(false);
    setMfaFactorId(null);
    setMfaCode("");
    setError(null);
  }

  if (mfaStep) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
                <Shield size={18} className="text-brand" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Two-factor code</h1>
                <p className="text-xs text-gray-500">Open your authenticator app</p>
              </div>
            </div>

            <form onSubmit={verifyMfa} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm">6-digit code</label>
                <input
                  ref={mfaInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono outline-none focus:border-brand"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={mfaVerifying || mfaCode.length !== 6}
                className="w-full rounded-lg bg-brand-gradient py-3 font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
              >
                {mfaVerifying ? "Verifying..." : "Verify and continue"}
              </button>

              <button
                type="button"
                onClick={cancelMfa}
                className="w-full py-2 text-xs text-gray-500 hover:text-white"
              >
                Cancel and sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
          <h1 className="mb-2 text-3xl font-bold">Welcome back</h1>
          <p className="mb-8 text-gray-400">Log in to your Life Admin account.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-brand"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border border-white/20 bg-black/30 accent-brand cursor-pointer"
              />
              <span className="text-sm text-gray-400">Remember me</span>
            </label>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-gradient py-3 font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-brand hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
