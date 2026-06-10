"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Props {
  userId: string;
  onComplete: () => void;
  onDismiss: () => void;
}

const SUBSCRIPTION_CHIPS = [
  { name: "Netflix", amount: "15.99" },
  { name: "Spotify", amount: "9.99" },
  { name: "Hulu", amount: "17.99" },
  { name: "Disney+", amount: "13.99" },
  { name: "Amazon Prime", amount: "14.99" },
  { name: "YouTube Premium", amount: "13.99" },
  { name: "Apple iCloud", amount: "2.99" },
  { name: "HBO Max", amount: "15.99" },
  { name: "Gym", amount: "40.00" },
];

const BILL_CHIPS = [
  { name: "Rent", amount: "1500.00" },
  { name: "Electric", amount: "120.00" },
  { name: "Internet", amount: "79.99" },
  { name: "Phone", amount: "80.00" },
  { name: "Car Insurance", amount: "150.00" },
  { name: "Health Insurance", amount: "200.00" },
  { name: "Gas Bill", amount: "60.00" },
  { name: "Water", amount: "45.00" },
];

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4].map((n) => {
        const done = n < step;
        const active = n === step;
        return (
          <div
            key={n}
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all"
            style={{
              background: done || active ? "#00C853" : "#2a2a2a",
              color: done || active ? "#000" : "#666",
              border: done || active ? "none" : "1px solid #333",
            }}
          >
            {done ? <Check size={12} /> : n}
          </div>
        );
      })}
    </div>
  );
}

