"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Bot, X, ChevronRight } from "lucide-react";

const CACHE_MS = 24 * 60 * 60 * 1000;
const BLOCKED = new Set(["/autoai", "/login", "/signup", "/", "/features", "/pricing", "/tools", "/transparency"]);

export default function AutoAINotification() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Run once on mount only — not on every navigation.
  // The notification is session-scoped anyway (cached 24h in localStorage).
  useEffect(() => {
    // Don't show on blocked pages
    if (BLOCKED.has(pathname) || BLOCKED.has(pathname?.split("/")[1] ? "/" + pathname.split("/")[1] : "")) return;

    async function maybeShow() {
      // Try localStorage cached uid before hitting Supabase
      let uid = localStorage.getItem("auth_user_id");
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        uid = user.id;
        try { localStorage.setItem("auth_user_id", uid); } catch {}
      }
      setUserId(uid);

      const dismissKey = `autoai_notif_dismissed_${uid}`;
      const cacheKey = `autoai_notif_cache_${uid}`;
      const dismissed = parseInt(localStorage.getItem(dismissKey) || "0", 10);
      if (Date.now() - dismissed < CACHE_MS) return;

      // Show from cache first — no API call needed
      try {
        const cached = JSON.parse(localStorage.getItem(cacheKey) || "{}");
        if (cached.ts && Date.now() - cached.ts < CACHE_MS && cached.message) {
          setMessage(cached.message);
          setVisible(true);
          return;
        }
      } catch {}

      // Only call the AI endpoint once per 24h when cache is stale
      try {
        const res = await fetch("/api/autoai/insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: uid }),
        });
        const data = await res.json();
        if (data.message) {
          localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), message: data.message }));
          localStorage.setItem(`autoai_unread_${uid}`, "true");
          setMessage(data.message);
          setVisible(true);
        }
      } catch {}
    }

    maybeShow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only — notification is per-session, not per-navigation

  // Dismiss visibility when user navigates to a blocked page
  useEffect(() => {
    if (BLOCKED.has(pathname)) setVisible(false);
  }, [pathname]);

  function dismiss() {
    setVisible(false);
    if (userId) {
      try { localStorage.setItem(`autoai_notif_dismissed_${userId}`, String(Date.now())); } catch {}
    }
  }

  function openAutoAI() {
    dismiss();
    router.push("/autoai");
  }

  if (!visible || !message) return null;

  const preview = message.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");

  return (
    <div className="fixed bottom-20 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-purple-500/30 bg-[#111] shadow-2xl shadow-purple-500/10 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3 p-4">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/20">
          <Bot size={15} className="text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-purple-400">AutoAI</p>
          <p className="text-xs leading-relaxed text-gray-300 line-clamp-3">{preview}</p>
          <button
            onClick={openAutoAI}
            className="mt-2 flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 transition"
          >
            Continue in AutoAI <ChevronRight size={12} />
          </button>
        </div>
        <button onClick={dismiss} className="shrink-0 rounded-lg p-1 text-gray-600 hover:text-gray-300 transition">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
