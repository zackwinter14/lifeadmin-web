"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Sparkles, X } from "lucide-react";

export default function UpgradeBanner() {
  const router = useRouter();
  const supabase = createClient();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    (async () => {
      // Check dismissal (24h cookie-style via localStorage)
      const dismissedAt = localStorage.getItem("upgrade_banner_dismissed");
      if (dismissedAt && Date.now() - parseInt(dismissedAt) < 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }

      // Check Pro status from profiles.is_pro
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setShow(true); return; }
      const { data } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("id", user.id)
        .maybeSingle();
      if (!data?.is_pro) setShow(true);
    })();
  }, [supabase]);

  async function upgrade(plan: "monthly" | "yearly") {
    setLoading(true);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const { url } = await r.json();
      if (url) window.location.href = url;
    } finally {
      setLoading(false);
    }
  }

  function dismiss() {
    localStorage.setItem("upgrade_banner_dismissed", Date.now().toString());
    setDismissed(true);
  }

  if (!show || dismissed) return null;

  return (
    <div className="my-6 rounded-2xl border border-[#3EA758]/30 bg-gradient-to-r from-[#3EA758]/10 to-[#27ae60]/5 p-5 sm:p-6 relative overflow-hidden">
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute top-3 right-3 text-gray-500 hover:text-white transition"
      >
        <X size={16} />
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <Sparkles className="text-[#3EA758]" size={22} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-1">
              Pro users don't see this
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Unlock every feature  -  unlimited bills, receipt scanning, bank connections, and more.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
          <button
            onClick={() => upgrade("monthly")}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold transition disabled:opacity-50"
          >
            $6.99/mo
          </button>
          <button
            onClick={() => upgrade("yearly")}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-[#3EA758] hover:bg-[#36964e] text-white text-sm font-bold transition disabled:opacity-50 whitespace-nowrap"
          >
            $49.99/yr · Save $34
          </button>
        </div>
      </div>
    </div>
  );
}
