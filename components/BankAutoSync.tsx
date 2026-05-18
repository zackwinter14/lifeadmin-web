"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase";

const THROTTLE_MS = 15 * 60 * 1000; // 15 minutes between syncs
const EDGE_BASE = "https://roamiiqvmveykqdlwsav.supabase.co/functions/v1";

export default function BankAutoSync() {
  const supabase = createClient();

  useEffect(() => {
    async function maybeSync() {
      // Only run for logged-in users with a bank connected
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("plaid_access_token")
        .eq("id", user.id)
        .single();

      if (!profile?.plaid_access_token) return;

      // Throttle: skip if synced within the last 15 minutes
      const key = `plaid_auto_sync_last_${user.id}`;
      const last = parseInt(localStorage.getItem(key) || "0", 10);
      if (Date.now() - last < THROTTLE_MS) return;

      // Fire both Edge Functions in parallel — don't await, don't block the page
      localStorage.setItem(key, String(Date.now()));
      Promise.allSettled([
        fetch(`${EDGE_BASE}/plaid-transactions-sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id }),
        }),
        fetch(`${EDGE_BASE}/plaid-recurring-sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id }),
        }),
      ]).catch(() => {});
    }

    maybeSync();
  }, []);

  return null;
}
