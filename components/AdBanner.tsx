"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

// ── Fill these in once your AdSense account is approved ──────────────────────
const PUBLISHER_ID = "ca-pub-5151835818661965";
const SLOTS = {
  mid:    "XXXXXXXXXX",
  bottom: "XXXXXXXXXX",
};
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window { adsbygoogle: unknown[]; }
}

export default function AdBanner({ position }: { position: "mid" | "bottom" }) {
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const pushed = useRef(false);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsPro(false); return; }
      const { data } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("id", user.id)
        .maybeSingle();
      setIsPro(data?.is_pro ?? false);
    })();
  }, []);

  useEffect(() => {
    if (isPro === false && !pushed.current) {
      pushed.current = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {}
    }
  }, [isPro]);

  // Hide for Pro users or while loading
  if (isPro === null || isPro === true) return null;

  const isMid = position === "mid";

  return (
    <div
      className={`w-full ${
        isMid
          ? "border-b border-white/5 py-1.5"
          : "border-t border-white/5 py-3"
      }`}
    >
      <div className="mx-auto max-w-6xl px-6">
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={PUBLISHER_ID}
          data-ad-slot={SLOTS[position]}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
