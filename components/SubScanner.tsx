"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Sparkles, Plus, X, RefreshCw } from "lucide-react";
import { simplifyName } from "@/lib/merchantUtils";
import MerchantLogo from "@/components/MerchantLogo";

interface DetectedSub {
  key: string;
  name: string;
  rawName: string;
  amount: number;
  frequency: string;
  source: "plaid" | "scan";
  category?: string;
}

function detectType(category: string | undefined, name: string): "subscription" | "bill" {
  const cat = (category || "").toLowerCase();
  const n = (name || "").toLowerCase();
  if (
    cat.includes("util") || cat.includes("rent") || cat.includes("insurance") ||
    cat.includes("loan") || cat.includes("phone") || cat.includes("internet") ||
    cat.includes("cable") || cat.includes("electric") || cat.includes("gas") ||
    cat.includes("water") || cat.includes("service") ||
    n.includes("at&t") || n.includes("verizon") || n.includes("t-mobile") ||
    n.includes("comcast") || n.includes("spectrum") || n.includes("xfinity") ||
    n.includes("cox") || n.includes("insurance") || n.includes("electric") ||
    n.includes("geico") || n.includes("state farm") || n.includes("allstate") ||
    n.includes("progressive") || n.includes("rent") || n.includes("mortgage")
  ) return "bill";
  return "subscription";
}

const STORAGE_KEY = "dismissed_detected_subs_v1";

function getDismissed(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveDismissed(keys: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(keys)); } catch {}
}

const FREQ_LABEL: Record<string, string> = {
  MONTHLY: "monthly", WEEKLY: "weekly", BIWEEKLY: "every 2 weeks",
  ANNUALLY: "yearly", SEMI_MONTHLY: "twice a month",
};

function toMonthly(amount: number, freq: string): number {
  const f = (freq || "MONTHLY").toUpperCase();
  if (f === "WEEKLY")      return amount * 4.33;
  if (f === "BIWEEKLY")    return amount * 2.17;
  if (f === "ANNUALLY")    return amount / 12;
  if (f === "SEMI_MONTHLY") return amount * 2;
  return amount;
}

interface Props {
  userId: string;
  trackedNames: string[];   // names already in items table (to avoid duplicates)
  onAdded: () => void;      // refresh parent after tracking
}

