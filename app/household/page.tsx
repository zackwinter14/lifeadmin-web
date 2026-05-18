"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Link2, Copy, Check, X, AlertTriangle, Unlink,
  UserPlus, LogIn, RefreshCw, Users,
} from "lucide-react";
import MerchantLogo from "@/components/MerchantLogo";

interface HouseholdLink {
  id: string;
  user_id_a: string;
  user_id_b: string | null;
  email_a: string | null;
  email_b: string | null;
  invite_code: string;
  status: "pending" | "accepted";
  created_at: string;
}

interface Item {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  type: string;
  category: string;
  color: string;
}

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const TYPE_COLORS: Record<string, string> = {
  subscription: "#3EA758",
  bill: "#FFB300",
  trial: "#38BDF8",
};

function displayName(email: string | null | undefined): string {
  if (!email) return "Partner";
  return email.split("@")[0];
}

export default function HouseholdPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [link, setLink] = useState<HouseholdLink | null>(null);
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [partnerItems, setPartnerItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [pendingAccept, setPendingAccept] = useState<HouseholdLink | null>(null);
  const [accepting, setAccepting] = useState(false);

  const load = useCallback(async (uid: string) => {
    const { data: linkData } = await supabase
      .from("household_links")
      .select("*")
      .or(`user_id_a.eq.${uid},user_id_b.eq.${uid}`)
      .maybeSingle();

    setLink(linkData ?? null);

    if (linkData?.status === "accepted") {
      const partnerId = linkData.user_id_a === uid ? linkData.user_id_b : linkData.user_id_a;
      const { data: pItems } = await supabase
        .from("items")
        .select("id, user_id, name, amount, type, category, color")
        .eq("user_id", partnerId)
        .neq("type", "expense")
        .or("status.eq.active,status.is.null");
      setPartnerItems(pItems ?? []);
    } else {
      setPartnerItems([]);
    }

    const { data: myItemsData } = await supabase
      .from("items")
      .select("id, user_id, name, amount, type, category, color")
      .eq("user_id", uid)
      .neq("type", "expense")
      .or("status.eq.active,status.is.null");
    setMyItems(myItemsData ?? []);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
      setUserEmail(user.email ?? "");

      const code = searchParams.get("code");
      if (code) {
        const { data: inviteData } = await supabase
          .from("household_links")
          .select("*")
          .eq("invite_code", code)
          .eq("status", "pending")
          .maybeSingle();
        if (inviteData && inviteData.user_id_a !== user.id) {
          setPendingAccept(inviteData);
        }
      }

      await load(user.id);
    }
    init();
  }, []);

  async function generateInvite() {
    if (!userId) return;
    setGenerating(true);
    const code = (
      Math.random().toString(36).slice(2, 8) +
      Math.random().toString(36).slice(2, 6)
    ).toUpperCase();
    const { data } = await supabase
      .from("household_links")
      .insert({
        user_id_a: userId,
        email_a: userEmail,
        invite_code: code,
        status: "pending",
      })
      .select()
      .single();
    if (data) setLink(data);
    setGenerating(false);
  }

  async function acceptInvite() {
    if (!userId || !pendingAccept) return;
    setAccepting(true);
    await supabase
      .from("household_links")
      .update({ user_id_b: userId, email_b: userEmail, status: "accepted" })
      .eq("id", pendingAccept.id);
    setPendingAccept(null);
    router.replace("/household");
    await load(userId);
    setAccepting(false);
  }

  async function unlink() {
    if (!link || !userId) return;
    setUnlinking(true);
    await supabase.from("household_links").delete().eq("id", link.id);
    setLink(null);
    setPartnerItems([]);
    setUnlinking(false);
  }

  function copyInviteUrl() {
    if (!link) return;
    const url = `${window.location.origin}/household?code=${link.invite_code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  const partnerEmail = link
    ? (link.user_id_a === userId ? link.email_b : link.email_a)
    : null;
  const partnerName = displayName(partnerEmail);

  const allItems = [...myItems, ...partnerItems];
  const subsByName: Record<string, string[]> = {};
  allItems.forEach(item => {
    if (item.type !== "subscription") return;
    const key = item.name.toLowerCase().trim();
    if (!subsByName[key]) subsByName[key] = [];
    subsByName[key].push(item.user_id === userId ? "You" : partnerName);
  });
  const duplicates = Object.entries(subsByName).filter(([, names]) => names.length > 1);

  const myTotal = myItems.reduce((a, b) => a + b.amount, 0);
  const partnerTotal = partnerItems.reduce((a, b) => a + b.amount, 0);

  const inviteUrl = link ? `${typeof window !== "undefined" ? window.location.origin : ""}/household?code=${link.invite_code}` : "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Household</h1>
          <p className="mt-1 text-sm text-gray-400">
            {link?.status === "accepted"
              ? `Linked with ${partnerName} — seeing finances together.`
              : "Link your partner to see both accounts in one place."}
          </p>
        </div>
        {link?.status === "accepted" && (
          <div className="flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-3 py-1.5">
            <Users size={13} className="text-brand" />
            <span className="text-xs font-semibold text-brand">Linked</span>
          </div>
        )}
      </div>

      {/* Accept pending invite banner */}
      {pendingAccept && (
        <div className="mb-6 rounded-2xl border border-brand/30 bg-brand/[0.06] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/15">
              <UserPlus size={18} className="text-brand" />
            </div>
            <div>
              <p className="font-semibold text-white">Household invite</p>
              <p className="text-xs text-gray-400">
                {pendingAccept.email_a
                  ? `${pendingAccept.email_a} wants to link accounts with you.`
                  : "Someone wants to link accounts with you."}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={acceptInvite}
              disabled={accepting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-gradient py-3 text-sm font-bold text-black hover:opacity-90 disabled:opacity-50"
            >
              {accepting
                ? <RefreshCw size={14} className="animate-spin" />
                : <Check size={14} />}
              Accept & Link Accounts
            </button>
            <button
              onClick={() => { setPendingAccept(null); router.replace("/household"); }}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm text-gray-400 hover:bg-white/5"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* LINKED: combined view */}
      {link?.status === "accepted" ? (
        <>
          {/* Stats */}
          <div className="mb-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4">
              <p className="mb-1 text-xs text-gray-500">Combined monthly</p>
              <p className="font-mono text-xl font-black text-brand">{fmt(myTotal + partnerTotal)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="mb-1 text-xs text-gray-500">Your total</p>
              <p className="font-mono text-xl font-bold">{fmt(myTotal)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="mb-1 text-xs text-gray-500">{partnerName}&apos;s total</p>
              <p className="font-mono text-xl font-bold">{fmt(partnerTotal)}</p>
            </div>
          </div>

          {/* Duplicate warning */}
          {duplicates.length > 0 && (
            <div className="mb-5 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={15} className="text-orange-400 shrink-0" />
                <p className="text-sm font-semibold text-orange-400">Both paying for the same subscription</p>
              </div>
              <div className="space-y-1.5">
                {duplicates.map(([name, who]) => (
                  <div key={name} className="flex items-center justify-between rounded-lg bg-orange-500/5 px-3 py-2">
                    <span className="text-sm capitalize">{name}</span>
                    <span className="text-xs text-orange-400">{who.join(" + ")} both paying</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-600">Consider sharing one account to save money.</p>
            </div>
          )}

          {/* Side-by-side per category */}
          {(["subscription", "bill"] as const).map(type => {
            const mine = myItems.filter(i => i.type === type);
            const theirs = partnerItems.filter(i => i.type === type);
            if (!mine.length && !theirs.length) return null;
            const label = type === "subscription" ? "Subscriptions" : "Bills";
            const color = TYPE_COLORS[type];
            const combinedAmt = mine.reduce((a, b) => a + b.amount, 0) + theirs.reduce((a, b) => a + b.amount, 0);
            return (
              <div key={type} className="mb-5 rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{label}</p>
                  <p className="text-xs text-gray-500 font-mono">{fmt(combinedAmt)}/mo combined</p>
                </div>
                <div className="grid grid-cols-2 divide-x divide-white/5">
                  {/* My column */}
                  <div className="p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 px-2">
                      You &middot; {fmt(mine.reduce((a, b) => a + b.amount, 0))}/mo
                    </p>
                    {mine.length === 0
                      ? <p className="text-xs text-gray-600 px-2 py-2">None</p>
                      : mine.map(item => (
                        <div key={item.id} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-white/[0.02]">
                          <MerchantLogo name={item.name} color={item.color || color} size={26} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{item.name}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{fmt(item.amount)}/mo</p>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                  {/* Partner column */}
                  <div className="p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 px-2">
                      {partnerName} &middot; {fmt(theirs.reduce((a, b) => a + b.amount, 0))}/mo
                    </p>
                    {theirs.length === 0
                      ? <p className="text-xs text-gray-600 px-2 py-2">None</p>
                      : theirs.map(item => (
                        <div key={item.id} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-white/[0.02]">
                          <MerchantLogo name={item.name} color={item.color || color} size={26} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{item.name}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{fmt(item.amount)}/mo</p>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            );
          })}

          {/* Unlink footer */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Linked with {partnerName}</p>
                {partnerEmail && <p className="text-xs text-gray-500">{partnerEmail}</p>}
              </div>
              <button
                onClick={unlink}
                disabled={unlinking}
                className="flex items-center gap-2 rounded-xl border border-red-500/20 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
              >
                <Unlink size={13} />
                {unlinking ? "Unlinking..." : "Unlink"}
              </button>
            </div>
          </div>
        </>
      ) : link?.status === "pending" ? (
        /* PENDING: waiting for partner */
        <div className="mb-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw size={15} className="text-yellow-400" />
            <p className="text-sm font-semibold text-yellow-400">Waiting for your partner to accept</p>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Share this link with your partner. When they open it and log in, your accounts will link automatically.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-xs text-gray-300 truncate">
              {inviteUrl}
            </div>
            <button
              onClick={copyInviteUrl}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold hover:bg-white/10 transition"
            >
              {copied ? <Check size={13} className="text-brand" /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            onClick={unlink}
            className="mt-3 text-xs text-gray-600 hover:text-red-400 transition"
          >
            Cancel invite
          </button>
        </div>
      ) : (
        /* NO LINK: invite or join */
        <>
          {/* Invite card */}
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/15">
                <Link2 size={18} className="text-brand" />
              </div>
              <div>
                <p className="font-semibold">Invite your partner</p>
                <p className="text-xs text-gray-500">Send them a link — when they open it and log in, you&apos;re linked</p>
              </div>
            </div>
            <input
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="Partner's email (optional, just for the invite label)"
              className="mb-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
            <button
              onClick={generateInvite}
              disabled={generating || !!link}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient py-3 text-sm font-bold text-black hover:opacity-90 disabled:opacity-50"
            >
              {generating
                ? <RefreshCw size={14} className="animate-spin" />
                : <Link2 size={14} />}
              Generate Invite Link
            </button>
          </div>

          {/* Join info */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5">
                <LogIn size={18} className="text-gray-400" />
              </div>
              <div>
                <p className="font-semibold">Joining someone else's household?</p>
                <p className="text-xs text-gray-500">Ask your partner to send you their invite link from this page</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              When they share the link with you, just open it while logged in here and you&apos;ll be prompted to accept.
            </p>
          </div>
        </>
      )}

      {/* Your items (solo view when not linked) */}
      {link?.status !== "accepted" && myItems.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Your Subscriptions &amp; Bills</p>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/5 overflow-hidden">
            {myItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <MerchantLogo name={item.name} color={item.color || TYPE_COLORS[item.type] || "#888"} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{item.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                </div>
                <p className="text-sm font-mono font-bold">{fmt(item.amount)}/mo</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SQL setup notice */}
      {!link && (
        <div className="mt-8 rounded-xl border border-white/5 bg-white/[0.01] p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600 mb-2">Supabase Setup Required</p>
          <p className="text-xs text-gray-600 mb-3">Run this SQL in your Supabase dashboard to enable account linking:</p>
          <pre className="overflow-x-auto rounded-lg bg-black/40 p-3 text-[10px] text-gray-400 leading-relaxed whitespace-pre">{SQL_SETUP}</pre>
        </div>
      )}
    </div>
  );
}

const SQL_SETUP = `-- 1. household_links table
create table if not exists household_links (
  id uuid default gen_random_uuid() primary key,
  user_id_a uuid references auth.users not null,
  user_id_b uuid references auth.users,
  email_a text,
  email_b text,
  invite_code text unique not null,
  status text default 'pending'
    check (status in ('pending','accepted')),
  created_at timestamptz default now()
);
alter table household_links enable row level security;

create policy "hl_select" on household_links for select
  using (auth.uid() = user_id_a
      or auth.uid() = user_id_b
      or status = 'pending');
create policy "hl_insert" on household_links for insert
  with check (auth.uid() = user_id_a);
create policy "hl_update" on household_links for update
  using (status = 'pending'
      or auth.uid() = user_id_a
      or auth.uid() = user_id_b);
create policy "hl_delete" on household_links for delete
  using (auth.uid() = user_id_a
      or auth.uid() = user_id_b);

-- 2. Let household partners read each other's items
create policy "items_partner_read" on items for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from household_links hl
      where hl.status = 'accepted'
      and ((hl.user_id_a = auth.uid() and hl.user_id_b = items.user_id)
        or (hl.user_id_b = auth.uid() and hl.user_id_a = items.user_id))
    )
  );`;
