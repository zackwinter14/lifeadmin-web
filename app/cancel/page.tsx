"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ExternalLink, CircleCheck, AlertCircle } from "lucide-react";
import MerchantLogo from "@/components/MerchantLogo";
import { getCancelLink } from "@/lib/cancelLinks";

interface Item {
  id: string;
  name: string;
  amount: number;
  type: "subscription" | "bill" | "trial";
  category: string;
  color: string;
}

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const CANCEL_STEPS: Record<string, string[]> = {
  default: [
    "Open the app or website and log in.",
    "Go to Account or Settings.",
    "Find Subscription, Membership, or Billing.",
    "Select Cancel or Downgrade.",
    "Confirm cancellation and save a screenshot.",
  ],
};

export default function CancelPage() {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data } = await supabase
        .from("items")
        .select("id, name, amount, type, category, color")
        .eq("user_id", user.id)
        .in("type", ["subscription", "trial"])
        .order("amount", { ascending: false });
      if (data) setItems(data as Item[]);
      try {
        const stored = localStorage.getItem("cancelled_items_v1");
        if (stored) setCancelled(new Set(JSON.parse(stored)));
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  function markCancelled(id: string) {
    setCancelled(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem("cancelled_items_v1", JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-gray-500">Loading...</div>
    </div>
  );

  const active = items.filter(i => !cancelled.has(i.id));
  const done = items.filter(i => cancelled.has(i.id));
  const totalActive = active.reduce((a, b) => a + b.amount, 0);
  const totalDone = done.reduce((a, b) => a + b.amount, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Cancel Manager</h1>
        <p className="mt-1 text-sm text-gray-400">Step-by-step instructions to cancel any subscription.</p>
      </div>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-400/70 mb-1">Still Active</p>
          <p className="font-mono text-2xl font-black text-white">{fmt(totalActive)}<span className="text-sm text-gray-500">/mo</span></p>
          <p className="text-xs text-gray-500 mt-0.5">{active.length} subscription{active.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-green-400/70 mb-1">Cancelled</p>
          <p className="font-mono text-2xl font-black text-green-400">{fmt(totalDone)}<span className="text-sm text-green-400/50">/mo saved</span></p>
          <p className="text-xs text-gray-500 mt-0.5">{done.length} cancelled · {fmt(totalDone * 12)}/yr</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center">
          <p className="text-gray-400">No subscriptions or trials tracked yet.</p>
          <button onClick={() => router.push("/dashboard")} className="mt-4 rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-semibold text-black hover:opacity-90">
            Add items in Dashboard
          </button>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="mb-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Active  -  tap to see how to cancel</p>
              <div className="space-y-2">
                {active.map(item => {
                  const link = getCancelLink(item.name);
                  const isOpen = expanded === item.id;
                  return (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
                      style={isOpen ? { borderColor: "rgba(255,59,48,0.3)" } : {}}
                    >
                      <button
                        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                        onClick={() => setExpanded(isOpen ? null : item.id)}
                      >
                        <MerchantLogo name={item.name} color={item.color || "#00C853"} size={38} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.category} · {fmt(item.amount * 12)}/yr</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono text-sm font-bold">{fmt(item.amount)}/mo</p>
                          <p className="text-xs text-gray-600">{isOpen ? "▲" : "▼"}</p>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-white/5 px-4 py-4 space-y-4">
                          {link ? (
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90"
                              style={{ background: "linear-gradient(135deg,#FF3B30,#c0392b)" }}
                            >
                              <ExternalLink size={14} />
                              Cancel {item.name} now
                            </a>
                          ) : (
                            <div className="flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/5 px-3 py-2.5">
                              <AlertCircle size={14} className="text-orange-400 shrink-0" />
                              <p className="text-xs text-gray-400">No direct cancel link found  -  follow the steps below.</p>
                            </div>
                          )}

                          <div>
                            <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-gray-500">How to cancel</p>
                            <ol className="space-y-2">
                              {CANCEL_STEPS.default.map((step, i) => (
                                <li key={i} className="flex gap-3 text-sm text-gray-300 leading-relaxed">
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-[10px] font-black text-red-400 mt-0.5">
                                    {i + 1}
                                  </span>
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>

                          <button
                            onClick={() => { markCancelled(item.id); setExpanded(null); }}
                            className="flex items-center justify-center gap-2 w-full rounded-xl border border-green-500/30 bg-green-500/10 py-2.5 text-sm font-semibold text-green-400 hover:bg-green-500/15 transition"
                          >
                            <CircleCheck size={14} />
                            Mark as cancelled
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {done.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-600">Cancelled</p>
              <div className="space-y-2">
                {done.map(item => (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.01] px-4 py-3 opacity-50">
                    <MerchantLogo name={item.name} color={item.color || "#00C853"} size={34} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-400 line-through">{item.name}</p>
                      <p className="text-xs text-gray-600">{fmt(item.amount)}/mo saved</p>
                    </div>
                    <button
                      onClick={() => markCancelled(item.id)}
                      className="text-xs text-gray-600 hover:text-gray-400 transition"
                    >
                      Undo
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
