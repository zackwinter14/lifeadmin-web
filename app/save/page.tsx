"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Check } from "lucide-react";
import MerchantLogo from "@/components/MerchantLogo";

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

const TYPE_COLORS = {
  subscription: "#00C853",
  bill: "#FFB300",
  trial: "#38BDF8",
};

export default function SavePage() {
  const router = useRouter();
  const supabase = createClient();

  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("items")
        .select("id, name, amount, type, category, color")
        .eq("user_id", user.id)
        .in("type", ["subscription", "bill", "trial"])
        .order("amount", { ascending: false });

      if (data) setItems(data as Item[]);
      setLoading(false);
    }
    load();
  }, []);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="text-gray-500">Loading...</div></div>;

  const total = items.reduce((a, b) => a + b.amount, 0);
  const saved = items.filter(i => selected.has(i.id)).reduce((a, b) => a + b.amount, 0);
  const newTotal = total - saved;
  const pct = total > 0 ? Math.round((saved / total) * 100) : 0;
  const annual = saved * 12;

  const subs = items.filter(i => i.type === "subscription");
  const bills = items.filter(i => i.type === "bill");
  const trials = items.filter(i => i.type === "trial");

  const subsTotal = subs.reduce((a, b) => a + b.amount, 0);
  const billsTotal = bills.reduce((a, b) => a + b.amount, 0);
  const trialsTotal = trials.reduce((a, b) => a + b.amount, 0);

  const groups = [
    { label: "Subscriptions", items: subs, color: "#00C853", total: subsTotal },
    { label: "Bills", items: bills, color: "#FFB300", total: billsTotal },
    { label: "Trials", items: trials, color: "#38BDF8", total: trialsTotal },
  ].filter(g => g.items.length > 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Savings Calculator</h1>
        <p className="mt-1 text-sm text-gray-400">Check off items you&apos;re thinking about cancelling to see how much you&apos;d save.</p>
      </div>

      {/* Instruction banner */}
      <div className="mb-5 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm leading-relaxed text-gray-300">
        <strong className="text-white">How to use this:</strong> Check off subscriptions or bills you&apos;re thinking about cancelling. The calculator shows exactly how much you&apos;d free up per month and per year.
      </div>

      {/* Summary card */}
      <div className={`mb-6 rounded-2xl border p-5 transition-all ${saved > 0 ? "border-brand/40 bg-brand/5" : "border-white/10 bg-white/[0.02]"}`}>
        <div className="mb-4 flex items-center gap-5">

          {/* Mini donut */}
          <div className="relative shrink-0">
            <svg width="80" height="80" viewBox="0 0 80 80">
              {(() => {
                const r = 30, cx = 40, cy = 40;
                const circ = 2 * Math.PI * r;
                const segs = [
                  { pct: total > 0 ? subsTotal / total : 0, color: "#00C853" },
                  { pct: total > 0 ? billsTotal / total : 0, color: "#FFB300" },
                  { pct: total > 0 ? trialsTotal / total : 0, color: "#38BDF8" },
                ];
                let offset = 0;
                return segs.map((s, i) => {
                  const dash = s.pct * circ;
                  const el = (
                    <circle
                      key={i}
                      cx={cx} cy={cy} r={r}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={10}
                      strokeDasharray={`${dash} ${circ - dash}`}
                      strokeDashoffset={-offset}
                      style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
                    />
                  );
                  offset += dash;
                  return el;
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-500">total</span>
              <span className="font-mono text-sm font-black">${Math.round(total)}</span>
            </div>
          </div>

          <div className="flex-1">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Monthly Total</p>
            <p className="mb-3 font-mono text-3xl font-black">{fmt(total)}</p>
            {[
              { l: "Subs", a: subsTotal, c: "#00C853" },
              { l: "Bills", a: billsTotal, c: "#FFB300" },
              { l: "Trials", a: trialsTotal, c: "#38BDF8" },
            ].map(s => (
              <div key={s.l} className="flex items-center gap-2 border-b border-white/5 py-1.5 last:border-0">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.c }} />
                <span className="text-sm font-semibold flex-1">{s.l}</span>
                <span className="font-mono text-sm font-bold">{fmt(s.a)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 pt-4">
          {saved > 0 ? (
            <>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <p className="text-xs text-green-400/60 uppercase tracking-widest">You&apos;d save</p>
                  <p className="font-mono text-2xl font-black text-green-400">{fmt(saved)}<span className="text-sm text-green-400/50">/mo</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Per year</p>
                  <p className="font-mono text-xl font-bold text-green-400">{fmt(annual)}</p>
                </div>
              </div>
              <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-gradient-to-r from-brand to-green-400 transition-all duration-500" style={{ width: `${100 - pct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>After: {fmt(newTotal)}/mo</span>
                <span className="text-green-400 font-semibold">↓ {pct}%</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">Select items below to see your savings.</p>
          )}
        </div>
      </div>

      {/* Item groups */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center">
          <p className="text-gray-400">No items yet.</p>
          <button onClick={() => router.push("/dashboard")} className="mt-4 rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-semibold text-black hover:opacity-90">
            Add items in Dashboard
          </button>
        </div>
      ) : (
        <>
          {groups.map(g => (
            <div key={g.label} className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: g.color }}>{g.label}</span>
                <span className="font-mono text-xs text-gray-500">{fmt(g.total)}/mo</span>
              </div>
              <div className="space-y-2">
                {g.items.map(item => {
                  const isSelected = selected.has(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggle(item.id)}
                      className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition"
                      style={{
                        background: isSelected ? "#34C75910" : "rgba(255,255,255,0.02)",
                        borderColor: isSelected ? "#34C75938" : "rgba(255,255,255,0.08)",
                      }}
                    >
                      {/* Checkbox */}
                      <div
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition"
                        style={{
                          background: isSelected ? "#34C759" : "transparent",
                          borderColor: isSelected ? "#34C759" : "rgba(255,255,255,0.2)",
                        }}
                      >
                        {isSelected && <Check size={11} color="#fff" strokeWidth={3} />}
                      </div>

                      {/* Icon */}
                      <MerchantLogo name={item.name} color={item.color || g.color} size={36} />

                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${isSelected ? "line-through text-gray-500" : ""}`}>{item.name}</p>
                        <p className="text-xs text-gray-500">{item.category}</p>
                      </div>

                      <div className="text-right">
                        <p className={`font-mono text-sm font-bold ${isSelected ? "text-green-400" : ""}`}>
                          {isSelected ? "-" : ""}{fmt(item.amount)}
                        </p>
                        <p className="text-xs text-gray-500">/mo</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Confirm banner */}
          {selected.size > 0 && (
            <div className="rounded-2xl border border-green-500/25 bg-green-500/10 p-5 text-center">
              <p className="mb-3 text-sm font-semibold text-green-400">
                Cancel {selected.size} item{selected.size > 1 ? "s" : ""} · save {fmt(saved)}/mo · {fmt(annual)}/yr
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full rounded-xl bg-gradient-to-r from-green-500 to-green-600 py-3 font-bold text-white hover:opacity-90"
              >
                Go to Dashboard to manage items
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
