"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { CreditCard, Plus, Trash2, X, Check, AlertTriangle } from "lucide-react";
import HelpTip from "@/components/HelpTip";

interface Card {
  id: string;
  name: string;
  last_four: string | null;
  credit_limit: number;
  current_balance: number;
  due_date: string | null;
  min_payment: number | null;
  apr: number | null;
  color: string;
}

const CARD_COLORS = ["#38BDF8", "#3EA758", "#FFB300", "#FF6B35", "#AF52DE", "#FF2D55", "#5856D6"];

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ordinal(day: string) {
  const n = parseInt(day);
  if ([11, 12, 13].includes(n)) return day + "th";
  if (day.endsWith("1")) return day + "st";
  if (day.endsWith("2")) return day + "nd";
  if (day.endsWith("3")) return day + "rd";
  return day + "th";
}

function UtilBar({ balance, limit }: { balance: number; limit: number }) {
  const pct = limit > 0 ? Math.min(Math.round((balance / limit) * 100), 100) : 0;
  const color = pct > 70 ? "#FF3B30" : pct > 30 ? "#FFB300" : "#3EA758";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color }}>{pct}% used</span>
        <span className="text-gray-500">{fmt(limit)} limit</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function CardTile({ card, onUpdateBalance, onDelete }: {
  card: Card;
  onUpdateBalance: (id: string, val: string) => void;
  onDelete: (id: string) => void;
}) {
  const [balInput, setBalInput] = useState(String(card.current_balance));
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const pct = card.credit_limit > 0 ? Math.min(Math.round((card.current_balance / card.credit_limit) * 100), 100) : 0;
  const available = Math.max(0, card.credit_limit - card.current_balance);

  function save() {
    onUpdateBalance(card.id, balInput);
    setEditing(false);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 relative group">
      {confirmDelete ? (
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button onClick={() => onDelete(card.id)} className="text-xs text-red-400 hover:text-red-300 font-semibold">Delete</button>
          <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500 hover:text-white">Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="absolute top-3 right-3 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
        >
          <Trash2 size={14} />
        </button>
      )}

      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: card.color + "25" }}>
          <CreditCard size={18} style={{ color: card.color }} />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-white truncate">{card.name}</p>
          <p className="text-xs text-gray-500">
            {card.last_four ? `···· ${card.last_four}` : "No card number"}
            {card.due_date ? ` · Due the ${ordinal(card.due_date)}` : ""}
          </p>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-0.5">Current balance</p>
        {editing ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xl font-bold">$</span>
            <input
              autoFocus
              type="number"
              value={balInput}
              onChange={e => setBalInput(e.target.value)}
              onBlur={save}
              onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
              className="w-32 bg-transparent text-2xl font-black outline-none border-b border-[#38BDF8] text-white"
            />
            <button onClick={save} className="text-brand"><Check size={16} /></button>
          </div>
        ) : (
          <button onClick={() => { setEditing(true); setBalInput(String(card.current_balance)); }} className="text-left group/bal">
            <span className="text-2xl font-black text-white">{fmt(card.current_balance)}</span>
            <span className="ml-2 text-xs text-[#38BDF8] opacity-0 group-hover/bal:opacity-100 transition">edit</span>
          </button>
        )}
      </div>

      <UtilBar balance={card.current_balance} limit={card.credit_limit} />

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 flex-wrap gap-1">
        <span>{fmt(available)} available</span>
        <div className="flex gap-3">
          {card.min_payment ? <span>Min: {fmt(card.min_payment)}</span> : null}
          {card.apr ? <span>{card.apr}% APR</span> : null}
        </div>
      </div>

      {pct > 30 && (
        <p className="mt-3 text-xs flex items-center gap-1" style={{ color: pct > 70 ? "#FF3B30" : "#FFB300" }}>
          <AlertTriangle size={11} />
          {pct > 70 ? "High utilization — pay down to boost your score" : "Try to stay under 30% for best credit impact"}
        </p>
      )}
    </div>
  );
}

function calcPayoff(
  cards: Card[],
  extraPerMonth: number,
  method: "snowball" | "avalanche"
): { months: number; totalInterest: number } | null {
  const work = cards
    .filter(c => c.current_balance > 0)
    .map(c => ({
      balance: c.current_balance,
      apr: c.apr || 18,
      minPay: c.min_payment || Math.max(25, c.current_balance * 0.02),
    }));
  if (!work.length) return null;
  if (method === "snowball") work.sort((a, b) => a.balance - b.balance);
  else work.sort((a, b) => b.apr - a.apr);

  let months = 0;
  let totalInterest = 0;
  while (work.some(w => w.balance > 0.01) && months < 600) {
    months++;
    let extra = extraPerMonth;
    // Apply interest + pay minimums
    for (const w of work) {
      if (w.balance <= 0) continue;
      const interest = w.balance * (w.apr / 100 / 12);
      w.balance += interest;
      totalInterest += interest;
      const pay = Math.min(w.minPay, w.balance);
      w.balance = Math.max(0, w.balance - pay);
    }
    // Snowball: add freed minimum payment to extra
    for (const w of work) {
      if (w.balance <= 0.01 && w.balance > 0) { extra += w.minPay; w.balance = 0; }
    }
    // Apply extra to first card with balance
    for (const w of work) {
      if (w.balance <= 0) continue;
      const pay = Math.min(extra, w.balance);
      w.balance = Math.max(0, w.balance - pay);
      break;
    }
  }
  if (months >= 600) return null;
  return { months, totalInterest };
}

