"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { TrendingUp, TrendingDown, X } from "lucide-react";
import { simplifyName } from "@/lib/merchantUtils";

interface PriceChange {
  id: string;
  name: string;
  oldAmount: number;
  newAmount: number;
  diff: number;
  pct: number;
}

const STORAGE_KEY = "dismissed_price_changes_v1";

function getDismissed(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

export default function PriceChangeAlert({ userId }: { userId: string }) {
  const supabase = createClient();
  const [changes, setChanges] = useState<PriceChange[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(getDismissed());
    async function detect() {
      const { data } = await supabase
        .from("recurring_transactions")
        .select("id, merchant_name, clean_merchant_name, last_amount, average_amount")
        .eq("user_id", userId)
        .eq("is_active", true);
      if (!data) return;
      const found: PriceChange[] = [];
      for (const r of data) {
        const last = Math.abs(r.last_amount || 0);
        const avg = Math.abs(r.average_amount || 0);
        if (avg < 1 || last < 1) continue;
        const diff = last - avg;
        const pct = Math.abs(diff / avg) * 100;
        if (pct < 8 || Math.abs(diff) < 0.75) continue;
        const name = simplifyName(r.clean_merchant_name || r.merchant_name || "");
        if (!name || name === "Unknown") continue;
        found.push({ id: r.id, name, oldAmount: avg, newAmount: last, diff, pct });
      }
      setChanges(found);
    }
    detect();
  }, [userId]);

  function dismiss(id: string) {
    const next = [...dismissed, id];
    setDismissed(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }

  const visible = changes.filter(c => !dismissed.includes(c.id));
  if (visible.length === 0) return null;

  return (
    <div className="mb-5 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-3">
        Price changes detected
      </p>
      <div className="space-y-2">
        {visible.map(c => (
          <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-black/20 px-3 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              {c.diff > 0
                ? <TrendingUp size={14} className="text-red-400 shrink-0" />
                : <TrendingDown size={14} className="text-green-400 shrink-0" />}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                <p className="text-xs text-gray-500">
                  ${c.oldAmount.toFixed(2)} &rarr; ${c.newAmount.toFixed(2)}
                  <span className={`ml-1.5 font-semibold ${c.diff > 0 ? "text-red-400" : "text-green-400"}`}>
                    {c.diff > 0 ? "+" : ""}{c.diff.toFixed(2)} ({c.pct.toFixed(0)}%{c.diff > 0 ? " increase" : " decrease"})
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={() => dismiss(c.id)}
              className="text-gray-600 hover:text-gray-300 transition shrink-0"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