export default function SubScanner({ userId, trackedNames, onAdded }: Props) {
  const supabase = createClient();
  const [found, setFound] = useState<DetectedSub[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    setDismissed(getDismissed());
    scan();
  }, [userId]);

  async function scan() {
    setLoading(true);
    const results: DetectedSub[] = [];

    // ── Source 1: Plaid recurring_transactions (highest confidence) ──────────
    const { data: recurring } = await supabase
      .from("recurring_transactions")
      .select("id, merchant_name, clean_merchant_name, average_amount, last_amount, frequency, category, is_active")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (recurring && recurring.length > 0) {
      for (const r of recurring) {
        const raw = r.clean_merchant_name || r.merchant_name || "";
        const name = simplifyName(raw);
        if (!name || name === "Unknown") continue;
        const baseAmt = Math.abs(r.last_amount || r.average_amount || 0);
        const monthly = toMonthly(baseAmt, r.frequency);
        results.push({
          key: "plaid_" + r.id,
          name,
          rawName: raw,
          amount: monthly,
          frequency: FREQ_LABEL[r.frequency?.toUpperCase()] || "monthly",
          source: "plaid",
          category: r.category,
        });
      }
    }

    // ── Source 2: Scan raw transactions for recurring patterns ────────────────
    // Used as a supplement — catches things Plaid's recurring detector missed
    const since = new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10);
    const { data: txns } = await supabase
      .from("transactions")
      .select("merchant_name, clean_merchant_name, description, amount, date")
      .eq("user_id", userId)
      .gte("date", since)
      .lt("amount", 0)
      .limit(1000);

    if (txns && txns.length > 0) {
      // Group by simplified merchant name
      const groups: Record<string, { amounts: number[]; dates: string[]; raw: string }> = {};
      for (const t of txns) {
        const raw = t.clean_merchant_name || t.merchant_name || t.description || "";
        const name = simplifyName(raw);
        if (!name || name === "Unknown") continue;
        if (!groups[name]) groups[name] = { amounts: [], dates: [], raw };
        groups[name].amounts.push(Math.abs(t.amount));
        groups[name].dates.push(t.date);
      }

      for (const [name, g] of Object.entries(groups)) {
        // Must appear at least twice
        if (g.dates.length < 2) continue;

        // Amounts must be similar (within 15% of the mean)
        const avg = g.amounts.reduce((a, b) => a + b, 0) / g.amounts.length;
        if (avg < 0.50) continue; // skip tiny transactions
        const consistent = g.amounts.every(a => Math.abs(a - avg) / avg < 0.15);
        if (!consistent) continue;

        // Gaps between occurrences must be roughly weekly or monthly
        const sorted = [...g.dates].sort();
        const gaps = sorted.slice(1).map((d, i) =>
          (new Date(d).getTime() - new Date(sorted[i]).getTime()) / 86400000
        );
        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        let freq = "";
        if (avgGap >= 5  && avgGap <= 10) freq = "weekly";
        if (avgGap >= 25 && avgGap <= 40) freq = "monthly";
        if (avgGap >= 55 && avgGap <= 70) freq = "every 2 months";
        if (!freq) continue;

        // Skip if already found via Plaid
        const alreadyFromPlaid = results.some(r => r.name === name && r.source === "plaid");
        if (alreadyFromPlaid) continue;

        results.push({
          key: "scan_" + name,
          name,
          rawName: g.raw,
          amount: avg,
          frequency: freq,
          source: "scan",
        });
      }
    }

    // De-duplicate by name, keep highest-confidence entry
    const seen = new Set<string>();
    const unique = results.filter(r => {
      if (seen.has(r.name)) return false;
      seen.add(r.name);
      return true;
    });

    // Sort: plaid first, then by amount desc
    unique.sort((a, b) => {
      if (a.source === "plaid" && b.source !== "plaid") return -1;
      if (b.source === "plaid" && a.source !== "plaid") return 1;
      return b.amount - a.amount;
    });

    setFound(unique);
    setLoading(false);
  }

  function dismiss(key: string) {
    const next = [...dismissed, key];
    setDismissed(next);
    saveDismissed(next);
  }

  async function track(sub: DetectedSub) {
    setAdding(sub.key);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAdding(null); return; }
    const type = detectType(sub.category, sub.name);
    await supabase.from("items").insert({
      user_id: user.id,
      name: sub.name,
      amount: parseFloat(sub.amount.toFixed(2)),
      type,
      category: sub.category || (type === "bill" ? "Utilities" : "Entertainment"),
      status: "active",
      source: "detected",
      color: type === "bill" ? "#FFB300" : "#3EA758",
      autopay: false,
    });
    dismiss(sub.key);
    onAdded();
    setAdding(null);
  }

  // Filter out already tracked and dismissed
  const trackedLower = trackedNames.map(n => n.toLowerCase());
  const visible = found.filter(f =>
    !dismissed.includes(f.key) &&
    !trackedLower.includes(f.name.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center gap-2 border-t border-white/5 px-5 py-4 text-xs text-gray-500">
      <RefreshCw size={12} className="animate-spin shrink-0" />
      Scanning your transactions for subscriptions…
    </div>
  );

  if (visible.length === 0) return null;

  return (
    <div className="border-t border-[#3EA758]/20 bg-[#3EA758]/[0.04]">
      <div className="flex items-center gap-2 px-5 py-3">
        <Sparkles size={13} className="text-[#3EA758] shrink-0" />
        <p className="text-xs font-bold text-[#3EA758] uppercase tracking-wider">
          Found in your bank — {visible.length} possible subscription{visible.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="divide-y divide-white/5">
        {visible.map(sub => (
          <div key={sub.key} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition">
            <MerchantLogo name={sub.rawName || sub.name} color="#3EA758" size={34} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-white truncate">{sub.name}</p>
                {sub.source === "plaid" && (
                  <span className="rounded-full bg-[#3EA758]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#3EA758]">
                    auto-detected
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                ~${sub.amount.toFixed(2)}/mo · {sub.frequency}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => track(sub)}
                disabled={adding === sub.key}
                className="flex items-center gap-1 rounded-lg bg-[#3EA758]/20 hover:bg-[#3EA758]/35 text-[#3EA758] px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50"
              >
                {adding === sub.key
                  ? <RefreshCw size={11} className="animate-spin" />
                  : <Plus size={11} />}
                Track
              </button>
              <button
                onClick={() => dismiss(sub.key)}
                title="Not a subscription"
                className="rounded-lg p-1.5 text-gray-600 hover:text-gray-300 hover:bg-white/10 transition"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="px-5 py-2 text-[10px] text-gray-600 border-t border-white/5">
        Hit Track to add to your list · X to dismiss permanently
      </p>
    </div>
  );
}
