"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, CreditCard, Zap, ShoppingCart, X, DollarSign, ArrowRight } from "lucide-react";

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

interface TxGroup {
  merchant: string;
  count: number;
  lastAmount: number;
  avgAmount: number;
  totalSpent: number;
  lastDate: string;
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
    categories: ["Entertainment", "Music", "News", "Software", "Cloud Storage", "Health & Fitness", "Gaming", "Other"],
  },
  {
    id: "bill" as const,
    label: "Bills",
    icon: CreditCard,
    color: "#60a5fa",
    types: ["bill"] as ItemType[],
    addLabel: "Add Bill",
    placeholder: "Electric bill",
    categories: ["Mortgage", "Rent", "Utilities", "Internet", "Phone", "Insurance", "Credit Card", "Car Note", "Loan", "Other"],
  },
  {
    id: "expense" as const,
    label: "Expenses",
    icon: ShoppingCart,
    color: "#34d399",
    types: ["expense"] as ItemType[],
    addLabel: "Add Expense",
    placeholder: "Walmart",
    categories: ["Groceries", "Dining", "Shopping", "Transportation", "Health", "Entertainment", "Travel", "Personal Care", "Other"],
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
  } catch { return null; }
}

const FREQ_MAP: Record<string, string> = {
  weekly: "Weekly", biweekly: "Every 2 wks", monthly: "Monthly",
  quarterly: "Quarterly", annually: "Yearly", semi_monthly: "Twice/mo",
};

