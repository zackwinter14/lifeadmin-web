"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, CreditCard, Zap, ShoppingCart, X, DollarSign } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type ItemType = "subscription" | "bill" | "expense" | "trial";

interface Item {
  id: string;
  name: string;
  amount: number;
  type: ItemType;
  category: string | null;
  color: string | null;
  due_date: string | null;
  autopay: boolean | null;
  status: string | null;
  source: string | null;
}

interface RecurringTx {
  merchant_name: string;
  clean_merchant_name: string | null;
  frequency: string | null;
  last_amount: number | null;
  average_amount: number | null;
  next_predicted_date: string | null;
  category: string | null;
}

// ── Column config ──────────────────────────────────────────────────────────────
const COLUMNS = [
  {
    id: "subscription" as const,
    label: "Subscriptions",
    icon: Zap,
    color: "#a78bfa",
    types: ["subscription", "trial"] as ItemType[],
    addLabel: "Add Subscription",
    placeholder: "Netflix",
    categories: [
      "Entertainment", "Music", "News", "Software", "Cloud Storage",
      "Health & Fitness", "Gaming", "Other",
    ],
  },
  {
    id: "bill" as const,
    label: "Bills",
    icon: CreditCard,
    color: "#60a5fa",
    types: ["bill"] as ItemType[],
    addLabel: "Add Bill",
    placeholder: "Electric bill",
    categories: [
      "Mortgage", "Rent", "Utilities", "Internet", "Phone",
      "Insurance", "Credit Card", "Car Note", "Loan", "Other",
    ],
  },
  {
    id: "expense" as const,
    label: "Expenses",
    icon: ShoppingCart,
    color: "#34d399",
    types: ["expense"] as ItemType[],
    addLabel: "Add Expense",
    placeholder: "Walmart",
    categories: [
      "Groceries", "Dining", "Shopping", "Transportation", "Health",
      "Entertainment", "Travel", "Personal Care", "Other",
    ],
  },
] as const;

type ColId = typeof COLUMNS[number]["id"];

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt$(n: number) {
  return "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function fmtDate(d: string | null) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return null;
  }
}

const FREQ_MAP: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 wks",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annually: "Yearly",
  semi_monthly: "Twice/mo",
};

