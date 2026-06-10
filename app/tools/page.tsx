"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ChevronDown, ChevronUp, DollarSign, Calculator, ArrowRight } from "lucide-react";

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Subscription Calculator ──────────────────────────────────────────────────

const PRESET_SUBS = [
  { name: "Netflix",       amount: 15.99 },
  { name: "Hulu",          amount: 17.99 },
  { name: "Disney+",       amount: 13.99 },
  { name: "Spotify",       amount: 9.99  },
  { name: "Apple Music",   amount: 10.99 },
  { name: "Amazon Prime",  amount: 14.99 },
  { name: "HBO Max",       amount: 15.99 },
  { name: "YouTube Premium",amount: 13.99 },
  { name: "Apple TV+",     amount: 9.99  },
  { name: "Peacock",       amount: 7.99  },
  { name: "Paramount+",    amount: 9.99  },
  { name: "ESPN+",         amount: 10.99 },
  { name: "iCloud+",       amount: 2.99  },
  { name: "Google One",    amount: 2.99  },
  { name: "Dropbox",       amount: 11.99 },
  { name: "Adobe CC",      amount: 54.99 },
  { name: "Microsoft 365", amount: 9.99  },
  { name: "ChatGPT Plus",  amount: 20.00 },
  { name: "Duolingo Plus", amount: 12.99 },
  { name: "Calm",          amount: 14.99 },
];

interface Sub {
  id: number;
  name: string;
  amount: string;
}

