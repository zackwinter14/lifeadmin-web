"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Plus, X, Wallet, CreditCard } from "lucide-react";

interface NWItem {
  id: string;
  name: string;
  category: string;
  value: number;
}

interface Snapshot {
  date: string;
  networth: number;
}

const ASSET_CATS = ["Real Estate", "Vehicle", "Investment", "Cash / Bank", "Retirement", "Crypto", "Other"];
const LIAB_CATS  = ["Mortgage", "Car Loan", "Student Loan", "Credit Card", "Personal Loan", "Other"];

function NWChart({ history }: { history: Snapshot[] }) {
  if (history.length < 2) return null;
  const W = 600, H = 120, PAD = 16;
  const vals = history.map(s => s.networth);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const xStep = (W - PAD * 2) / (history.length - 1);
  const toY = (v: number) => PAD + ((max - v) / range) * (H - PAD * 2);
  const points = history.map((s, i) => `${PAD + i * xStep},${toY(s.networth)}`).join(" ");
  const last = history[history.length - 1];
  const first = history[0];
  const up = last.networth >= first.networth;
  const color = up ? "#00C853" : "#FF3B30";
  const fillPoints = `${PAD},${H} ${points} ${PAD + (history.length - 1) * xStep},${H}`;

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Net Worth Over Time</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 100 }}>
        <defs>
          <linearGradient id="nwgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={fillPoints} fill="url(#nwgrad)" />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {history.map((s, i) => (
          <circle key={i} cx={PAD + i * xStep} cy={toY(s.networth)} r="3" fill={color} />
        ))}
      </svg>
      <div className="flex justify-between mt-2">
        {history.map((s, i) => (
          <p key={i} className="text-[9px] text-gray-600">{s.date}</p>
        ))}
      </div>
    </div>
  );
}

