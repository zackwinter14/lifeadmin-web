"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Delete, Shield, X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

function simpleHash(pin: string): string {
  let h = 5381;
  for (let i = 0; i < pin.length; i++) {
    h = (Math.imul(31, h) + pin.charCodeAt(i)) | 0;
  }
  return String(h >>> 0);
}

export function getPinHash() {
  try { return localStorage.getItem("app_pin_hash"); } catch { return null; }
}

export function savePin(pin: string) {
  try { localStorage.setItem("app_pin_hash", simpleHash(pin)); } catch {}
}

export function clearPin() {
  try { localStorage.removeItem("app_pin_hash"); } catch {}
}

export function checkPin(pin: string): boolean {
  const saved = getPinHash();
  return !!saved && simpleHash(pin) === saved;
}

export function markSessionVerified() {
  try { sessionStorage.setItem("pin_verified", "1"); } catch {}
}

function PinPromptModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-7">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10">
            <Shield size={22} className="text-brand" />
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
        <h2 className="mb-2 text-2xl font-bold">Add an extra layer of security</h2>
        <p className="mb-6 text-sm text-gray-400">
          Set a 4-digit PIN that&apos;s required every time you open Life Admin. Even if
          someone gets into your browser, they won&apos;t be able to see your finances
          without your PIN. Takes 10 seconds to set up.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-gray-300 hover:bg-white/5 sm:flex-1"
          >
            Maybe later
          </button>
          <button
            onClick={() => {
              onClose();
              router.push("/profile");
            }}
            className="rounded-xl bg-brand-gradient px-5 py-3 text-sm font-bold text-black hover:opacity-90 sm:flex-1"
          >
            Set up PIN now
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-gray-600">
          You can always set this up later under Profile → Security.
        </p>
      </div>
    </div>
  );
}

export default function PinGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "locked" | "open">("loading");
  const [showPrompt, setShowPrompt] = useState(false);
  const [entered, setEntered] = useState("");
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    async function check() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setState("open"); return; }

        const pinSet = !!getPinHash();
        const sessionOk = !!sessionStorage.getItem("pin_verified");

        if (pinSet && !sessionOk) {
          setState("locked");
        } else {
          setState("open");
          // If logged in but no PIN, prompt once per session
          // Don't prompt while on the profile page (where they'd be setting it up)
          const promptDismissed = sessionStorage.getItem("pin_prompt_dismissed");
          if (!pinSet && !promptDismissed && pathname !== "/profile" && pathname !== "/login" && pathname !== "/signup") {
            setShowPrompt(true);
          }
        }
      } catch {
        setState("open");
      }
    }
    check();
  }, [pathname]);

  function dismissPrompt() {
    setShowPrompt(false);
    try { sessionStorage.setItem("pin_prompt_dismissed", "1"); } catch {}
  }

  function press(digit: string) {
    if (entered.length >= 4 || shake) return;
    const next = entered + digit;
    setEntered(next);
    if (next.length === 4) verify(next);
  }

  function backspace() {
    if (shake) return;
    setEntered(prev => prev.slice(0, -1));
  }

  function verify(pin: string) {
    if (checkPin(pin)) {
      markSessionVerified();
      setState("open");
    } else {
      setShake(true);
      setAttempts(a => a + 1);
      setTimeout(() => {
        setShake(false);
        setEntered("");
      }, 600);
    }
  }

  if (state === "loading") return null;
  if (state === "open") return (
    <>
      {children}
      {showPrompt && <PinPromptModal onClose={dismissPrompt} />}
    </>
  );

  const keys = ["1","2","3","4","5","6","7","8","9","","0","back"];

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black">
      {/* Logo */}
      <img src="/logo-white.png" alt="Life Admin" className="mb-8 h-14 w-14 object-contain" />

      <p className="mb-1 text-xl font-bold text-white">Enter your PIN</p>
      <p className="mb-10 text-sm text-gray-500">Life Admin is locked</p>

      {/* Dots */}
      <div
        className="mb-10 flex gap-5"
        style={{ animation: shake ? "shake 0.5s ease-in-out" : "none" }}
      >
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="h-4 w-4 rounded-full transition-all duration-150"
            style={{
              background: i < entered.length ? "#3EA758" : "rgba(255,255,255,0.1)",
              transform: i < entered.length ? "scale(1.2)" : "scale(1)",
            }}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3" style={{ width: 264 }}>
        {keys.map((k, i) =>
          k === "" ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              onClick={() => k === "back" ? backspace() : press(k)}
              className="flex h-[72px] w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl font-semibold transition hover:bg-white/10 active:scale-95"
            >
              {k === "back" ? <Delete size={22} className="text-gray-400" /> : k}
            </button>
          )
        )}
      </div>

      {attempts >= 3 && (
        <p className="mt-8 text-xs text-gray-600">
          Forgot your PIN?{" "}
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              clearPin();
              window.location.href = "/login";
            }}
            className="text-brand hover:underline"
          >
            Sign out and reset
          </button>
        </p>
      )}

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
