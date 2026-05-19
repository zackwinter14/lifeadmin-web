"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase";

const THROTTLE_MS = 15 * 60 * 1000;

export default function BankAutoSync() {
  const supabase = createClient();

  useEffect(() => {
    async function maybeSync() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("plaid_access_token, monthly_income")
        .eq("id", user.id)
        .single();

      if (!profile?.plaid_access_token) return;

      const key = `plaid_auto_sync_last_${user.id}`;
      const last = parseInt(localStorage.getItem(key) || "0", 10);
      const shouldSync = Date.now() - last >= THROTTLE_MS;

      // Always detect income from existing transactions on every page load
      await detectAndSaveIncome(user.id, profile.monthly_income || 0);

      if (!shouldSync) return;

      localStorage.setItem(key, String(Date.now()));
      // Single reliable sync route — handles transactions, recurring, and auto-creates items
      fetch("/api/plaid/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      }).then(async () => {
        await detectAndSaveIncome(user.id, profile.monthly_income || 0);
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
        // to avoid overwriting a manually-set income with noise
        if (Math.abs(detected - currentIncome) > 50) {
          await supabase
            .from("profiles")
            .update({ monthly_income: detected })
            .eq("id", userId);
        }
      } catch {}
    }

    maybeSync();
  }, []);

  return null;
}