function fmt(n: number) {
  return "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const inputCls = "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-brand";

export default function NetWorthPage() {
  const router = useRouter();
  const supabase = createClient();
  const [authed, setAuthed] = useState(false);

  const [assets, setAssets] = useState<NWItem[]>([]);
  const [liabs, setLiabs]   = useState<NWItem[]>([]);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [showAdd, setShowAdd] = useState<"asset" | "liability" | null>(null);
  const [newName, setNewName] = useState("");
  const [newCat,  setNewCat]  = useState(ASSET_CATS[0]);
  const [newVal,  setNewVal]  = useState("");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      try {
        const a = localStorage.getItem("nw_assets");
        const l = localStorage.getItem("nw_liabs");
        const h = localStorage.getItem("nw_history");
        if (a) setAssets(JSON.parse(a));
        if (l) setLiabs(JSON.parse(l));
        if (h) setHistory(JSON.parse(h));
      } catch {}
      setAuthed(true);
    }
    init();
  }, []);

  function takeSnapshot(newAssets: NWItem[], newLiabs: NWItem[]) {
    try {
      const totalA = newAssets.reduce((a, b) => a + b.value, 0);
      const totalL = newLiabs.reduce((a, b) => a + b.value, 0);
      const nw = totalA - totalL;
      const now = new Date();
      const label = now.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const stored = localStorage.getItem("nw_history");
      const hist: Snapshot[] = stored ? JSON.parse(stored) : [];
      const lastEntry = hist[hist.length - 1];
      if (lastEntry && lastEntry.date === label) {
        hist[hist.length - 1] = { date: label, networth: nw };
      } else {
        hist.push({ date: label, networth: nw });
        if (hist.length > 12) hist.splice(0, hist.length - 12);
      }
      localStorage.setItem("nw_history", JSON.stringify(hist));
      setHistory([...hist]);
    } catch {}
  }

  function saveAssets(u: NWItem[]) { setAssets(u); try { localStorage.setItem("nw_assets", JSON.stringify(u)); } catch {} takeSnapshot(u, liabs); }
  function saveLiabs(u: NWItem[])  { setLiabs(u);  try { localStorage.setItem("nw_liabs",  JSON.stringify(u)); } catch {} takeSnapshot(assets, u); }

  function addItem() {
    if (!newName || !newVal) return;
    const item: NWItem = { id: `${showAdd![0]}${Date.now()}`, name: newName, category: newCat, value: parseFloat(newVal.replace(/,/g, "")) };
    if (showAdd === "asset") saveAssets([...assets, item]);
    else saveLiabs([...liabs, item]);
    setNewName(""); setNewVal(""); setShowAdd(null);
  }

  function openAdd(type: "asset" | "liability") {
    setNewCat(type === "asset" ? ASSET_CATS[0] : LIAB_CATS[0]);
    setNewName(""); setNewVal("");
    setShowAdd(type);
  }

  if (!authed) return <div className="flex min-h-screen items-center justify-center"><div className="text-gray-500">Loading...</div></div>;

  const totalA = assets.reduce((a, b) => a + b.value, 0);
  const totalL = liabs.reduce((a, b) => a + b.value, 0);
  const netW   = totalA - totalL;
  const pos    = netW >= 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Net Worth</h1>
        <p className="mt-1 text-sm text-gray-400">Assets minus liabilities.</p>
      </div>

      {/* Net worth hero */}
      <div
        className="mb-6 overflow-hidden rounded-2xl border p-6"
        style={{ borderColor: pos ? "#34C75930" : "#FF3B3030", background: pos ? "#34C75908" : "#FF3B3008" }}
      >
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: pos ? "#34C75988" : "#FF3B3088" }}>Net Worth</p>
        <p className="mb-4 font-mono text-4xl font-black" style={{ color: pos ? "#34C759" : "#FF3B30" }}>
          {pos ? "" : "-"}{fmt(netW)}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-green-500/10 px-4 py-3">
            <p className="mb-0.5 text-xs uppercase tracking-widest text-green-400/70">Assets</p>
            <p className="font-mono text-lg font-bold text-green-400">{fmt(totalA)}</p>
          </div>
          <div className="rounded-xl bg-red-500/10 px-4 py-3">
            <p className="mb-0.5 text-xs uppercase tracking-widest text-red-400/70">Liabilities</p>
            <p className="font-mono text-lg font-bold text-red-400">-{fmt(totalL)}</p>
          </div>
        </div>

        {/* Progress bar */}
        {(totalA + totalL) > 0 && (
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-green-400 transition-all duration-700"
                style={{ width: `${Math.min((totalA / (totalA + totalL)) * 100, 100)}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-gray-500">
              <span>Assets {totalA + totalL > 0 ? Math.round((totalA / (totalA + totalL)) * 100) : 0}%</span>
              <span>Liabilities {totalA + totalL > 0 ? Math.round((totalL / (totalA + totalL)) * 100) : 0}%</span>
            </div>
          </div>
        )}
      </div>

      <NWChart history={history} />

      {/* Assets */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-green-400">Assets · {fmt(totalA)}</p>
        </div>
        {assets.length > 0 && (
          <div className="mb-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            {assets.map((a, i) => (
              <div key={a.id} className={`flex items-center gap-3 px-5 py-4 ${i < assets.length - 1 ? "border-b border-white/5" : ""}`}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-green-500/20 bg-green-500/10">
                  <Wallet size={15} className="text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{a.name}</p>
                  <p className="text-xs text-gray-500">{a.category}</p>
                </div>
                <p className="mr-2 font-mono text-sm font-bold text-green-400">{fmt(a.value)}</p>
                <button onClick={() => saveAssets(assets.filter(x => x.id !== a.id))} className="rounded-lg p-1.5 text-gray-600 hover:bg-red-500/10 hover:text-red-400">
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => openAdd("asset")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-green-500/30 py-3 text-sm font-semibold text-green-400 hover:bg-green-500/5"
        >
          <Plus size={15} /> Add Asset
        </button>
      </div>

      {/* Liabilities */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-400">Liabilities · {fmt(totalL)}</p>
        </div>
        {liabs.length > 0 && (
          <div className="mb-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            {liabs.map((l, i) => (
              <div key={l.id} className={`flex items-center gap-3 px-5 py-4 ${i < liabs.length - 1 ? "border-b border-white/5" : ""}`}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10">
                  <CreditCard size={15} className="text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{l.name}</p>
                  <p className="text-xs text-gray-500">{l.category}</p>
                </div>
                <p className="mr-2 font-mono text-sm font-bold text-red-400">-{fmt(l.value)}</p>
                <button onClick={() => saveLiabs(liabs.filter(x => x.id !== l.id))} className="rounded-lg p-1.5 text-gray-600 hover:bg-red-500/10 hover:text-red-400">
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => openAdd("liability")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-red-500/30 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/5"
        >
          <Plus size={15} /> Add Liability
        </button>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={e => { if (e.target === e.currentTarget) setShowAdd(null); }}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">Add {showAdd === "asset" ? "Asset" : "Liability"}</h2>
              <button onClick={() => setShowAdd(null)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Name *</label>
                <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder={showAdd === "asset" ? "e.g. Honda Civic, 401k" : "e.g. Car Loan, Credit Card"} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Category</label>
                <select value={newCat} onChange={e => setNewCat(e.target.value)} className={inputCls}>
                  {(showAdd === "asset" ? ASSET_CATS : LIAB_CATS).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Value *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input type="number" value={newVal} onChange={e => setNewVal(e.target.value)} placeholder="0" className={`${inputCls} pl-7 font-mono font-bold`} />
                </div>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowAdd(null)} className="flex-1 rounded-xl border border-white/10 py-3 text-sm hover:bg-white/5">Cancel</button>
              <button
                onClick={addItem}
                disabled={!newName || !newVal}
                className="flex-1 rounded-xl py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40"
                style={{ background: showAdd === "asset" ? "linear-gradient(135deg,#34C759,#2ecc71)" : "linear-gradient(135deg,#FF3B30,#c0392b)" }}
              >
                Add {showAdd === "asset" ? "Asset" : "Liability"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
