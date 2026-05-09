"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Delete } from "lucide-react";

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

export default function PinGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "locked" | "open">("loading");
  const [entered, setEntered] = useState("");
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    async function check() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setState("open"); return; }

        const pinSet = !!getPinHash();
        const sessionOk = !!sessionStorage.getItem("pin_verified");

        setState(pinSet && !sessionOk ? "locked" : "open");
      } catch {
        setState("open");
      }
    }
    check();
  }, []);

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
  if (state === "open") return <>{children}</>;

  const keys = ["1","2","3","4","5","6","7","8","9","","0","back"];

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black">
      {/* Logo */}
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-2xl font-black text-black">
        $
      </div>

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
