"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Mail, RefreshCw, LogOut, Check } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      // If they're already verified, send them to dashboard
      if (user.email_confirmed_at) {
        router.push("/dashboard");
        return;
      }
      setEmail(user.email || null);
    }
    check();

    // Auto-poll every 5 seconds  -  when they click the email link in another tab,
    // we'll detect it here and redirect them to the dashboard
    const interval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        clearInterval(interval);
        router.push("/dashboard");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  async function resend() {
    if (!email) return;
    setResending(true);
    setError(null);
    setResent(false);
    const { error: err } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    setResending(false);
    if (err) {
      setError(err.message);
    } else {
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    }
  }

  async function checkNow() {
    setChecking(true);
    const { data: { user } } = await supabase.auth.getUser();
    setChecking(false);
    if (user?.email_confirmed_at) {
      router.push("/dashboard");
    } else {
      setError("Still not verified. Click the link in the email we sent you.");
      setTimeout(() => setError(null), 4000);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10">
            <Mail size={28} className="text-brand" />
          </div>

          <h1 className="mb-2 text-3xl font-bold">Confirm your email</h1>
          <p className="mb-1 text-gray-400">
            We sent a confirmation link to
          </p>
          {email && (
            <p className="mb-6 text-base font-semibold text-white break-all">{email}</p>
          )}

          <p className="mb-8 text-sm text-gray-500">
            Click the link in the email to unlock your dashboard. You can&apos;t access
            the rest of the app until your email is verified.
          </p>

          {resent && (
            <div className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-brand/30 bg-brand/10 p-3 text-sm text-brand">
              <Check size={15} />
              Email sent  -  check your inbox.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={checkNow}
              disabled={checking}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient py-3 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {checking ? (
                <>
                  <RefreshCw size={15} className="animate-spin" /> Checking...
                </>
              ) : (
                "I've confirmed  -  let me in"
              )}
            </button>

            <button
              onClick={resend}
              disabled={resending}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/10 disabled:opacity-50"
            >
              {resending ? (
                <>
                  <RefreshCw size={15} className="animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Mail size={15} /> Resend email
                </>
              )}
            </button>

            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 py-2.5 text-xs text-gray-500 transition hover:text-white"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>

          <p className="mt-6 text-xs text-gray-600">
            Tip: check your spam folder. The email comes from{" "}
            <span className="text-gray-400">noreply@lifeadminofficial.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