// ── Page ───────────────────────────────────────────────────────────────────────
export default function TrackerPage() {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState<Item[]>([]);
  const [txGroups, setTxGroups] = useState<TxGroup[]>([]);
  const [recurring, setRecurring] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // dragging stores the full prefixed string: "item:<id>" or "tx:<merchant>"
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<ColId | null>(null);
  const [addCol, setAddCol] = useState<typeof COLUMNS[number] | null>(null);
  const [trackTx, setTrackTx] = useState<TxGroup | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const since90 = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

      const [{ data: itemsData }, { data: txData }, { data: recurData }] = await Promise.all([
        supabase
          .from("items")
          .select("id,name,amount,type,category,color,due_date,autopay,status,source")
          .eq("user_id", user.id),
        supabase
          .from("transactions")
          .select("clean_merchant_name,merchant_name,description,amount,date,category")
          .eq("user_id", user.id)
          .gte("date", since90)
          .lt("amount", 0)   // Plaid sync sign-flips amounts; expenses are stored negative
          .order("date", { ascending: false })
          .limit(500),
        supabase
          .from("recurring_transactions")
          .select("merchant_name,clean_merchant_name,frequency,last_amount,average_amount,next_predicted_date")
          .eq("user_id", user.id)
          .eq("is_active", true),
      ]);

      // Client-side cancel filter avoids the NULL != 'cancelled' bug in PostgREST
      const allItems = ((itemsData as Item[]) ?? []).filter(i => i.status !== "cancelled");
      setItems(allItems);
      setRecurring((recurData as any[]) ?? []);

      // Group Plaid transactions by merchant for the Expenses column.
      // The sync route stores Plaid's personal_finance_category.primary (e.g. "FOOD_AND_DRINK").
      // Skip income and incoming transfers; everything else is an expense.
      const raw = ((txData as any[]) ?? []).filter(t => {
        const cat = (t.category || "").toUpperCase();
        return !cat.includes("INCOME") && !cat.includes("TRANSFER_IN");
      });

      const grouped: Record<string, { amounts: number[]; dates: string[] }> = {};
      for (const t of raw) {
        const key = (t.clean_merchant_name || t.merchant_name || t.description || "Unknown").trim();
        if (!grouped[key]) grouped[key] = { amounts: [], dates: [] };
        grouped[key].amounts.push(Math.abs(t.amount));
        grouped[key].dates.push(t.date);
      }

      const allGroups: TxGroup[] = Object.entries(grouped)
        .map(([merchant, { amounts, dates }]) => ({
          merchant,
          count: amounts.length,
          lastAmount: amounts[0],
          avgAmount: amounts.reduce((s, a) => s + a, 0) / amounts.length,
          totalSpent: amounts.reduce((s, a) => s + a, 0),
          lastDate: dates[0],
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent);

      // Don't show a bank transaction card for a merchant that is already tracked —
      // that's what causes the "it came back to expenses" confusion.
      const trackedNames = allItems.map(i => i.name.toLowerCase().trim());
      const groups = allGroups.filter(g => {
        const gLc = g.merchant.toLowerCase().trim();
        return !trackedNames.some(name => {
          const shorter = name.length < gLc.length ? name : gLc;
          const longer  = name.length < gLc.length ? gLc  : name;
          return shorter.length >= 4 && longer.includes(shorter);
        });
      });

      setTxGroups(groups);
      setLoading(false);
    }
    init();
  }, []);

  // ── Drag handlers ────────────────────────────────────────────────────────────
  // ItemCard drag — prefix "item:" so onDrop can distinguish from tx drags
  function onItemDragStart(e: React.DragEvent, id: string) {
    const raw = "item:" + id;
    setDragging(raw);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", raw);
  }

  // TxGroupCard drag — prefix "tx:"
  function onTxDragStart(e: React.DragEvent, merchant: string) {
    const raw = "tx:" + merchant;
    setDragging(raw);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", raw);
  }

  function onDragEnd() {
    setDragging(null);
    setDragOver(null);
  }

  async function onDrop(e: React.DragEvent, colId: ColId) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    setDragging(null);
    setDragOver(null);
    if (!raw) return;

    if (raw.startsWith("item:")) {
      // Reclassify an existing tracked item
      const id = raw.slice(5);
      const newType: ItemType = colId;
      const item = items.find(i => i.id === id);
      if (!item) return;

      // Optimistic UI update
      setItems(prev => prev.map(i => i.id === id ? { ...i, type: newType, source: "user_override" } : i));

      // Mark as user_override so Plaid sync never re-classifies it
      await supabase.from("items")
        .update({ type: newType, source: "user_override" })
        .eq("id", id);

      // Write global merchant memory so every future user gets this right
      if (item.name) {
        const key = item.name.toLowerCase().trim();
        await supabase.from("merchant_rules").upsert(
          {
            merchant_name: key,
            correct_type: newType,
            correct_category: item.category,
            last_updated: new Date().toISOString(),
          },
          { onConflict: "merchant_name" }
        );
      }
    } else if (raw.startsWith("tx:")) {
      // Promote a bank transaction card to a tracked item
      const merchant = raw.slice(3);
      await createItemFromTx(merchant, colId);
    }
  }

  // Promote a TxGroup to a tracked item (used by both drag-drop and TrackTxModal)
  async function createItemFromTx(merchant: string, colId: ColId, overrideAmount?: number, overrideCategory?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const group = txGroups.find(g => g.merchant === merchant);
    if (!group) return;

    const col = COLUMNS.find(c => c.id === colId)!;
    const category = overrideCategory ?? col.categories[0];
    const amount = overrideAmount ?? parseFloat(group.avgAmount.toFixed(2));

    const { data } = await supabase
      .from("items")
      .insert({
        user_id: user.id,
        name: merchant,
        amount,
        type: colId,
        category,
        color: col.color,
        status: "active",
        source: "user_override",
        autopay: false,
      })
      .select()
      .single();

    if (data) {
      setItems(prev => [...prev, data as Item]);
      // Remove from txGroups immediately so the card disappears
      setTxGroups(prev => prev.filter(g => g.merchant !== merchant));

      // Write global merchant memory
      const key = merchant.toLowerCase().trim();
      await supabase.from("merchant_rules").upsert(
        {
          merchant_name: key,
          correct_type: colId,
          correct_category: category,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "merchant_name" }
      );
    }
  }

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

  // Add bank transaction averages to the expenses column total
  const txTotal = txGroups.reduce((s, g) => s + g.avgAmount, 0);
  totals.expense += txTotal;

  const grandTotal = totals.subscription + totals.bill + totals.expense;

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
    </div>
  );

  return (
    <div className="min-h-screen text-white">
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="border-b border-white/5 px-6 py-5">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-1.5 flex items-center gap-2 text-sm">
                <Link href="/finances" className="text-gray-500 transition hover:text-white">Finances</Link>
                <span className="text-gray-700">/</span>
                <span className="text-gray-300">Tracker</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Expense Tracker</h1>
              <p className="mt-0.5 text-sm text-gray-500">
                Drag cards between columns to reclassify them
              </p>
            </div>

            {/* Summary totals */}
            <div className="flex flex-wrap items-center gap-5">
              {COLUMNS.map(col => (
                <div key={col.id} className="text-right">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ background: col.color }} />
                    <span className="text-sm text-gray-400">{col.label}</span>
                  </div>
                  <div className="text-base font-bold">
                    {fmt$(totals[col.id] ?? 0)}
                    <span className="ml-0.5 text-xs font-normal text-gray-600">/mo</span>
                  </div>
                </div>
              ))}
              <div className="h-8 w-px bg-white/10" />
              <div className="text-right">
                <div className="text-sm text-gray-400">Total tracked</div>
                <div className="text-base font-bold">
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
            const isExpenses = col.id === "expense";
            const cardCount = colItems.length + (isExpenses ? txGroups.length : 0);

            return (
              <div
                key={col.id}
                onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
                onDrop={e => onDrop(e, col.id)}
                onDragLeave={e => {
                  // Only clear dragOver when the cursor actually leaves this column,
                  // not when it just moves onto a child element inside it.
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOver(null);
                  }
                }}
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
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ background: col.color + "18" }}
                    >
                      <col.icon size={16} style={{ color: col.color }} />
                    </div>
                    <span className="text-base font-semibold">{col.label}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{ background: col.color + "18", color: col.color }}
                    >
                      {cardCount}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                      monthly
                    </div>
                    <div className="text-base font-bold">{fmt$(totals[col.id] ?? 0)}</div>
                  </div>
                </div>

                {/* Cards list */}
                <div className="flex flex-1 flex-col gap-2.5 p-3">
                  {/* Empty state */}
                  {cardCount === 0 && (
                    <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                      <div className="mb-2 opacity-20" style={{ color: col.color }}>
                        <col.icon size={30} />
                      </div>
                      <p className="text-xs text-gray-600">No {col.label.toLowerCase()} yet</p>
                      <p className="mt-0.5 text-xs text-gray-700">
                        {isExpenses
                          ? "Connect your bank to see purchases here"
                          : "Drag items here or add one below"}
                      </p>
                    </div>
                  )}

                  {/* Tracked items (draggable) */}
                  {colItems.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      rec={getRecurring(item.name)}
                      colColor={col.color}
                      isDragging={dragging === "item:" + item.id}
                      onDragStart={onItemDragStart}
                      onDragEnd={onDragEnd}
                    />
                  ))}

                  {/* Bank transactions in the expenses column */}
                  {isExpenses && txGroups.length > 0 && (
                    <>
                      {colItems.length > 0 && (
                        <div className="flex items-center gap-2 py-1">
                          <div className="h-px flex-1 bg-white/5" />
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                            From bank
                          </span>
                          <div className="h-px flex-1 bg-white/5" />
                        </div>
                      )}
                      {txGroups.map(g => (
                        <TxGroupCard
                          key={g.merchant}
                          group={g}
                          colColor={col.color}
                          isDragging={dragging === "tx:" + g.merchant}
                          onDragStart={onTxDragStart}
                          onDragEnd={onDragEnd}
                          onTrack={() => setTrackTx(g)}
                        />
                      ))}
                    </>
                  )}
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

      {addCol && (
        <AddModal
          col={addCol}
          onClose={() => setAddCol(null)}
          onAdded={item => { setItems(prev => [...prev, item]); setAddCol(null); }}
        />
      )}

      {trackTx && (
        <TrackTxModal
          group={trackTx}
          onClose={() => setTrackTx(null)}
          onAdded={(item, merchant) => {
            setItems(prev => [...prev, item]);
            // Remove the bank card immediately when tracking via modal
            setTxGroups(prev => prev.filter(g => g.merchant !== merchant));
            setTrackTx(null);
          }}
        />
      )}
    </div>
  );
}

