"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Landmark, Lock, Check, Loader2 } from "lucide-react";
import MerchantLogo from "@/components/MerchantLogo";
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
  const [plaidConnected, setPlaidConnected] = useState(false);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      const { data: profile } = await supabase.from("profiles").select("is_pro, plaid_access_token").eq("id", user.id).single();
      if (profile?.is_pro) setIsPro(true);
      if (profile?.plaid_access_token) setPlaidConnected(true);

      const { data } = await supabase.from("items").select("*").eq("user_id", user.id);
      if (data) setItems((data as Item[]).filter(i => i.source && i.source !== "manual"));
      setLoading(false);
    }
    init();
  }, []);

  async function createLinkToken() {
    if (!user) return;
    const res = await fetch("/api/plaid/create-link-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) });
    const data = await res.json();
    if (data.link_token) setLinkToken(data.link_token);
  }

  async function onPlaidSuccess(publicToken: string) {
    setDetecting(true);
    await fetch("/api/plaid/exchange-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicToken, userId: user.id }) });
    await fetch("/api/plaid/income", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) });
    setPlaidConnected(true);
    setDetecting(false);
    setLinkToken(null);
  }

  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: linkToken || "",
    onSuccess: (public_token) => onPlaidSuccess(public_token),
  });

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="text-gray-500">Loading...</div></div>;

  const total = items.reduce((a, b) => a + b.amount, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Bank Connected</h1>
        <p className="mt-1 text-sm text-gray-400">Auto-imported from your bank account.</p>
      </div>

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
          {/* Connect bank */}
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Landmark size={16} className="text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold">{plaidConnected ? "Bank Connected" : "Connect Your Bank"}</p>
                  <p className="text-xs text-gray-500">{plaidConnected ? "Auto-detecting subscriptions and income" : "Link your account to auto-import"}</p>
                </div>
              </div>
              {detecting ? (
                <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 size={14} className="animate-spin" /> Syncing…</div>
              ) : plaidConnected ? (
                <div className="flex items-center gap-1.5 text-sm text-brand"><Check size={14} /> Connected</div>
              ) : linkToken && plaidReady ? (
                <button onClick={() => openPlaid()} className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-bold text-black hover:opacity-90">Open Bank Login</button>
              ) : (
                <button onClick={createLinkToken} className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand hover:bg-brand/15">Connect Bank</button>
              )}
            </div>
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center">
              <Landmark size={28} className="mx-auto mb-3 text-gray-600" />
              <p className="font-semibold text-gray-300">No bank entries yet</p>
              <p className="mt-1 text-sm text-gray-500">Connect your bank above to auto-import your recurring payments.</p>
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">{items.length} items · {fmt(total)}/mo</p>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="divide-y divide-white/5">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-5 py-4">
                      <MerchantLogo name={item.name} color={item.color || TYPE_COLORS[item.type] || "#3EA758"} size={40} />
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          <span className="capitalize" style={{ color: TYPE_COLORS[item.type] }}>{item.type}</span>
                          {item.category ? ` · ${item.category}` : ""}
                          {item.due_date ? ` · Due ${item.due_date}` : ""}
                          {item.autopay ? " · Autopay" : ""}
                        </p>
                      </div>
                      <span className="font-bold">{fmt(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
