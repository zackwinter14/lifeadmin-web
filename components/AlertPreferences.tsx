"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Bell, Check } from "lucide-react";

interface Props {
  userId: string;
  userEmail: string;
}

export default function AlertPreferences({ userId, userEmail }: Props) {
  const supabase = createClient();
  const [enabled, setEnabled] = useState(false);
  const [daysBefore, setDaysBefore] = useState(3);
  const [alertEmail, setAlertEmail] = useState(userEmail);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [largeTxEnabled, setLargeTxEnabled] = useState(false);
  const [largeTxAmount, setLargeTxAmount] = useState("100");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("profiles")
        .select("alert_enabled, alert_days_before, alert_email")
        .eq("id", userId)
        .maybeSingle();
      if (data) {
        setEnabled(data.alert_enabled ?? false);
        setDaysBefore(data.alert_days_before ?? 3);
        setAlertEmail(data.alert_email || userEmail);
      }
      setLoaded(true);
      try {
        const ltx = localStorage.getItem(`alert_large_tx_${userId}`);
        if (ltx) {
          const parsed = JSON.parse(ltx);
          setLargeTxEnabled(parsed.enabled ?? false);
          setLargeTxAmount(String(parsed.amount ?? 100));
        }
      } catch {}
    }
    load();
  }, [userId]);

  async function save() {
    setSaving(true);
    await supabase.from("profiles").update({
      alert_enabled: enabled,
      alert_days_before: daysBefore,
      alert_email: alertEmail,
    }).eq("id", userId);
    try {
      localStorage.setItem(`alert_large_tx_${userId}`, JSON.stringify({
        enabled: largeTxEnabled,
        amount: parseFloat(largeTxAmount) || 100,
      }));
    } catch {}
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!loaded) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
        <Bell size={15} className="text-brand shrink-0" />
        <p className="text-sm font-semibold text-white">Bill &amp; Subscription Alerts</p>
      </div>
      <div className="p-5 space-y-4">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Email reminders</p>
            <p className="text-xs text-gray-500">Get notified before bills and subscriptions renew</p>
          </div>
          <button
            onClick={() => setEnabled(v => !v)}
            className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? "bg-brand" : "bg-white/10"}`}
          >
            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${enabled ? "left-6" : "left-1"}`} />
          </button>
        </div>

        {enabled && (
          <>
            <div>
              <p className="text-xs text-gray-400 mb-2">Notify me this many days before</p>
              <div className="flex gap-2">
                {[1, 3, 5, 7].map(d => (
                  <button
                    key={d}
                    onClick={() => setDaysBefore(d)}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${daysBefore === d ? "bg-brand text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1.5">Send alerts to</p>
              <input
                type="email"
                value={alertEmail}
                onChange={e => setAlertEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-brand/50"
              />
            </div>
          </>
        )}

        {/* Large transaction alerts */}
        <div className="border-t border-white/5 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Large transaction alerts</p>
              <p className="text-xs text-gray-500">Get notified when a transaction exceeds your threshold</p>
            </div>
            <button
              onClick={() => setLargeTxEnabled(v => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors ${largeTxEnabled ? "bg-brand" : "bg-white/10"}`}
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${largeTxEnabled ? "left-6" : "left-1"}`} />
            </button>
          </div>
          {largeTxEnabled && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-1.5">Alert me when a transaction is over</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={largeTxAmount}
                  onChange={e => setLargeTxAmount(e.target.value)}
                  placeholder="100"
                  className="w-full rounded-xl border border-white/10 bg-black/30 pl-7 pr-3 py-2.5 text-sm text-white outline-none focus:border-brand/50 font-mono"
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-brand/15 hover:bg-brand/25 text-brand px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50"
        >
          {saved ? <><Check size={13} /> Saved</> : saving ? "Saving..." : "Save preferences"}
        </button>

        {enabled && (
          <p className="text-[10px] text-gray-600 leading-relaxed">
            Alerts are sent by a daily background job. Run the Supabase Edge Function <code className="text-gray-500">bill-alert-sender</code> on a daily cron, or use n8n to call it each morning.
          </p>
        )}
      </div>
    </div>
  );
}
