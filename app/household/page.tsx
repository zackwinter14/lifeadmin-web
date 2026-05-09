"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Plus, X, Users, Trash2, AlertTriangle, Check, Copy, Zap } from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "owner" | "member";
  subscriptions: SharedSub[];
}

interface SharedSub {
  id: string;
  name: string;
  amount: number;
  memberId: string;
}

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function HouseholdPage() {
  const router = useRouter();
  const supabase = createClient();
  const [authed, setAuthed] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddSub, setShowAddSub] = useState<string | null>(null);
  const [inviteCode] = useState(() => Math.random().toString(36).slice(2, 10).toUpperCase());
  const [copied, setCopied] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: "", email: "" });
  const [subForm, setSubForm] = useState({ name: "", amount: "" });
  const [realSubs, setRealSubs] = useState<{ name: string; amount: number }[]>([]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserEmail(user.email || "");

      // Load real subscriptions from items table for the owner
      const { data: itemsData } = await supabase
        .from("items")
        .select("name, amount")
        .eq("user_id", user.id)
        .eq("type", "subscription")
        .eq("status", "active");
      if (itemsData) setRealSubs(itemsData);

      try {
        const stored = localStorage.getItem("household_members");
        if (stored) {
          const parsed: Member[] = JSON.parse(stored);
          // Always sync owner's subs from real items
          const ownerIdx = parsed.findIndex(m => m.role === "owner");
          if (ownerIdx !== -1 && itemsData && itemsData.length > 0) {
            const ownerSubs: SharedSub[] = itemsData.map((s, i) => ({
              id: `real_${i}`,
              name: s.name,
              amount: s.amount,
              memberId: parsed[ownerIdx].id,
            }));
            parsed[ownerIdx].subscriptions = ownerSubs;
          }
          setMembers(parsed);
        } else {
          const ownerSubs: SharedSub[] = (itemsData || []).map((s, i) => ({
            id: `real_${i}`,
            name: s.name,
            amount: s.amount,
            memberId: "owner",
          }));
          const defaultMember: Member = {
            id: "owner",
            name: user.email?.split("@")[0] || "You",
            email: user.email || "",
            role: "owner",
            subscriptions: ownerSubs,
          };
          setMembers([defaultMember]);
          localStorage.setItem("household_members", JSON.stringify([defaultMember]));
        }
      } catch {}
      setAuthed(true);
    }
    init();
  }, []);

  function saveMembers(updated: Member[]) {
    setMembers(updated);
    try { localStorage.setItem("household_members", JSON.stringify(updated)); } catch {}
  }

  function addMember() {
    if (!memberForm.name) return;
    const m: Member = {
      id: `m${Date.now()}`,
      name: memberForm.name,
      email: memberForm.email,
      role: "member",
      subscriptions: [],
    };
    saveMembers([...members, m]);
    setMemberForm({ name: "", email: "" });
    setShowAddMember(false);
  }

  function removeMember(id: string) {
    saveMembers(members.filter(m => m.id !== id));
  }

  function addSub(memberId: string) {
    if (!subForm.name || !subForm.amount) return;
    const sub: SharedSub = {
      id: `s${Date.now()}`,
      name: subForm.name,
      amount: parseFloat(subForm.amount) || 0,
      memberId,
    };
    saveMembers(members.map(m =>
      m.id === memberId ? { ...m, subscriptions: [...m.subscriptions, sub] } : m
    ));
    setSubForm({ name: "", amount: "" });
    setShowAddSub(null);
  }

  function removeSub(memberId: string, subId: string) {
    saveMembers(members.map(m =>
      m.id === memberId ? { ...m, subscriptions: m.subscriptions.filter(s => s.id !== subId) } : m
    ));
  }

  function copyInvite() {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!authed) return <div className="flex min-h-screen items-center justify-center"><div className="text-gray-500">Loading...</div></div>;

  const allSubs = members.flatMap(m => m.subscriptions);
  const totalMonthly = allSubs.reduce((a, s) => a + s.amount, 0);

  // Detect duplicates (same subscription name across members)
  const subNames: Record<string, string[]> = {};
  members.forEach(m => {
    m.subscriptions.forEach(s => {
      const key = s.name.toLowerCase().trim();
      if (!subNames[key]) subNames[key] = [];
      subNames[key].push(m.name);
    });
  });
  const duplicates = Object.entries(subNames).filter(([, names]) => names.length > 1);

  const inputCls = "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-brand";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Household</h1>
          <p className="mt-1 text-sm text-gray-400">See everyone&apos;s subscriptions together.</p>
        </div>
        <button
          onClick={() => setShowAddMember(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-bold text-black hover:opacity-90"
        >
          <Plus size={15} /> Add Member
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4">
          <p className="mb-1 text-xs text-gray-500">Total monthly</p>
          <p className="font-mono text-xl font-black text-brand">{fmt(totalMonthly)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <p className="mb-1 text-xs text-gray-500">Members</p>
          <p className="font-mono text-xl font-bold">{members.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <p className="mb-1 text-xs text-gray-500">Subscriptions</p>
          <p className="font-mono text-xl font-bold">{allSubs.length}</p>
        </div>
      </div>

      {/* Duplicates warning */}
      {duplicates.length > 0 && (
        <div className="mb-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-orange-400 shrink-0" />
            <p className="text-sm font-semibold text-orange-400">Overlapping subscriptions detected</p>
          </div>
          <div className="space-y-2">
            {duplicates.map(([name, names]) => (
              <div key={name} className="flex items-center justify-between rounded-lg bg-orange-500/5 px-3 py-2">
                <span className="text-sm capitalize">{name}</span>
                <span className="text-xs text-orange-400">{names.join(" + ")} both paying</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">Consider sharing one account to save money.</p>
        </div>
      )}

      {/* Invite code */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Household invite code</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 font-mono text-lg font-bold tracking-[0.2em] text-brand">
            {inviteCode}
          </div>
          <button
            onClick={copyInvite}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold hover:bg-white/10 transition"
          >
            {copied ? <Check size={14} className="text-brand" /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-600">Share this code with household members to join.</p>
      </div>

      {/* Members */}
      <div className="space-y-4">
        {members.map(member => (
          <div key={member.id} className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            {/* Member header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/15 text-sm font-bold text-brand">
                  {member.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {member.name}
                    {member.role === "owner" && (
                      <span className="ml-2 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">Owner</span>
                    )}
                  </p>
                  {member.email && <p className="text-xs text-gray-500">{member.email}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-brand">
                  {fmt(member.subscriptions.reduce((a, s) => a + s.amount, 0))}<span className="text-xs font-normal text-gray-500">/mo</span>
                </span>
                {member.role !== "owner" && (
                  <button onClick={() => removeMember(member.id)} className="ml-2 text-gray-600 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Subscriptions */}
            <div className="p-3">
              {member.role === "owner" && realSubs.length > 0 && (
                <div className="mb-2 flex items-center gap-1.5 text-[10px] text-brand/70">
                  <Zap size={10} /> Synced from your subscriptions — edit them in My Finances
                </div>
              )}
              {member.subscriptions.length === 0 ? (
                <p className="py-3 text-center text-xs text-gray-600">
                  {member.role === "owner"
                    ? "No subscriptions found — add some in My Finances first."
                    : "No subscriptions added yet — click below to add theirs."}
                </p>
              ) : (
                <div className="space-y-1.5 mb-3">
                  {member.subscriptions.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                      <span className="text-sm">{sub.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-gray-300">{fmt(sub.amount)}<span className="text-xs text-gray-600">/mo</span></span>
                        <button onClick={() => removeSub(member.id, sub.id)} className="text-gray-700 hover:text-red-400">
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showAddSub === member.id ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    Add a subscription this person pays for — e.g. Netflix, Spotify, Hulu.
                  </p>
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={subForm.name}
                      onChange={e => setSubForm(f => ({ ...f, name: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter" && subForm.name && subForm.amount) addSub(member.id); }}
                      placeholder="e.g. Netflix, Spotify, Rent..."
                      className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-brand"
                    />
                    <div className="relative w-28">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500">$/mo</span>
                      <input
                        type="number"
                        value={subForm.amount}
                        onChange={e => setSubForm(f => ({ ...f, amount: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter" && subForm.name && subForm.amount) addSub(member.id); }}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand"
                      />
                    </div>
                    <button
                      onClick={() => addSub(member.id)}
                      disabled={!subForm.name || !subForm.amount}
                      className="rounded-lg bg-brand-gradient px-3 py-2 text-sm font-bold text-black disabled:opacity-40"
                    >
                      <Check size={14} />
                    </button>
                    <button onClick={() => setShowAddSub(null)} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-400 hover:bg-white/5">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setShowAddSub(member.id); setSubForm({ name: "", amount: "" }); }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/10 py-2 text-xs text-gray-500 hover:border-brand/30 hover:text-brand transition"
                >
                  <Plus size={12} /> Add their subscription
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add member modal */}
      {showAddMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={e => { if (e.target === e.currentTarget) setShowAddMember(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Add Member</h2>
                <p className="text-xs text-gray-500">Add a household member manually</p>
              </div>
              <button onClick={() => setShowAddMember(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Name *</label>
                <input
                  autoFocus
                  value={memberForm.name}
                  onChange={e => setMemberForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Partner, Roommate"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Email (optional)</label>
                <input
                  value={memberForm.email}
                  onChange={e => setMemberForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@example.com"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowAddMember(false)} className="flex-1 rounded-xl border border-white/10 py-3 text-sm hover:bg-white/5">Cancel</button>
              <button
                onClick={addMember}
                disabled={!memberForm.name}
                className="flex-1 rounded-xl bg-brand-gradient py-3 text-sm font-bold text-black hover:opacity-90 disabled:opacity-40"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