// ── Page ───────────────────────────────────────────────────────────────────────
export default function TrackerPage() {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState<Item[]>([]);
  const [recurring, setRecurring] = useState<RecurringTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<ColId | null>(null);
  const [addCol, setAddCol] = useState<typeof COLUMNS[number] | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const [{ data: itemsData }, { data: recurringData }] = await Promise.all([
        supabase
          .from("items")
          .select("id,name,amount,type,category,color,due_date,autopay,status,source")
          .eq("user_id", user.id)
          .neq("status", "cancelled"),
        supabase
          .from("recurring_transactions")
          .select("merchant_name,clean_merchant_name,frequency,last_amount,average_amount,next_predicted_date,category")
          .eq("user_id", user.id)
          .eq("is_active", true),
      ]);

      setItems((itemsData as Item[]) ?? []);
      setRecurring((recurringData as RecurringTx[]) ?? []);
      setLoading(false);
    }
    init();
  }, []);

  // ── Drag handlers ────────────────────────────────────────────────────────────
  function onDragStart(e: React.DragEvent, id: string) {
    setDragging(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }

  function onDragEnd() {
    setDragging(null);
    setDragOver(null);
  }

  function onDragOver(e: React.DragEvent, colId: ColId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(colId);
  }

  async function onDrop(e: React.DragEvent, colId: ColId) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setDragging(null);
    setDragOver(null);
    if (!id) return;
    const newType: ItemType = colId === "subscription" ? "subscription" : colId;
    setItems(prev => prev.map(i => i.id === id ? { ...i, type: newType } : i));
    await supabase.from("items").update({ type: newType }).eq("id", id);
  }

  // ── Recurring lookup ─────────────────────────────────────────────────────────
  function getRecurring(name: string) {
    const lc = name.toLowerCase();
    return recurring.find(r => {
      const rn = (r.clean_merchant_name ?? r.merchant_name ?? "").toLowerCase();
      return rn.length > 2 && (rn.includes(lc) || lc.includes(rn));
    });
  }

  // ── Totals ───────────────────────────────────────────────────────────────────
  const totals = COLUMNS.reduce<Record<ColId, number>>((acc, col) => {
    acc[col.id] = items
      .filter(i => (col.types as readonly string[]).includes(i.type))
      .reduce((s, i) => s + (i.amount ?? 0), 0);
    return acc;
  }, {} as Record<ColId, number>);

  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="border-b border-white/5 px-6 py-5">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-1.5 flex items-center gap-2 text-sm">
                <Link href="/finances" className="text-gray-500 transition hover:text-white">
                  Finances
                </Link>
                <span className="text-gray-700">/</span>
                <span className="text-gray-300">Tracker</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Expense Tracker</h1>
              <p className="mt-0.5 text-sm text-gray-500">
                Drag cards between columns to reclassify them
              </p>
            </div>

            {/* Summary bar */}
            <div className="flex flex-wrap items-center gap-5">
              {COLUMNS.map(col => (
                <div key={col.id} className="text-right">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: col.color }} />
                    <span className="text-xs text-gray-500">{col.label}</span>
                  </div>
                  <div className="text-sm font-bold">
                    {fmt$(totals[col.id] ?? 0)}
                    <span className="ml-0.5 text-xs font-normal text-gray-600">/mo</span>
                  </div>
                </div>
              ))}
              <div className="h-8 w-px bg-white/10" />
              <div className="text-right">
                <div className="text-xs text-gray-500">Total monthly</div>
                <div className="text-sm font-bold">
                  {fmt$(grandTotal)}
                  <span className="ml-0.5 text-xs font-normal text-gray-600">/mo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Board ──────────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {COLUMNS.map(col => {
            const colItems = items.filter(i =>
              (col.types as readonly string[]).includes(i.type)
            );
            const isOver = dragOver === col.id;

            return (
              <div
                key={col.id}
                onDragOver={e => onDragOver(e, col.id)}
                onDrop={e => onDrop(e, col.id)}
                onDragLeave={() => setDragOver(null)}
                className="flex flex-col rounded-2xl border transition-colors duration-100"
                style={{
                  minHeight: 520,
                  borderColor: isOver ? col.color + "55" : "rgba(255,255,255,0.07)",
                  background: isOver ? col.color + "07" : "rgba(255,255,255,0.015)",
                }}
              >
                {/* Column header */}
                <div
                  className="flex items-center justify-between border-b px-4 py-3"
                  style={{ borderColor: "rgba(255,255,255,0.05)" }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ background: col.color + "18" }}
                    >
                      <col.icon size={14} style={{ color: col.color }} />
                    </div>
                    <span className="text-sm font-semibold">{col.label}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                      style={{ background: col.color + "18", color: col.color }}
                    >
                      {colItems.length}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-600">
                      monthly
                    </div>
                    <div className="text-sm font-bold">{fmt$(totals[col.id] ?? 0)}</div>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex flex-1 flex-col gap-2.5 p-3">
                  {colItems.length === 0 && (
                    <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                      <div className="mb-2 opacity-20" style={{ color: col.color }}>
                        <col.icon size={30} />
                      </div>
                      <p className="text-xs text-gray-600">No {col.label.toLowerCase()} yet</p>
                      <p className="mt-0.5 text-xs text-gray-700">Drag items here or add below</p>
                    </div>
                  )}

                  {colItems.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      rec={getRecurring(item.name)}
                      colColor={col.color}
                      isDragging={dragging === item.id}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                    />
                  ))}
                </div>

                {/* Add button */}
                <div className="p-3 pt-0">
                  <button
                    onClick={() => setAddCol(col)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed py-2.5 text-xs font-semibold transition hover:opacity-70"
                    style={{ borderColor: col.color + "35", color: col.color + "99" }}
                  >
                    <Plus size={12} />
                    {col.addLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Add modal ──────────────────────────────────────────────────────────── */}
      {addCol && (
        <AddModal
          col={addCol}
          onClose={() => setAddCol(null)}
          onAdded={newItem => {
            setItems(prev => [...prev, newItem]);
            setAddCol(null);
          }}
        />
      )}
    </div>
  );
}

