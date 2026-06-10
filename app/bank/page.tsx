"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Landmark, Lock, Check, Loader2, RefreshCw, AlertTriangle, Sparkles, Trash2, X } from "lucide-react";
import MerchantLogo from "@/components/MerchantLogo";
import SubScanner from "@/components/SubScanner";
import { usePlaidLink } from "react-plaid-link";

interface Item {
  id: string;
  name: string;
  amount: number;
  type: string;
  category: string;
  color: string;
  due_date: string | null;
  autopay: boolean;
  source: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  subscription: "#3EA758",
  bill: "#FFB300",
  trial: "#38BDF8",
  expense: "#FF6B35",
};

const ALL_TYPES = ["subscription", "bill", "expense"] as const;
type ItemType = typeof ALL_TYPES[number];

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function BankPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isReconnect, setIsReconnect] = useState(false);
  const [plaidConnected, setPlaidConnected] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "subscription" | "bill" | "expense">("all");
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);

  async function loadItems(userId: string) {
    const { data } = await supabase.from("items").select("*").eq("user_id", userId);
    if (data) setItems((data as Item[]).filter(i => i.source && i.source !== "manual"));
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      const { data: profile } = await supabase.from("profiles").select("is_pro, plaid_access_token").eq("id", user.id).single();
      if (profile?.is_pro) setIsPro(true);

      const hasToken = !!profile?.plaid_access_token;
      if (hasToken) setPlaidConnected(true);

      const stored = localStorage.getItem(`plaid_last_synced_${user.id}`);
      if (stored) setLastSynced(stored);

      await loadItems(user.id);
      setLoading(false);

      if (hasToken) {
        setSyncing(true);
        try {
          await fetch("/api/plaid/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id }),
          });
          const now = new Date().toISOString();
          localStorage.setItem(`plaid_last_synced_${user.id}`, now);
          setLastSynced(now);
          await loadItems(user.id);
        } catch {}
        setSyncing(false);
      }
    }
    init();
  }, []);

  async function createLinkToken() {
    if (!user) return;
    setIsReconnect(false);
    try {
      const res = await fetch("/api/plaid/create-link-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) });
      const data = await res.json();
      if (data.link_token) setLinkToken(data.link_token);
    } catch {}
  }

  async function startReconnect() {
    if (!user) return;
    setIsReconnect(true);
    try {
      const res = await fetch("/api/plaid/update-link-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) });
      const data = await res.json();
      if (data.link_token) setLinkToken(data.link_token);
    } catch { setIsReconnect(false); }
  }

  async function refreshBank() {
    if (!user) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/plaid/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const body = await res.json().catch(() => ({}));
      if (body?.error_code === "ITEM_LOGIN_REQUIRED") {
        setNeedsReconnect(true);
        setSyncMessage("Bank connection expired. Please reconnect.");
        return;
      }
      const now = new Date().toISOString();
      localStorage.setItem(`plaid_last_synced_${user.id}`, now);
      setLastSynced(now);
      setNeedsReconnect(false);
      setSyncMessage(`Synced. ${body.items_created > 0 ? `${body.items_created} new items found.` : "Up to date."}`);
      await loadItems(user.id);
    } catch {
      setSyncMessage("Connection error. Check your network and try again.");
    } finally {
      setSyncing(false);
    }
  }

  async function runAIOrganize() {
    if (!user) return;
    setCategorizing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/plaid/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const body = await res.json().catch(() => ({}));
      setSyncMessage(`AI organized ${body.updated ?? 0} item${body.updated !== 1 ? "s" : ""} into the right categories.`);
      await loadItems(user.id);
    } catch {
      setSyncMessage("AI organize failed. Try again.");
    } finally {
      setCategorizing(false);
    }
  }

  async function moveItemType(itemId: string, newType: ItemType) {
    setMovingId(itemId);
    const color = TYPE_COLORS[newType] || "#3EA758";
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, type: newType, color } : i));
    await supabase.from("items").update({ type: newType, color }).eq("id", itemId).eq("user_id", user.id);
    setMovingId(null);
  }

  async function disconnectBank() {
    if (!user) return;
    setDisconnecting(true);
    await fetch("/api/plaid/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    localStorage.removeItem(`plaid_last_synced_${user.id}`);
    setPlaidConnected(false);
    setItems([]);
    setLastSynced(null);
    setConfirmDisconnect(false);
    setDisconnecting(false);
    setSyncMessage(null);
  }

  async function onPlaidSuccess(publicToken: string) {
    setDetecting(true);
    setSyncMessage("Connecting your bank...");
    try {
      const exchangeRes = await fetch("/api/plaid/exchange-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicToken, userId: user.id }),
      });
      if (!exchangeRes.ok) throw new Error("Token exchange failed");

      setSyncMessage("Importing your transactions...");
      await fetch("/api/plaid/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const now = new Date().toISOString();
      localStorage.setItem(`plaid_last_synced_${user.id}`, now);
      setLastSynced(now);
      await loadItems(user.id);
      setSyncMessage("Bank connected. Waiting for your bank to send data...");

      // Plaid takes 1-5 minutes on first connect (PRODUCT_NOT_READY).
      // Poll every 30s for up to 5 minutes until we get real data.
      let attempts = 0;
      const maxAttempts = 10;
      const poll = async (): Promise<void> => {
        if (attempts >= maxAttempts) {
          setSyncMessage("Bank connected. Data is loading  -  check back in a few minutes.");
          return;
        }
        attempts++;
        await new Promise(r => setTimeout(r, 30000));
        const res = await fetch("/api/plaid/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
        const body = await res.json().catch(() => ({}));
        await loadItems(user.id);
        if (body?.error_code === "PRODUCT_NOT_READY") {
          setSyncMessage(`Bank connected. Still loading... (check ${attempts}/${maxAttempts})`);
          return poll();
        }
        if (body?.synced > 0 || body?.items_created > 0) {
          // Run AI organize once we have real data
          await fetch("/api/plaid/categorize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id }),
          });
          await loadItems(user.id);
          setSyncMessage("Your subscriptions and bills are ready.");
        }
      };
      poll();
      setPlaidConnected(true);

    } catch {
      setSyncMessage("Something went wrong connecting your bank. Please try again.");
    }
    setLinkToken(null);
    setIsReconnect(false);
    setDetecting(false);
  }

  async function onReconnectSuccess() {
    setNeedsReconnect(false);
    setLinkToken(null);
    setIsReconnect(false);
    await refreshBank();
  }

  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: linkToken || "",
    onSuccess: (public_token) => isReconnect ? onReconnectSuccess() : onPlaidSuccess(public_token),
  });

  function fmtSyncTime(iso: string) {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    const hrs = Math.floor(diff / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="text-gray-500">Loading...</div></div>;

  const subs = items.filter(i => i.type === "subscription");
  const bills = items.filter(i => i.type === "bill");
  const expenses = items.filter(i => i.type === "expense");
  const displayed = activeTab === "all" ? items : items.filter(i => i.type === activeTab);
  const total = (subs.reduce((a, b) => a + b.amount, 0) + bills.reduce((a, b) => a + b.amount, 0));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bank Accounts</h1>
          <p className="mt-1 text-sm text-gray-400">Auto-imported from your connected bank.</p>
        </div>
        {plaidConnected && !confirmDisconnect && (
          <button
            onClick={() => setConfirmDisconnect(true)}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition"
          >
            <Trash2 size={12} /> Disconnect Bank
          </button>
        )}
      </div>

      {/* Disconnect confirmation */}
      {confirmDisconnect && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
          <p className="font-semibold text-red-400 mb-1">Disconnect your bank?</p>
          <p className="text-sm text-gray-400 mb-4">This will remove your bank connection and delete all auto-imported transactions, recurring data, and detected items. Your manually-added items will be kept.</p>
          <div className="flex gap-3">
            <button
              onClick={disconnectBank}
              disabled={disconnecting}
              className="flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50 transition"
            >
              {disconnecting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {disconnecting ? "Disconnecting..." : "Yes, disconnect and delete"}
            </button>
            <button
              onClick={() => setConfirmDisconnect(false)}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-400 hover:bg-white/5 transition"
            >
              <X size={13} /> Cancel
            </button>
          </div>
        </div>
      )}

      {!isPro ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 border border-brand/20">
            <Lock size={22} className="text-brand" />
          </div>
          <h2 className="mb-1 text-xl font-bold">Pro Feature</h2>
          <p className="mb-6 text-sm text-gray-400">Connect your bank to automatically detect and import your subscriptions, bills, and recurring payments.</p>
          <button className="rounded-xl bg-brand-gradient px-8 py-3 font-bold text-black hover:opacity-90">Upgrade to Pro</button>
        </div>
      ) : (
        <>
          {/* Connect / status card */}
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${needsReconnect ? "bg-yellow-500/10 border-yellow-500/20" : "bg-blue-500/10 border-blue-500/20"}`}>
                  {needsReconnect ? <AlertTriangle size={16} className="text-yellow-400" /> : <Landmark size={16} className="text-blue-400" />}
                </div>
                <div>
                  <p className="font-semibold">
                    {needsReconnect ? "Connection Expired" : plaidConnected ? "Bank Connected" : "Connect Your Bank"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {needsReconnect
                      ? "Your bank session expired  -  reconnect to resume syncing"
                      : plaidConnected
                        ? lastSynced ? `Last synced ${fmtSyncTime(lastSynced)}` : "Auto-detecting subscriptions and income"
                        : "Link your account to auto-import"}
                  </p>
                </div>
              </div>

              {detecting || syncing ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 size={14} className="animate-spin" /> Syncing…
                </div>
              ) : needsReconnect ? (
                linkToken && plaidReady ? (
                  <button onClick={() => openPlaid()} className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-bold text-black hover:opacity-90">Open Bank Login</button>
                ) : (
                  <button onClick={startReconnect} className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-400 hover:bg-yellow-500/15">
                    Reconnect Bank
                  </button>
                )
              ) : plaidConnected ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={runAIOrganize}
                    disabled={categorizing}
                    className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-400 hover:bg-purple-500/15 transition disabled:opacity-50"
                  >
                    {categorizing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    AI Organize
                  </button>
                  <button
                    onClick={refreshBank}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-400 hover:bg-white/10 hover:text-white transition"
                  >
                    <RefreshCw size={13} /> Refresh
                  </button>
                  <div className="flex items-center gap-1.5 text-sm text-brand"><Check size={14} /> Connected</div>
                </div>
              ) : linkToken && plaidReady ? (
                <button onClick={() => openPlaid()} className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-bold text-black hover:opacity-90">Open Bank Login</button>
              ) : (
                <button onClick={createLinkToken} className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand hover:bg-brand/15">Connect Bank</button>
              )}
            </div>

            {syncMessage && (
              <p className={`mt-3 text-xs ${needsReconnect ? "text-yellow-400" : "text-gray-400"}`}>{syncMessage}</p>
            )}
            {plaidConnected && !needsReconnect && (
              <p className="mt-2 text-xs text-gray-600">
                Connection not working?{" "}
                {linkToken && plaidReady ? (
                  <button onClick={() => openPlaid()} className="text-brand underline-offset-2 hover:underline">Open bank login</button>
                ) : (
                  <button onClick={startReconnect} className="text-brand underline-offset-2 hover:underline">Reconnect your bank</button>
                )}
              </p>
            )}
          </div>

          {/* Summary chips */}
          {items.length > 0 && (
            <div className="mb-4 grid grid-cols-3 gap-2">
              {[
                { label: "Subscriptions", count: subs.length, amt: subs.reduce((a, b) => a + b.amount, 0), color: "#3EA758", tab: "subscription" },
                { label: "Bills",         count: bills.length, amt: bills.reduce((a, b) => a + b.amount, 0), color: "#FFB300", tab: "bill" },
                { label: "Expenses",      count: expenses.length, amt: expenses.reduce((a, b) => a + b.amount, 0), color: "#FF6B35", tab: "expense" },
              ].map(c => (
                <button
                  key={c.tab}
                  onClick={() => setActiveTab(activeTab === c.tab as any ? "all" : c.tab as any)}
                  className="rounded-2xl border p-3 text-left transition hover:opacity-80"
                  style={{ borderColor: c.color + (activeTab === c.tab ? "60" : "20"), background: c.color + (activeTab === c.tab ? "18" : "08") }}
                >
                  <p className="font-mono text-sm font-black" style={{ color: c.color }}>{fmt(c.amt)}</p>
                  <p className="text-xs text-gray-400">{c.label}</p>
                  <p className="text-[10px] font-bold" style={{ color: c.color }}>{c.count} items</p>
                </button>
              ))}
            </div>
          )}

          {items.length === 0 && plaidConnected ? (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="py-12 text-center">
                <Landmark size={28} className="mx-auto mb-3 text-gray-600" />
                <p className="font-semibold text-gray-300">Scanning your transactions</p>
                <p className="mt-1 text-sm text-gray-500">Detected items appear below. Tap AI Organize to sort them automatically.</p>
              </div>
              <SubScanner userId={user.id} trackedNames={[]} onAdded={() => loadItems(user.id)} />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center">
              <Landmark size={28} className="mx-auto mb-3 text-gray-600" />
              <p className="font-semibold text-gray-300">No bank entries yet</p>
              <p className="mt-1 text-sm text-gray-500">Connect your bank above to auto-import your recurring payments.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
              {/* Tab header */}
              <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
                <div className="flex gap-2">
                  {(["all", "subscription", "bill", "expense"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className="rounded-full px-3 py-1 text-xs font-semibold capitalize transition"
                      style={{
                        background: activeTab === t ? (TYPE_COLORS[t] || "#3EA758") + "25" : "rgba(255,255,255,0.05)",
                        color: activeTab === t ? (TYPE_COLORS[t] || "#3EA758") : "#8E8E93",
                      }}
                    >
                      {t === "all" ? `All (${items.length})` : `${t} (${items.filter(i => i.type === t).length})`}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">{fmt(total)}/mo</p>
              </div>

              <div className="divide-y divide-white/5">
                {displayed.map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-5 py-4">
                    <MerchantLogo name={item.name} color={item.color || TYPE_COLORS[item.type] || "#3EA758"} size={40} />
                    <div className="flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        {/* Inline type mover */}
                        <select
                          value={item.type}
                          disabled={movingId === item.id}
                          onChange={e => moveItemType(item.id, e.target.value as ItemType)}
                          className="rounded-full border-0 bg-transparent py-0 pl-0 pr-4 text-xs font-semibold capitalize outline-none cursor-pointer"
                          style={{ color: TYPE_COLORS[item.type] || "#3EA758" }}
                        >
                          {ALL_TYPES.map(t => (
                            <option key={t} value={t} style={{ background: "#111", color: "#fff" }}>{t}</option>
                          ))}
                        </select>
                        {item.category ? <span className="text-xs text-gray-600">· {item.category}</span> : null}
                        {item.due_date ? <span className="text-xs text-gray-600">· Due {item.due_date}</span> : null}
                      </div>
                    </div>
                    <span className="font-bold">{fmt(item.amount)}</span>
                  </div>
                ))}
              </div>

              <SubScanner
                userId={user.id}
                trackedNames={items.map(i => i.name)}
                onAdded={() => loadItems(user.id)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