// ── Draggable item card ────────────────────────────────────────────────────────
function ItemCard({ item, rec, colColor, isDragging, onDragStart, onDragEnd }: {
  item: Item;
  rec: any;
  colColor: string;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
}) {
  const chips: { label: string; value: string }[] = [];
  if (item.category) chips.push({ label: "Category", value: item.category });
  if (item.due_date) chips.push({ label: "Due", value: fmtDate(item.due_date) ?? item.due_date });
  if (rec?.frequency) chips.push({ label: "Frequency", value: FREQ_MAP[rec.frequency.toLowerCase()] ?? rec.frequency });
  if (rec?.next_predicted_date) chips.push({ label: "Next charge", value: fmtDate(rec.next_predicted_date) ?? rec.next_predicted_date });
  if (rec?.last_amount != null && Math.abs(rec.last_amount - (item.amount ?? 0)) > 0.5) {
    chips.push({ label: "Last charged", value: fmt$(rec.last_amount) });
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
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full"
            style={{ background: item.color ?? colColor }}
          />
          <span className="truncate text-base font-semibold leading-tight">{item.name}</span>
        </div>
        <span className="flex-shrink-0 text-base font-bold tabular-nums">
          {fmt$(item.amount ?? 0)}
        </span>
      </div>

      {chips.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
          {chips.map(chip => (
            <div key={chip.label}>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                {chip.label}
              </div>
              <div className="truncate text-sm font-medium text-gray-200">{chip.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {item.autopay && <Chip label="Autopay" color="#34d399" />}
        {item.source === "plaid" && <Chip label="Bank" color="#60a5fa" />}
        {item.type === "trial" && <Chip label="Trial" color="#f59e0b" />}
      </div>
    </div>
  );
}

// ── Bank transaction group card ────────────────────────────────────────────────
function TxGroupCard({ group, colColor, isDragging, onDragStart, onDragEnd, onTrack }: {
  group: TxGroup;
  colColor: string;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, merchant: string) => void;
  onDragEnd: () => void;
  onTrack: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, group.merchant)}
      onDragEnd={onDragEnd}
      className="select-none rounded-xl border p-3.5 transition-all duration-100"
      style={{
        cursor: isDragging ? "grabbing" : "grab",
        borderColor: isDragging ? colColor + "50" : "rgba(255,255,255,0.06)",
        background: isDragging ? colColor + "10" : "rgba(255,255,255,0.02)",
        opacity: isDragging ? 0.4 : 1,
        transform: isDragging ? "scale(0.97)" : "scale(1)",
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="truncate text-base font-semibold leading-tight">{group.merchant}</span>
        <span className="flex-shrink-0 text-base font-bold tabular-nums">
          {fmt$(group.avgAmount)}
          <span className="ml-0.5 text-xs font-normal text-gray-500">/avg</span>
        </span>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Times seen
          </div>
          <div className="text-sm font-medium text-gray-200">{group.count}x in 90 days</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Last charge
          </div>
          <div className="text-sm font-medium text-gray-200">
            {fmtDate(group.lastDate) ?? group.lastDate} &middot; {fmt$(group.lastAmount)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            90-day total
          </div>
          <div className="text-sm font-medium text-gray-200">{fmt$(group.totalSpent)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Chip label="From bank" color="#60a5fa" />
        <button
          onClick={onTrack}
          className="flex items-center gap-1 text-xs font-semibold transition hover:opacity-70"
          style={{ color: colColor }}
        >
          Track this <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

// ── Shared chip ────────────────────────────────────────────────────────────────
function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
      style={{ background: color + "18", color }}
    >
      {label}
    </span>
  );
}

// ── Add tracked item modal ─────────────────────────────────────────────────────
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
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: col.color + "20" }}>
              <col.icon size={14} style={{ color: col.color }} />
            </div>
            <h2 className="text-base font-bold">{col.addLabel}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-500">Name</label>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && save()}
          placeholder={col.placeholder}
          className="mb-3 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-white outline-none focus:border-white/20"
        />

        <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-500">Monthly Amount</label>
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

        <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-500">Category</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="mb-3 w-full rounded-xl border border-white/10 bg-[#0A0A0F] px-3 py-2.5 text-sm text-white outline-none focus:border-white/20"
        >
          {col.categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {col.id !== "expense" && (
          <>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-500">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="mb-3 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-white outline-none focus:border-white/20"
            />
          </>
        )}

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

// ── Promote a bank transaction into a tracked item ─────────────────────────────
function TrackTxModal({
  group,
  onClose,
  onAdded,
}: {
  group: TxGroup;
  onClose: () => void;
  onAdded: (item: Item, merchant: string) => void;
}) {
  const supabase = createClient();
  const [type, setType] = useState<ColId>("expense");
  const [amount, setAmount] = useState(group.avgAmount.toFixed(2));
  const [saving, setSaving] = useState(false);

  const COL = COLUMNS.find(c => c.id === type)!;
  const [category, setCategory] = useState<string>(COL.categories[0]);

  async function save() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("items")
        .insert({
          user_id: user.id,
          name: group.merchant,
          amount: parseFloat(amount),
          type,
          category,
          color: COL.color,
          status: "active",
          source: "user_override",
          autopay: false,
        })
        .select()
        .single();

      if (data) {
        // Write global merchant memory so every future user gets this right
        const key = group.merchant.toLowerCase().trim();
        await supabase.from("merchant_rules").upsert(
          {
            merchant_name: key,
            correct_type: type,
            correct_category: category,
            last_updated: new Date().toISOString(),
          },
          { onConflict: "merchant_name" }
        );

        onAdded(data as Item, group.merchant);
      }
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
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-bold">Track this charge</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X size={18} />
          </button>
        </div>
        <p className="mb-4 text-xs text-gray-500">
          {group.merchant} &middot; seen {group.count}x in 90 days &middot; avg {fmt$(group.avgAmount)}
        </p>

        <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-500">
          Classify as
        </label>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {COLUMNS.map(col => (
            <button
              key={col.id}
              onClick={() => { setType(col.id); setCategory(col.categories[0]); }}
              className="rounded-xl border py-2 text-xs font-bold transition"
              style={{
                borderColor: type === col.id ? col.color : "rgba(255,255,255,0.1)",
                background: type === col.id ? col.color + "20" : "transparent",
                color: type === col.id ? col.color : "#9ca3af",
              }}
            >
              {col.label.replace(/s$/, "")}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-500">
          Monthly Amount
        </label>
        <div className="relative mb-3">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.02] py-2.5 pl-8 pr-3 text-sm text-white outline-none focus:border-white/20"
          />
        </div>

        <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-500">
          Category
        </label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="mb-5 w-full rounded-xl border border-white/10 bg-[#0A0A0F] px-3 py-2.5 text-sm text-white outline-none focus:border-white/20"
        >
          {COL.categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <button
          onClick={save}
          disabled={saving}
          className="w-full rounded-xl py-3 text-sm font-bold text-black transition disabled:opacity-40 hover:opacity-90"
          style={{ background: COL.color }}
        >
          {saving ? "Adding..." : "Start Tracking"}
        </button>
      </div>
    </div>
  );
}
