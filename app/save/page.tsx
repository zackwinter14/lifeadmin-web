"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Check, Plus, X, RefreshCw } from "lucide-react";
import MerchantLogo from "@/components/MerchantLogo";
import { getCancelLink } from "@/lib/cancelLinks";

interface Item {
  id: string;
  name: string;
  amount: number;
  type: "subscription" | "bill" | "trial";
  category: string;
  color: string;
  value_rating: number | null;
}

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const TYPE_COLORS = {
  subscription: "#00C853",
  bill: "#FFB300",
  trial: "#38BDF8",
};

const RATING_LABELS: Record<number, string> = {
  1: "Not using it",
  2: "Rarely use",
  3: "Sometimes",
  4: "Use it often",
  5: "Love it",
};

function StarRating({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={e => { e.stopPropagation(); onChange(n); }}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          className="text-base leading-none transition"
          style={{ color: active && n <= active ? "#FFB300" : "rgba(255,255,255,0.15)" }}
          title={RATING_LABELS[n]}
        >
          &#9733;
        </button>
      ))}
      {active && (
        <span className="ml-1 text-[10px] text-gray-500">{RATING_LABELS[active]}</span>
      )}
    </div>
  );
}

export default function SavePage() {
  const router = useRouter();
  const supabase = createClient();

  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [savingRating, setSavingRating] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickForm, setQuickForm] = useState({ name: "", amount: "", type: "subscription" as "subscription" | "bill" | "trial" });
  const [quickSaving, setQuickSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("items")
        .select("id, name, amount, type, category, color, value_rating")
        .eq("user_id", user.id)
        .in("type", ["subscription", "bill", "trial"])
        .order("amount", { ascending: false });

      if (data) setItems(data as Item[]);
      setUserId(user.id);
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

  async function quickAdd() {
    if (!userId || !quickForm.name || !quickForm.amount) return;
    setQuickSaving(true);
    const color = TYPE_COLORS[quickForm.type];
    const { data } = await supabase.from("items").insert({
      user_id: userId,
      name: quickForm.name.trim(),
      amount: parseFloat(quickForm.amount) || 0,
      type: quickForm.type,
      category: quickForm.type === "subscription" ? "Entertainment" : quickForm.type === "bill" ? "Utilities" : "Other",
      color,
      status: "active",
      autopay: false,
    }).select("id, name, amount, type, category, color, value_rating").single();
    if (data) setItems(prev => [...prev, data as Item].sort((a, b) => b.amount - a.amount));
    setQuickForm({ name: "", amount: "", type: "subscription" });
    setShowQuickAdd(false);
    setQuickSaving(false);
  }

  async function setRating(itemId: string, rating: number) {
    setSavingRating(itemId);
    await supabase.from("items").update({ value_rating: rating }).eq("id", itemId);
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, value_rating: rating } : i));
    setSavingRating(null);
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-gray-500">Loading...</div>
    </div>
  );

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

  // Low-value items: rated 1 or 2 and not already selected
  const lowValue = items.filter(i => i.value_rating && i.value_rating <= 2 && !selected.has(i.id));

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
        <p className="mt-1 text-sm text-gray-400">Rate how much you use each item, then check off the ones to cancel.</p>
      </div>

      {/* Instruction banner */}
      <div className="mb-5 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm leading-relaxed text-gray-300">
        <strong className="text-white">How to use this:</strong> Rate each subscription 1-5 stars to see which ones aren&apos;t worth the money, then check them off to calculate your savings.
      </div>

      {/* Low value suggestion */}
      {lowValue.length > 0 && (
        <div className="mb-5 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3">
          <p className="text-sm font-semibold text-orange-400 mb-1">
            {lowValue.length} low-value {lowValue.length === 1 ? "item" : "items"} you rarely use
          </p>
          <p className="text-xs text-gray-500 mb-2">
            {lowValue.map(i => i.name).join(", ")} &mdash; {fmt(lowValue.reduce((a, b) => a + b.amount, 0))}/mo
          </p>
          <button
            onClick={() => {
              setSelected(prev => {
                const next = new Set(prev);
                lowValue.forEach(i => next.add(i.id));
                return next;
              });
            }}
            className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition"
          >
            Select all low-value items
          </button>
        </div>
      )}

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
                <span className="text-green-400 font-semibold">down {pct}%</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">Check items below to calculate your savings.</p>
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
                  const isLow = item.value_rating && item.value_rating <= 2;
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border transition overflow-hidden"
                      style={{
                        background: isSelected ? "#34C75910" : "rgba(255,255,255,0.02)",
                        borderColor: isLow && !isSelected
                          ? "rgba(251,146,60,0.25)"
                          : isSelected ? "#34C75938" : "rgba(255,255,255,0.08)",
                      }}
                    >
                      {/* Main row — click to toggle */}
                      <div
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                        onClick={() => toggle(item.id)}
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

                        <MerchantLogo name={item.name} color={item.color || g.color} size={36} />

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${isSelected ? "line-through text-gray-500" : ""}`}>
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500">{item.category}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className={`font-mono text-sm font-bold ${isSelected ? "text-green-400" : ""}`}>
                            {isSelected ? "-" : ""}{fmt(item.amount)}
                          </p>
                          <p className="text-xs text-gray-500">/mo</p>
                        </div>
                      </div>

                      {/* Star rating row */}
                      <div
                        className="flex items-center gap-2 px-4 pb-2.5 pt-0"
                        onClick={e => e.stopPropagation()}
                      >
                        <span className="text-[10px] text-gray-600 shrink-0">Worth it?</span>
                        <StarRating
                          value={item.value_rating}
                          onChange={rating => setRating(item.id, rating)}
                        />
                        {savingRating === item.id && (
                          <span className="text-[10px] text-gray-600 ml-1">saving...</span>
                        )}
                        {item.type === "subscription" && (() => {
                          const link = getCancelLink(item.name);
                          return link ? (
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-auto text-[10px] font-semibold text-red-400/70 hover:text-red-400 transition"
                              onClick={e => e.stopPropagation()}
                            >
                              How to cancel &rarr;
                            </a>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick-add missing item */}
          {showQuickAdd ? (
            <div className="mb-4 rounded-2xl border border-brand/30 bg-brand/[0.04] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white">Add a missing item</p>
                <button onClick={() => setShowQuickAdd(false)} className="text-gray-500 hover:text-white">
                  <X size={15} />
                </button>
              </div>
              <div className="space-y-2.5">
                <input
                  autoFocus
                  value={quickForm.name}
                  onChange={e => setQuickForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter" && quickForm.name && quickForm.amount) quickAdd(); }}
                  placeholder="e.g. HBO Max, Rent, Gym…"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-brand/50"
                />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={quickForm.amount}
                      onChange={e => setQuickForm(f => ({ ...f, amount: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter" && quickForm.name && quickForm.amount) quickAdd(); }}
                      placeholder="0.00 /mo"
                      className="w-full rounded-xl border border-white/10 bg-black/30 pl-7 pr-3 py-2.5 text-sm text-white outline-none focus:border-brand/50"
                    />
                  </div>
                  <select
                    value={quickForm.type}
                    onChange={e => setQuickForm(f => ({ ...f, type: e.target.value as typeof f.type }))}
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="subscription">Subscription</option>
                    <option value="bill">Bill</option>
                    <option value="trial">Trial</option>
                  </select>
                </div>
                <button
                  onClick={quickAdd}
                  disabled={!quickForm.name || !quickForm.amount || quickSaving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient py-2.5 text-sm font-bold text-black hover:opacity-90 disabled:opacity-40"
                >
                  {quickSaving ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
                  Add to list
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowQuickAdd(true)}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 py-3 text-sm text-gray-500 hover:border-brand/30 hover:text-brand transition"
            >
              <Plus size={14} /> Add a missing item
            </button>
          )}

          {/* Confirm banner */}
          {selected.size > 0 && (
            <div className="rounded-2xl border border-green-500/25 bg-green-500/10 p-5 text-center">
              <p className="mb-3 text-sm font-semibold text-green-400">
                Cancel {selected.size} item{selected.size > 1 ? "s" : ""} &middot; save {fmt(saved)}/mo &middot; {fmt(annual)}/yr
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