function SubCalculator() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [custom, setCustom] = useState<Sub[]>([]);
  const [nextId, setNextId] = useState(1);
  const [showPresets, setShowPresets] = useState(true);
  const [customName, setCustomName] = useState("");
  const [customAmount, setCustomAmount] = useState("");

  function togglePreset(name: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function addCustom() {
    if (!customName || !customAmount) return;
    setCustom(prev => [...prev, { id: nextId, name: customName, amount: customAmount }]);
    setNextId(n => n + 1);
    setCustomName("");
    setCustomAmount("");
  }

  function removeCustom(id: number) {
    setCustom(prev => prev.filter(c => c.id !== id));
  }

  const presetTotal = PRESET_SUBS
    .filter(p => selected.has(p.name))
    .reduce((a, b) => a + b.amount, 0);

  const customTotal = custom.reduce((a, b) => a + (parseFloat(b.amount) || 0), 0);
  const monthly = presetTotal + customTotal;
  const yearly = monthly * 12;
  const count = selected.size + custom.length;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
            <Calculator size={18} className="text-brand" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Subscription Cost Calculator</h2>
            <p className="text-sm text-gray-400">Check everything you pay for. See the real yearly cost.</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Preset grid */}
        <div>
          <button
            onClick={() => setShowPresets(o => !o)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white mb-3"
          >
            Common services
            {showPresets ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showPresets && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {PRESET_SUBS.map(p => {
                const on = selected.has(p.name);
                return (
                  <button
                    key={p.name}
                    onClick={() => togglePreset(p.name)}
                    className="flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition"
                    style={{
                      borderColor: on ? "#3EA758" : "rgba(255,255,255,0.08)",
                      background: on ? "rgba(62,167,88,0.12)" : "rgba(255,255,255,0.02)",
                    }}
                  >
                    <span className={on ? "font-semibold text-white" : "text-gray-300"}>{p.name}</span>
                    <span className={on ? "text-brand font-bold" : "text-gray-500"}>${p.amount}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom row */}
        <div>
          <p className="mb-2 text-sm font-semibold text-gray-300">Add your own</p>
          <div className="flex gap-2">
            <input
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addCustom(); }}
              placeholder="Service name"
              className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
            <div className="relative w-28">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                type="number"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addCustom(); }}
                placeholder="0.00"
                className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-6 pr-3 text-sm outline-none focus:border-brand"
              />
            </div>
            <button
              onClick={addCustom}
              disabled={!customName || !customAmount}
              className="flex items-center gap-1.5 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-black disabled:opacity-40"
            >
              <Plus size={14} /> Add
            </button>
          </div>

          {custom.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {custom.map(c => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                  <span className="text-sm">{c.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">${c.amount}/mo</span>
                    <button onClick={() => removeCustom(c.id)} className="text-gray-600 hover:text-red-400">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Result */}
        <div className={`rounded-2xl border p-5 transition-all ${count > 0 ? "border-brand/30 bg-brand/5" : "border-white/5 bg-white/[0.02]"}`}>
          {count === 0 ? (
            <p className="text-center text-sm text-gray-500">Select at least one service to see your total.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Services</p>
                  <p className="text-2xl font-black">{count}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Per month</p>
                  <p className="text-2xl font-black text-brand">{fmt(monthly)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Per year</p>
                  <p className="text-2xl font-black text-red-400">{fmt(yearly)}</p>
                </div>
              </div>
              <p className="text-center text-sm text-gray-400 mb-4">
                You&apos;re spending <span className="font-bold text-white">{fmt(yearly)}</span> a year on subscriptions.
                {yearly > 600 && " Most people forget half of these."}
              </p>
              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-brand-gradient py-3 text-sm font-bold text-black hover:opacity-90"
              >
                Find what you actually pay in your bank <ArrowRight size={15} />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Budget Planner ───────────────────────────────────────────────────────────

interface BillRow {
  id: number;
  name: string;
  amount: string;
}

function BudgetPlanner() {
  const [income, setIncome] = useState("");
  const [bills, setBills] = useState<BillRow[]>([
    { id: 1, name: "", amount: "" },
  ]);
  const [nextId, setNextId] = useState(2);

  function addRow() {
    setBills(prev => [...prev, { id: nextId, name: "", amount: "" }]);
    setNextId(n => n + 1);
  }

  function updateRow(id: number, field: "name" | "amount", val: string) {
    setBills(prev => prev.map(b => b.id === id ? { ...b, [field]: val } : b));
  }

  function removeRow(id: number) {
    setBills(prev => prev.filter(b => b.id !== id));
  }

  const totalIncome = parseFloat(income) || 0;
  const totalBills = bills.reduce((a, b) => a + (parseFloat(b.amount) || 0), 0);
  const remaining = totalIncome - totalBills;
  const pct = totalIncome > 0 ? Math.min(Math.round((totalBills / totalIncome) * 100), 100) : 0;
  const hasData = totalIncome > 0 && totalBills > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
            <DollarSign size={18} className="text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Budget Planner</h2>
            <p className="text-sm text-gray-400">Enter your income and bills. See exactly what&apos;s left.</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Income */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-300">Monthly take-home income</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-gray-400">$</span>
            <input
              type="number"
              value={income}
              onChange={e => setIncome(e.target.value)}
              placeholder="5,000"
              className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-8 pr-4 text-lg font-bold outline-none focus:border-brand"
            />
          </div>
        </div>

        {/* Bills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-300">Monthly bills &amp; expenses</label>
            <button
              onClick={addRow}
              className="flex items-center gap-1 text-xs font-semibold text-brand hover:opacity-80"
            >
              <Plus size={12} /> Add row
            </button>
          </div>
          <div className="space-y-2">
            {bills.map((b, i) => (
              <div key={b.id} className="flex gap-2">
                <input
                  value={b.name}
                  onChange={e => updateRow(b.id, "name", e.target.value)}
                  placeholder={["Rent / Mortgage", "Car payment", "Utilities", "Groceries", "Insurance"][i] || "Bill name"}
                  className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    value={b.amount}
                    onChange={e => updateRow(b.id, "amount", e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-6 pr-3 text-sm outline-none focus:border-brand"
                  />
                </div>
                {bills.length > 1 && (
                  <button onClick={() => removeRow(b.id)} className="rounded-xl p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addRow}
            className="mt-2 w-full rounded-xl border border-dashed border-white/10 py-2.5 text-xs text-gray-500 hover:border-brand/30 hover:text-brand transition"
          >
            + Add another
          </button>
        </div>

        {/* Result */}
        <div className={`rounded-2xl border p-5 transition-all ${hasData ? (remaining >= 0 ? "border-brand/30 bg-brand/5" : "border-red-500/30 bg-red-500/5") : "border-white/5 bg-white/[0.02]"}`}>
          {!hasData ? (
            <p className="text-center text-sm text-gray-500">Fill in your income and at least one bill to see your budget.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Income</p>
                  <p className="text-xl font-black text-brand">{fmt(totalIncome)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Bills</p>
                  <p className="text-xl font-black text-yellow-400">{fmt(totalBills)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Left over</p>
                  <p className={`text-xl font-black ${remaining >= 0 ? "text-brand" : "text-red-400"}`}>
                    {remaining >= 0 ? fmt(remaining) : `-${fmt(Math.abs(remaining))}`}
                  </p>
                </div>
              </div>

              <div className="mb-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: pct > 90 ? "#FF3B30" : pct > 70 ? "#FFB300" : "#3EA758",
                    }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-xs text-gray-500">
                  <span>{pct}% of income going to bills</span>
                  <span>{100 - pct}% remaining</span>
                </div>
              </div>

              <p className="text-center text-sm text-gray-400 mb-4">
                {remaining < 0
                  ? `You're ${fmt(Math.abs(remaining))} over budget. Something needs to go.`
                  : pct > 70
                  ? `${pct}% of your income is already committed. Most financial experts recommend under 50%.`
                  : `You have ${fmt(remaining)} left after bills  -  that's ${100 - pct}% of your income.`}
              </p>

              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-brand-gradient py-3 text-sm font-bold text-black hover:opacity-90"
              >
                Track this automatically in Life Admin <ArrowRight size={15} />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">

      {/* Tools Hub */}
      <h1 className="text-3xl font-black text-white mb-2">Tools</h1>
      <p className="text-sm text-gray-500 mb-8">AI features, insights, education, and financial utilities.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { href:"/autoai",      color:"#AF52DE", label:"AutoAI",         desc:"AI scans your bank automatically" },
          { href:"/negotiation", color:"#FF6B35", label:"Negotiation",    desc:"Scripts to lower your bills" },
          { href:"/insights",    color:"#AF52DE", label:"Insights",       desc:"Spending patterns and trends" },
          { href:"/rewards",     color:"#F5C518", label:"Rewards",        desc:"Points and cashback tracker" },
          { href:"/report",      color:"#38BDF8", label:"Monthly Report", desc:"Full breakdown each month" },
          { href:"/wrapped",     color:"#F5C518", label:"Year Review",    desc:"Your financial year in review" },
          { href:"/school",      color:"#38BDF8", label:"School",         desc:"Learn personal finance basics" },
          { href:"/household",   color:"#30D158", label:"Household",      desc:"Share finances with family" },
        ].map(card => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition"
            style={{ textDecoration:"none" }}
          >
            <div
              className="rounded-full mb-3"
              style={{
                width: 20,
                height: 20,
                background: card.color + "26",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                className="rounded-full"
                style={{ width: 10, height: 10, background: card.color }}
              />
            </div>
            <p className="text-sm font-semibold text-white">{card.label}</p>
            <p className="text-xs text-gray-500 mt-1">{card.desc}</p>
          </Link>
        ))}
      </div>

      <div className="border-t border-white/[0.08] my-8" />

      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-300">
          Free tools  -  no account required
        </div>
        <h1 className="text-4xl font-bold md:text-5xl">
          Free money tools
        </h1>
        <p className="mt-4 text-gray-400 max-w-xl mx-auto">
          Use these calculators to see exactly where your money is going.
          No signup, no email, no catch.
        </p>
      </div>

      <div className="space-y-8">
        <SubCalculator />
        <BudgetPlanner />
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 rounded-2xl border border-brand/20 bg-brand/5 p-8 text-center">
        <h3 className="text-2xl font-bold mb-2">Want this done automatically?</h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          Life Admin connects to your bank and does all of this for you  -  finding every subscription,
          calculating your budget, and alerting you before anything hits.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-xl bg-brand-gradient px-8 py-3.5 font-semibold text-black hover:opacity-90"
          >
            Start free  -  no card required
          </Link>
          <a
            href="https://apps.apple.com/app/id6762589970"
            className="rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 font-semibold hover:bg-white/10"
          >
            Download iOS App
          </a>
        </div>
      </div>
    </div>
  );
}
