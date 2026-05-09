"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { X, DollarSign, Calendar, Tag } from "lucide-react";

type ItemType = "subscription" | "bill" | "trial";

interface Props {
  open: boolean;
  defaultType?: ItemType;
  onClose: () => void;
  onAdded?: () => void;
}

const TYPE_OPTIONS: { value: ItemType; label: string; color: string }[] = [
  { value: "subscription", label: "Subscription", color: "#3EA758" },
  { value: "bill", label: "Bill", color: "#FFB300" },
  { value: "trial", label: "Trial", color: "#38BDF8" },
];

const CATEGORIES: Record<ItemType, string[]> = {
  subscription: ["Entertainment", "Music", "News", "Software", "Cloud Storage", "Other"],
  bill: ["Rent", "Mortgage", "Utilities", "Internet", "Phone", "Insurance", "Loan", "Credit Card", "Other"],
  trial: ["Free Trial", "Other"],
};

export default function AddItemModal({ open, defaultType = "subscription", onClose, onAdded }: Props) {
  const supabase = createClient();
  const [type, setType] = useState<ItemType>(defaultType);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState("");
  const [autopay, setAutopay] = useState(false);
  const [trialDays, setTrialDays] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function save() {
    if (!name.trim() || !amount) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const typeOpt = TYPE_OPTIONS.find(o => o.value === type)!;
      await supabase.from("items").insert({
        user_id: user.id,
        name: name.trim(),
        amount: parseFloat(amount),
        type,
        category: category || CATEGORIES[type][0],
        color: typeOpt.color,
        due_date: dueDate || null,
        autopay,
        status: "active",
        trial_days: type === "trial" && trialDays ? parseInt(trialDays) : null,
      });
      // Reset
      setName(""); setAmount(""); setDueDate(""); setCategory(""); setAutopay(false); setTrialDays("");
      onAdded?.();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full sm:max-w-md bg-[#0A0A0F] border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Add Item</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20}/></button>
        </div>

        {/* Type picker */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setType(opt.value)}
              className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition border ${
                type === opt.value
                  ? "border-transparent text-white"
                  : "border-white/10 text-gray-400 hover:border-white/20"
              }`}
              style={type === opt.value ? { background: opt.color } : {}}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Name */}
        <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">Name</label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={type === "subscription" ? "Netflix" : type === "bill" ? "Electric bill" : "Hulu trial"}
          className="w-full mb-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/10 text-white text-sm outline-none focus:border-[#3EA758]/50"
        />

        {/* Amount */}
        <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">Amount</label>
        <div className="relative mb-3">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="9.99"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/10 text-white text-sm outline-none focus:border-[#3EA758]/50"
          />
        </div>

        {/* Due date */}
        <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">Due date</label>
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className="w-full mb-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/10 text-white text-sm outline-none focus:border-[#3EA758]/50"
        />

        {/* Category */}
        <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">Category</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full mb-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/10 text-white text-sm outline-none focus:border-[#3EA758]/50"
        >
          {CATEGORIES[type].map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Trial days */}
        {type === "trial" && (
          <>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">Trial days remaining</label>
            <input
              type="number"
              value={trialDays}
              onChange={e => setTrialDays(e.target.value)}
              placeholder="7"
              className="w-full mb-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/10 text-white text-sm outline-none focus:border-[#3EA758]/50"
            />
          </>
        )}

        {/* Autopay */}
        <label className="flex items-center gap-2 mb-5 cursor-pointer">
          <input type="checkbox" checked={autopay} onChange={e => setAutopay(e.target.checked)} className="w-4 h-4"/>
          <span className="text-sm text-gray-300">Autopay enabled</span>
        </label>

        <button
          onClick={save}
          disabled={!name.trim() || !amount || saving}
          className="w-full py-3 rounded-xl bg-[#3EA758] hover:bg-[#36964e] disabled:opacity-50 text-white font-bold text-sm transition"
        >
          {saving ? "Adding…" : "Add Item"}
        </button>
      </div>
    </div>
  );
}
