"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase";

// Only attempt a full Plaid sync once every 15 minutes per browser session.
const THROTTLE_MS = 15 * 60 * 1000;

export default function BankAutoSync() {
  const supabase = createClient();

  useEffect(() => {
    async function maybeSync() {
      // Fast localStorage check first — avoid the Supabase round-trips entirely
      // when this user is known to have no bank linked.
      const uid = localStorage.getItem("auth_user_id");
      if (!uid) {
        // Fall back to auth check if no cached uid yet
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        try { localStorage.setItem("auth_user_id", user.id); } catch {}
      }

      const userId = uid || localStorage.getItem("auth_user_id");
      if (!userId) return;

      // Bail out fast if we know there's no bank linked (cached in localStorage)
      const noBankKey = `plaid_no_bank_${userId}`;
      if (localStorage.getItem(noBankKey) === "1") return;

      const key = `plaid_auto_sync_last_${userId}`;
      const last = parseInt(localStorage.getItem(key) || "0", 10);
      const shouldSync = Date.now() - last >= THROTTLE_MS;

      if (!shouldSync) return;

      // Only now do we make the Supabase profile query
      const { data: profile } = await supabase
        .from("profiles")
        .select("plaid_access_token, monthly_income")
        .eq("id", userId)
        .single();

      if (!profile?.plaid_access_token) {
        // Cache so we skip the profile query on future page loads
        try { localStorage.setItem(noBankKey, "1"); } catch {}
        return;
      }

      // Mark sync time before firing so concurrent page loads don't double-sync
      localStorage.setItem(key, String(Date.now()));

      fetch("/api/plaid/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }).then(async (res) => {
        if (!res.ok) return;
        // Income detection runs only after a successful sync, not on every page load
        await detectAndSaveIncome(userId, profile.monthly_income || 0);
      }).catch(() => {});
    }

    async function detectAndSaveIncome(userId: string, currentIncome: number) {
      try {
        const thisMonthStart = new Date();
        thisMonthStart.setDate(1);
        thisMonthStart.setHours(0, 0, 0, 0);
        const since = thisMonthStart.toISOString().slice(0, 10);

        const { data: txns } = await supabase
          .from("transactions")
          .select("amount")
          .eq("user_id", userId)
          .gt("amount", 0)
          .gte("date", since);

        if (!txns || txns.length === 0) return;

        const detected = Math.round(txns.reduce((sum, t) => sum + Number(t.amount), 0));
        if (detected <= 0) return;

        // Only update if detected income differs from current by more than $50
        if (Math.abs(detected - currentIncome) > 50) {
          await supabase
            .from("profiles")
            .update({ monthly_income: detected })
            .eq("id", userId);
        }
      } catch {}
    }

    maybeSync();
  // Intentionally empty deps — run once on mount only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