function DebtPayoffPlanner({ cards }: { cards: Card[] }) {
  const [extra, setExtra] = useState("0");
  const [method, setMethod] = useState<"snowball" | "avalanche">("avalanche");

  const totalBalance = cards.reduce((a, c) => a + c.current_balance, 0);
  const extraNum = parseFloat(extra) || 0;
  const result = calcPayoff(cards, extraNum, method);
  const baseline = calcPayoff(cards, 0, method);

  function monthsToDate(months: number) {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  const savedMonths = baseline && result ? baseline.months - result.months : 0;
  const savedInterest = baseline && result ? baseline.totalInterest - result.totalInterest : 0;

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Debt Payoff Planner</p>

      {/* Method */}
      <div className="flex gap-2 mb-4">
        {(["avalanche", "snowball"] as const).map(m => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold capitalize transition ${method === m ? "bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
          >
            {m}
            <span className="block text-[10px] font-normal mt-0.5 opacity-60">
              {m === "avalanche" ? "Highest APR first — saves most interest" : "Lowest balance first — fastest wins"}
            </span>
          </button>
        ))}
      </div>

      {/* Extra payment input */}
      <div className="mb-5">
        <label className="text-xs text-gray-400 mb-1.5 block">Extra monthly payment beyond minimums</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
          <input
            type="number"
            min="0"
            value={extra}
            onChange={e => setExtra(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 pl-7 pr-3 py-2.5 text-sm text-white outline-none focus:border-[#38BDF8]/50"
            placeholder="0"
          />
        </div>
      </div>

      {/* Results */}
      {result ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#38BDF8]/5 border border-[#38BDF8]/15 p-3">
              <p className="text-xs text-gray-500 mb-1">Debt-free date</p>
              <p className="text-sm font-bold text-white">{monthsToDate(result.months)}</p>
              <p className="text-xs text-[#38BDF8]">{result.months} months</p>
            </div>
            <div className="rounded-xl bg-white/[0.02] border border-white/10 p-3">
              <p className="text-xs text-gray-500 mb-1">Total interest paid</p>
              <p className="text-sm font-bold text-white">${result.totalInterest.toFixed(0)}</p>
              <p className="text-xs text-gray-500">on ${totalBalance.toFixed(0)} balance</p>
            </div>
          </div>

          {savedMonths > 0 && (
            <div className="rounded-xl bg-green-500/5 border border-green-500/15 p-3">
              <p className="text-xs font-semibold text-green-400">
                Your extra ${extraNum}/mo saves {savedMonths} month{savedMonths !== 1 ? "s" : ""} and ${savedInterest.toFixed(0)} in interest
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500 text-center py-4">
          Add APR and minimum payment to each card to see your payoff plan.
        </p>
      )}
    </div>
  );
}

const EMPTY_FORM = {
  name: "", last_four: "", credit_limit: "", current_balance: "",
  due_date: "", min_payment: "", apr: "", color: CARD_COLORS[0],
};

export default function CreditPage() {
  const router = useRouter();
  const supabase = createClient();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data } = await supabase
      .from("credit_cards")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setCards(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addCard(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("credit_cards").insert({
      user_id: user.id,
      name: form.name.trim(),
      last_four: form.last_four.trim() || null,
      credit_limit: parseFloat(form.credit_limit) || 0,
      current_balance: parseFloat(form.current_balance) || 0,
      due_date: form.due_date.trim() || null,
      min_payment: parseFloat(form.min_payment) || null,
      apr: parseFloat(form.apr) || null,
      color: form.color,
    });
    setForm(EMPTY_FORM);
    setShowAdd(false);
    setSaving(false);
    load();
  }

  async function updateBalance(id: string, val: string) {
    const n = parseFloat(val);
    if (isNaN(n)) return;
    await supabase.from("credit_cards").update({ current_balance: n }).eq("id", id);
    setCards(prev => prev.map(c => c.id === id ? { ...c, current_balance: n } : c));
  }

  async function deleteCard(id: string) {
    await supabase.from("credit_cards").delete().eq("id", id);
    setCards(prev => prev.filter(c => c.id !== id));
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-500">Loading...</div>;

  const totalBalance = cards.reduce((s, c) => s + (c.current_balance || 0), 0);
  const totalLimit = cards.reduce((s, c) => s + (c.credit_limit || 0), 0);
  const overallPct = totalLimit > 0 ? Math.min(Math.round((totalBalance / totalLimit) * 100), 100) : 0;
  const overallColor = overallPct > 70 ? "#FF3B30" : overallPct > 30 ? "#FFB300" : "#3EA758";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">

      <HelpTip
        storageKey="credit_utilization"
        title="Credit utilization — the number that matters most"
        color="#38BDF8"
        body={
          <>
            <p>Utilization is how much of your credit limit you&apos;re using. It makes up about 30% of your credit score — second only to payment history.</p>
            <p className="mt-1"><span className="text-[#3EA758] font-semibold">Under 10%</span> is excellent. <span className="text-[#FFB300] font-semibold">10–30%</span> is good. Above 30% starts dragging your score down — even if you pay on time every month.</p>
            <p className="mt-1">To improve: pay down your highest-utilization card first, or ask your card issuer for a credit limit increase (which lowers your percentage without paying anything).</p>
            <p className="mt-1">Tap any card&apos;s balance to update it after you make a payment.</p>
          </>
        }
      />

      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <CreditCard className="text-[#38BDF8]" size={24} />
          <h1 className="text-2xl font-bold text-white">Credit Cards</h1>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 text-[#38BDF8] px-4 py-2 text-sm font-semibold transition"
        >
          <Plus size={16} /> Add Card
        </button>
      </div>

      {cards.length > 0 && (
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Overall</p>
          <div className="flex items-end justify-between mb-3 flex-wrap gap-2">
            <div>
              <p className="text-3xl font-black text-white">{fmt(totalBalance)}</p>
              <p className="text-sm text-gray-400">total balance across {cards.length} card{cards.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: overallColor }}>{overallPct}%</p>
              <p className="text-xs text-gray-500">of {fmt(totalLimit)} total limit</p>
            </div>
          </div>
          <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${overallPct}%`, background: overallColor }} />
          </div>
          {overallPct > 30 && (
            <p className="mt-3 text-xs flex items-center gap-1.5" style={{ color: overallColor }}>
              <AlertTriangle size={12} />
              {overallPct > 70
                ? "Your overall utilization is high. Paying down balances will help your credit score."
                : "Utilization above 30% can lower your credit score. Aim to pay balances down."}
            </p>
          )}
        </div>
      )}

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <CreditCard size={36} className="mx-auto mb-3 text-gray-600" />
          <p className="text-white font-semibold mb-1">No credit cards yet</p>
          <p className="text-sm text-gray-500 mb-5">Add your cards to track balances, utilization, and due dates.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 text-[#38BDF8] px-5 py-2.5 text-sm font-semibold transition"
          >
            <Plus size={14} /> Add your first card
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map(card => (
            <CardTile key={card.id} card={card} onUpdateBalance={updateBalance} onDelete={deleteCard} />
          ))}
        </div>
      )}

      {/* ── Debt Payoff Planner ─────────────────────────────────────────────── */}
      {cards.some(c => c.current_balance > 0) && (
        <DebtPayoffPlanner cards={cards} />
      )}

      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4 pb-4 sm:pb-0"
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <p className="font-bold text-white">Add Credit Card</p>
              <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={addCard} className="p-5 space-y-3 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Card name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Chase Sapphire Reserve"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#38BDF8]/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Last 4 digits</label>
                  <input
                    maxLength={4}
                    value={form.last_four}
                    onChange={e => setForm(f => ({ ...f, last_four: e.target.value.replace(/\D/g, "") }))}
                    placeholder="4321"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#38BDF8]/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Payment due (day #)</label>
                  <input
                    value={form.due_date}
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value.replace(/\D/g, "") }))}
                    placeholder="15"
                    maxLength={2}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#38BDF8]/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Credit limit *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="any"
                    value={form.credit_limit}
                    onChange={e => setForm(f => ({ ...f, credit_limit: e.target.value }))}
                    placeholder="8000"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#38BDF8]/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Current balance</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.current_balance}
                    onChange={e => setForm(f => ({ ...f, current_balance: e.target.value }))}
                    placeholder="1250"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#38BDF8]/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Min. payment</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.min_payment}
                    onChange={e => setForm(f => ({ ...f, min_payment: e.target.value }))}
                    placeholder="25"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#38BDF8]/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">APR (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.apr}
                    onChange={e => setForm(f => ({ ...f, apr: e.target.value }))}
                    placeholder="24.99"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#38BDF8]/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Card color</label>
                <div className="flex gap-2 flex-wrap">
                  {CARD_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className="w-7 h-7 rounded-full border-2 transition"
                      style={{ background: c, borderColor: form.color === c ? "white" : "transparent" }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg py-3 font-semibold text-black text-sm bg-brand-gradient hover:opacity-90 disabled:opacity-50 transition mt-1"
              >
                {saving ? "Adding..." : "Add Card"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