// ── Item Card ──────────────────────────────────────────────────────────────────
function ItemCard({
  item,
  rec,
  colColor,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  item: Item;
  rec: RecurringTx | undefined;
  colColor: string;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
}) {
  const dotColor = item.color ?? colColor;

  // Build info chips
  const chips: { label: string; value: string }[] = [];
  if (item.category) chips.push({ label: "Category", value: item.category });
  if (item.due_date) chips.push({ label: "Due", value: fmtDate(item.due_date) ?? item.due_date });
  if (rec?.frequency) {
    const freqLabel = FREQ_MAP[rec.frequency.toLowerCase()] ?? rec.frequency;
    chips.push({ label: "Frequency", value: freqLabel });
  }
  if (rec?.next_predicted_date) {
    chips.push({ label: "Next charge", value: fmtDate(rec.next_predicted_date) ?? rec.next_predicted_date });
  }
  if (rec?.last_amount != null && Math.abs(rec.last_amount - (item.amount ?? 0)) > 0.5) {
    chips.push({ label: "Last charged", value: fmt$(rec.last_amount) });
  }
  if (
    rec?.average_amount != null &&
    rec.last_amount != null &&
    Math.abs(rec.average_amount - rec.last_amount) > 0.5
  ) {
    chips.push({ label: "Avg charge", value: fmt$(rec.average_amount) });
  }

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, item.id)}
      onDragEnd={onDragEnd}
      className="select-none rounded-xl border p-3.5 transition-all duration-100"
      style={{
        cursor: isDragging ? "grabbing" : "grab",
        borderColor: isDragging ? colColor + "50" : "rgba(255,255,255,0.07)",
        background: isDragging ? colColor + "10" : "rgba(255,255,255,0.03)",
        opacity: isDragging ? 0.4 : 1,
        transform: isDragging ? "scale(0.97)" : "scale(1)",
      }}
    >
      {/* Name + amount */}
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full"
            style={{ background: dotColor }}
          />
          <span className="truncate text-sm font-semibold leading-tight">{item.name}</span>
        </div>
        <span className="flex-shrink-0 text-sm font-bold tabular-nums">
          {fmt$(item.amount ?? 0)}
        </span>
      </div>

      {/* Info grid */}
      {chips.length > 0 && (
        <div className="mb-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
          {chips.map(chip => (
            <div key={chip.label}>
              <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-600">
                {chip.label}
              </div>
              <div className="truncate text-xs font-medium text-gray-300">{chip.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {item.autopay && <Chip label="Autopay" color="#34d399" />}
        {item.source === "plaid" && <Chip label="Bank detected" color="#60a5fa" />}
        {item.type === "trial" && <Chip label="Trial" color="#f59e0b" />}
      </div>
    </div>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
      style={{ background: color + "18", color }}
    >
      {label}
    </span>
  );
}

// ── Add Modal ──────────────────────────────────────────────────────────────────
function AddModal({
  col,
  onClose,
  onAdded,
}: {
  col: typeof COLUMNS[number];
  onClose: () => void;
  onAdded: (item: Item) => void;
}) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState<string>(col.categories[0]);
  const [autopay, setAutopay] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!name.trim() || !amount) return;
    setSaving(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error: err } = await supabase
        .from("items")
        .insert({
          user_id: user.id,
          name: name.trim(),
          amount: parseFloat(amount),
          type: col.id,
          category: category || col.categories[0],
          color: col.color,
          due_date: dueDate || null,
          autopay,
          status: "active",
          source: "manual",
        })
        .select()
        .single();
      if (err) { setError(err.message); return; }
      if (data) onAdded(data as Item);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-h-[90vh] overflow-y-auto rounded-t-2xl border border-white/10 bg-[#0A0A0F] p-5 sm:max-w-md sm:rounded-2xl"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: col.color + "20" }}
            >
              <col.icon size={14} style={{ color: col.color }} />
            </div>
            <h2 className="text-base font-bold">{col.addLabel}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Name */}
        <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-500">
          Name
        </label>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && save()}
          placeholder={col.placeholder}
          className="mb-3 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-white outline-none focus:border-white/20"
        />

        {/* Amount */}
        <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-500">
          Monthly Amount
        </label>
        <div className="relative mb-3">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="9.99"
            className="w-full rounded-xl border border-white/10 bg-white/[0.02] py-2.5 pl-8 pr-3 text-sm text-white outline-none focus:border-white/20"
          />
        </div>

        {/* Category */}
        <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-500">
          Category
        </label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="mb-3 w-full rounded-xl border border-white/10 bg-[#0A0A0F] px-3 py-2.5 text-sm text-white outline-none focus:border-white/20"
        >
          {col.categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Due date (subscriptions + bills only) */}
        {col.id !== "expense" && (
          <>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-500">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="mb-3 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-white outline-none focus:border-white/20"
            />
          </>
        )}

        {/* Autopay */}
        <label className="mb-5 flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={autopay}
            onChange={e => setAutopay(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <span className="text-sm text-gray-300">Autopay enabled</span>
        </label>

        {error && (
          <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
        )}

        <button
          onClick={save}
          disabled={!name.trim() || !amount || saving}
          className="w-full rounded-xl py-3 text-sm font-bold text-black transition disabled:opacity-40 hover:opacity-90"
          style={{ background: col.color }}
        >
          {saving ? "Adding..." : `Add ${col.label.slice(0, -1)}`}
        </button>
      </div>
    </div>
  );
}