export default function SetupWizard({ userId, onComplete, onDismiss }: Props) {
  const supabase = createClient();

  const [step, setStep] = useState(1);

  // Step 1  -  Income
  const [income, setIncome] = useState("");

  // Step 2  -  Subscriptions
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set());
  const [manualSubName, setManualSubName] = useState("");
  const [manualSubAmount, setManualSubAmount] = useState("");
  const [addedSubs, setAddedSubs] = useState<{ name: string; amount: string }[]>([]);

  // Step 3  -  Bills
  const [selectedBills, setSelectedBills] = useState<Set<string>>(new Set());
  const [manualBillName, setManualBillName] = useState("");
  const [manualBillAmount, setManualBillAmount] = useState("");
  const [addedBills, setAddedBills] = useState<{ name: string; amount: string }[]>([]);

  const [saving, setSaving] = useState(false);

  function markDone() {
    try {
      localStorage.setItem(`setup_wizard_done_${userId}`, "true");
    } catch {}
  }

  async function handleStep1Continue() {
    if (income) {
      setSaving(true);
      await supabase
        .from("profiles")
        .update({ monthly_income: parseFloat(income) })
        .eq("id", userId);
      setSaving(false);
    }
    setStep(2);
  }

  function skipStep1() {
    setStep(2);
  }

  async function handleStep2Continue() {
    setSaving(true);
    const items = [
      ...SUBSCRIPTION_CHIPS.filter((c) => selectedSubs.has(c.name)),
      ...addedSubs,
    ];
    if (items.length > 0) {
      await supabase.from("items").insert(
        items.map((item) => ({
          user_id: userId,
          name: item.name,
          amount: parseFloat(item.amount),
          type: "subscription",
          category: "Entertainment",
          color: "#3EA758",
          status: "active",
          autopay: false,
        }))
      );
    }
    setSaving(false);
    setStep(3);
  }

  function skipStep2() {
    setStep(3);
  }

  async function handleStep3Continue() {
    setSaving(true);
    const items = [
      ...BILL_CHIPS.filter((c) => selectedBills.has(c.name)),
      ...addedBills,
    ];
    if (items.length > 0) {
      await supabase.from("items").insert(
        items.map((item) => ({
          user_id: userId,
          name: item.name,
          amount: parseFloat(item.amount),
          type: "bill",
          category: "Entertainment",
          color: "#FFB300",
          status: "active",
          autopay: false,
        }))
      );
    }
    setSaving(false);
    setStep(4);
  }

  function skipStep3() {
    setStep(4);
  }

  function handleComplete() {
    markDone();
    onComplete();
  }

  function handleDismiss() {
    onDismiss();
  }

  const subsCount =
    selectedSubs.size + addedSubs.length;
  const billsCount =
    selectedBills.size + addedBills.length;

  const subsTotal = [
    ...SUBSCRIPTION_CHIPS.filter((c) => selectedSubs.has(c.name)),
    ...addedSubs,
  ].reduce((sum, i) => sum + parseFloat(i.amount || "0"), 0);

  const billsTotal = [
    ...BILL_CHIPS.filter((c) => selectedBills.has(c.name)),
    ...addedBills,
  ].reduce((sum, i) => sum + parseFloat(i.amount || "0"), 0);

  const estimatedMonthly = subsTotal + billsTotal;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0d0d0d] p-6">

        {/* Header row */}
        <div className="mb-5 flex items-center justify-between">
          <ProgressDots step={step} />
          <button
            onClick={handleDismiss}
            className="rounded-lg p-1.5 text-gray-500 hover:text-white hover:bg-white/10 transition"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-6 h-1 w-full rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(step / 4) * 100}%`, background: "#00C853" }}
          />
        </div>

        {/* Step 1  -  Income */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-1">What's your monthly take-home pay?</h2>
            <p className="text-sm text-gray-500 mb-6">Used to calculate what % of your income goes to bills. Never shared.</p>

            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-white/10 bg-black/30 pl-9 pr-4 py-3 text-white text-lg font-semibold outline-none focus:border-[#00C853] transition"
              />
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {["2500", "4000", "5500", "7500"].map((v) => (
                <button
                  key={v}
                  onClick={() => setIncome(v)}
                  className="rounded-xl border px-4 py-2 text-sm font-semibold transition"
                  style={{
                    borderColor: income === v ? "#00C853" : "rgba(255,255,255,0.1)",
                    background: income === v ? "rgba(0,200,83,0.1)" : "transparent",
                    color: income === v ? "#00C853" : "#9ca3af",
                  }}
                >
                  ${parseInt(v).toLocaleString()}
                </button>
              ))}
            </div>

            <button
              onClick={handleStep1Continue}
              disabled={saving}
              className="w-full rounded-xl py-3 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50 mb-3"
              style={{ background: "#00C853" }}
            >
              {saving ? "Saving..." : "Continue"}
            </button>
            <button
              onClick={skipStep1}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Step 2  -  Subscriptions */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Add your subscriptions</h2>
            <p className="text-sm text-gray-500 mb-5">Tap to select the services you pay for.</p>

            <div className="mb-5 flex flex-wrap gap-2">
              {SUBSCRIPTION_CHIPS.map((chip) => {
                const selected = selectedSubs.has(chip.name);
                return (
                  <button
                    key={chip.name}
                    onClick={() => {
                      setSelectedSubs((prev) => {
                        const next = new Set(prev);
                        if (next.has(chip.name)) next.delete(chip.name);
                        else next.add(chip.name);
                        return next;
                      });
                    }}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold transition"
                    style={{
                      border: selected ? "1px solid #00C853" : "1px solid rgba(255,255,255,0.12)",
                      background: selected ? "rgba(0,200,83,0.12)" : "rgba(255,255,255,0.03)",
                      color: selected ? "#00C853" : "#9ca3af",
                    }}
                  >
                    {chip.name} ${chip.amount}
                  </button>
                );
              })}
            </div>

            {/* Manual row */}
            <div className="mb-5 flex items-center gap-2">
              <input
                type="text"
                value={manualSubName}
                onChange={(e) => setManualSubName(e.target.value)}
                placeholder="Name"
                className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#00C853] transition"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualSubAmount}
                  onChange={(e) => setManualSubAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-28 rounded-xl border border-white/10 bg-black/30 pl-7 pr-3 py-2.5 text-sm text-white outline-none focus:border-[#00C853] transition"
                />
              </div>
              <button
                onClick={() => {
                  if (manualSubName && manualSubAmount) {
                    setAddedSubs((prev) => [...prev, { name: manualSubName, amount: manualSubAmount }]);
                    setManualSubName("");
                    setManualSubAmount("");
                  }
                }}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold transition"
                style={{ background: "rgba(0,200,83,0.1)", color: "#00C853", border: "1px solid rgba(0,200,83,0.2)" }}
              >
                + Add
              </button>
            </div>

            {addedSubs.length > 0 && (
              <div className="mb-4 space-y-1">
                {addedSubs.map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
                    <span className="text-gray-300">{s.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">${s.amount}</span>
                      <button
                        onClick={() => setAddedSubs((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-gray-600 hover:text-red-400 transition"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleStep2Continue}
              disabled={saving}
              className="w-full rounded-xl py-3 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50 mb-3"
              style={{ background: "#00C853" }}
            >
              {saving ? "Saving..." : "Continue"}
            </button>
            <button
              onClick={skipStep2}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Step 3  -  Bills */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Add your bills</h2>
            <p className="text-sm text-gray-500 mb-5">Tap to select the bills you pay each month.</p>

            <div className="mb-5 flex flex-wrap gap-2">
              {BILL_CHIPS.map((chip) => {
                const selected = selectedBills.has(chip.name);
                return (
                  <button
                    key={chip.name}
                    onClick={() => {
                      setSelectedBills((prev) => {
                        const next = new Set(prev);
                        if (next.has(chip.name)) next.delete(chip.name);
                        else next.add(chip.name);
                        return next;
                      });
                    }}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold transition"
                    style={{
                      border: selected ? "1px solid #00C853" : "1px solid rgba(255,255,255,0.12)",
                      background: selected ? "rgba(0,200,83,0.12)" : "rgba(255,255,255,0.03)",
                      color: selected ? "#00C853" : "#9ca3af",
                    }}
                  >
                    {chip.name} ${chip.amount}
                  </button>
                );
              })}
            </div>

            {/* Manual row */}
            <div className="mb-5 flex items-center gap-2">
              <input
                type="text"
                value={manualBillName}
                onChange={(e) => setManualBillName(e.target.value)}
                placeholder="Name"
                className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#00C853] transition"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualBillAmount}
                  onChange={(e) => setManualBillAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-28 rounded-xl border border-white/10 bg-black/30 pl-7 pr-3 py-2.5 text-sm text-white outline-none focus:border-[#00C853] transition"
                />
              </div>
              <button
                onClick={() => {
                  if (manualBillName && manualBillAmount) {
                    setAddedBills((prev) => [...prev, { name: manualBillName, amount: manualBillAmount }]);
                    setManualBillName("");
                    setManualBillAmount("");
                  }
                }}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold transition"
                style={{ background: "rgba(0,200,83,0.1)", color: "#00C853", border: "1px solid rgba(0,200,83,0.2)" }}
              >
                + Add
              </button>
            </div>

            {addedBills.length > 0 && (
              <div className="mb-4 space-y-1">
                {addedBills.map((b, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
                    <span className="text-gray-300">{b.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">${b.amount}</span>
                      <button
                        onClick={() => setAddedBills((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-gray-600 hover:text-red-400 transition"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleStep3Continue}
              disabled={saving}
              className="w-full rounded-xl py-3 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50 mb-3"
              style={{ background: "#00C853" }}
            >
              {saving ? "Saving..." : "Continue"}
            </button>
            <button
              onClick={skipStep3}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Step 4  -  Done */}
        {step === 4 && (
          <div className="text-center">
            <div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "rgba(0,200,83,0.15)", border: "2px solid rgba(0,200,83,0.3)" }}
            >
              <Check size={32} style={{ color: "#00C853" }} />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
            <p className="text-sm text-gray-500 mb-6">Your financial picture is taking shape.</p>

            <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Subscriptions added</span>
                <span className="font-bold text-white">{subsCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Bills added</span>
                <span className="font-bold text-white">{billsCount}</span>
              </div>
              {estimatedMonthly > 0 && (
                <div className="flex items-center justify-between text-sm pt-2 border-t border-white/5">
                  <span className="text-gray-400">Estimated monthly</span>
                  <span className="font-bold" style={{ color: "#00C853" }}>
                    ${estimatedMonthly.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleComplete}
              className="w-full rounded-xl py-3 text-sm font-bold text-black transition hover:opacity-90"
              style={{ background: "#00C853" }}
            >
              Go to my dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
