"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Bot, Send, User, Sparkles, RefreshCw, Bell, Mail, Check, X as XIcon, CircleX } from "lucide-react";

// Tool call returned by the API. v1 supports: find_item (read-only) and mark_for_cancel (requires Confirm).
interface ToolUse {
  id: string;
  name: string;
  input: Record<string, any>;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  // Assistant-only fields for tool-call flow
  blocks?: any[];                 // raw response.content for follow-up turns
  toolUses?: ToolUse[];           // tools the model wants the user to confirm
  pendingTools?: string[];        // tool_use ids still awaiting confirmation
  resolvedTools?: Record<string, { approved: boolean; resultText: string }>;
  systemNote?: boolean;           // small grey "Done."/"Cancelled." note bubble
}

const STARTERS = [
  "How can I reduce my monthly subscriptions?",
  "What's a good budget breakdown for my income?",
  "How do I build an emergency fund?",
  "Should I pay off debt or invest first?",
  "How can I negotiate a lower bill?",
  "What's the 50/30/20 budget rule?",
];

const NOTIF_KEY = "autoai_notifications";
const EMAIL_KEY = "autoai_email_digest";
const INSIGHT_CACHE_KEY = "autoai_last_insight_date";

export default function AutoAIPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [authed, setAuthed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [emailDigest, setEmailDigest] = useState<"off" | "weekly" | "daily">("weekly");
  const [userEmail, setUserEmail] = useState("");
  const [savingPrefs, setSavingPrefs] = useState(false);
  const clientIncomeRef = useRef<number>(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      setUserEmail(user.email || "");
      setAuthed(true);

      // Load saved preferences
      try {
        const notifPref = localStorage.getItem(NOTIF_KEY);
        if (notifPref !== null) setNotifEnabled(notifPref === "true");
        const emailPref = localStorage.getItem(EMAIL_KEY) as "off" | "weekly" | "daily" | null;
        if (emailPref) setEmailDigest(emailPref);
      } catch {}

      // Auto-generate personalized opening message (once per day)
      const today = new Date().toDateString();
      const lastDate = localStorage.getItem(`${INSIGHT_CACHE_KEY}_${user.id}`);

      // Read income directly with user's auth client  -  reliable regardless of server-side RLS
      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("monthly_income")
          .eq("id", user.id)
          .single();
        if (prof?.monthly_income) clientIncomeRef.current = Number(prof.monthly_income);
      } catch {}

      // Always generate fresh on AutoAI page open (unlike dashboard which caches 24h)
      setLoadingInsight(true);
      try {
        const res = await fetch("/api/autoai/insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, clientIncome: clientIncomeRef.current }),
        });
        const data = await res.json();
        if (data.message) {
          setMessages([{ role: "assistant", content: data.message }]);
          if (data.systemPrompt) setSystemPrompt(data.systemPrompt);
          localStorage.setItem(`${INSIGHT_CACHE_KEY}_${user.id}`, today);
          // Mark notification as read since user is on the page
          localStorage.setItem(`autoai_unread_${user.id}`, "false");
        }
      } catch {}
      setLoadingInsight(false);

      // If we arrived here from /recurring (or another page) with ?ask=, prefill and send.
      const preset = searchParams?.get("ask");
      if (preset) {
        setInput(preset);
        // Fire it after the opening message renders so it lands naturally
        setTimeout(() => sendMessage(preset), 200);
      } else {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, loading, loadingInsight]);

  // Map our chat history into the shape the API expects (Anthropic-compatible).
  // For messages that carry blocks (tool_use / tool_result), pass the blocks through.
  function buildApiPayload(history: Message[]) {
    return history.map(m => {
      if (m.role === "user" && Array.isArray(m.blocks)) {
        return { role: "user", content: m.blocks };
      }
      if (m.role === "assistant" && Array.isArray(m.blocks)) {
        return { role: "assistant", content: m.blocks };
      }
      return { role: m.role, content: m.content };
    });
  }

  // Read-only tool: search current user's items in Supabase.
  async function execFindItem(query: string) {
    if (!user) return { success: false, summary: "Not logged in." };
    const { data, error } = await supabase
      .from("items")
      .select("id, name, amount, type, category")
      .eq("user_id", user.id)
      .ilike("name", `%${query}%`)
      .limit(5);
    if (error) return { success: false, summary: "Search failed: " + error.message };
    const matches = (data || []).map(d => ({ id: String(d.id), name: d.name, amount: d.amount, type: d.type, category: d.category }));
    return { success: true, summary: `Found ${matches.length} match${matches.length === 1 ? "" : "es"}.`, matches };
  }

  // Confirm-required tool: flag an item as marked-for-cancel.
  // We persist to localStorage (mirrors the mobile app's in-state toCancel list) so the
  // user can find it on /cancel without requiring a schema change here.
  async function execMarkForCancel(itemId: string) {
    if (!user) return { success: false, summary: "Not logged in." };
    const { data: item } = await supabase
      .from("items")
      .select("id, name")
      .eq("id", itemId)
      .eq("user_id", user.id)
      .single();
    if (!item) return { success: false, summary: "Item not found." };
    try {
      const key = `cancel_intents_${user.id}`;
      const list: { id: string; name: string; at: string }[] = JSON.parse(localStorage.getItem(key) || "[]");
      if (!list.some(x => x.id === itemId)) list.push({ id: itemId, name: item.name, at: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(list));
    } catch {}
    return { success: true, summary: `Marked ${item.name} to cancel. Open Cancel Mgr to finish.` };
  }

  async function execAddItem(name: string, amount: number, type: string, category?: string) {
    if (!user) return { success: false, summary: "Not logged in." };
    const TYPE_COLORS: Record<string, string> = {
      subscription: "#3EA758",
      bill: "#FFB300",
      expense: "#FF6B35",
    };
    const { data, error } = await supabase.from("items").insert({
      user_id: user.id,
      name,
      amount,
      type,
      category: category || (type === "subscription" ? "Entertainment" : type === "bill" ? "Utilities" : "Other"),
      status: "active",
      color: TYPE_COLORS[type] || "#3EA758",
      autopay: false,
    }).select().single();
    if (error) return { success: false, summary: "Could not add item: " + error.message };
    try { localStorage.setItem("items_version", String(Date.now())); } catch {}
    return { success: true, summary: `Added ${name} ($${amount}/mo) to your tracked items.`, item: data };
  }

  async function runTool(name: string, input: Record<string, any>) {
    if (name === "find_item") return execFindItem(String(input.query || ""));
    if (name === "mark_for_cancel") return execMarkForCancel(String(input.item_id || ""));
    if (name === "add_item") return execAddItem(String(input.name || ""), Number(input.amount || 0), String(input.type || "expense"), input.category ? String(input.category) : undefined);
    return { success: false, summary: `Unknown tool: ${name}` };
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);

    try {
      // Always fetch fresh user data before sending so AutoAI has up-to-date income,
      // items, and any changes made on other pages since the session started.
      let freshPrompt = systemPrompt;
      if (user?.id) {
        try {
          const ctxRes = await fetch("/api/autoai/context", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id, clientIncome: clientIncomeRef.current }),
          });
          if (ctxRes.ok) {
            const ctxData = await ctxRes.json();
            if (ctxData.systemPrompt) {
              freshPrompt = ctxData.systemPrompt;
              setSystemPrompt(ctxData.systemPrompt);
            }
          }
        } catch {}
      }

      const res = await fetch("/api/autoai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: buildApiPayload(history), systemPrompt: freshPrompt }),
      });
      if (!res.ok) throw new Error("API error");
      const { reply, toolUses, rawBlocks } = await res.json();

      // Split tool uses: find_item auto-runs (read-only); others need user confirm.
      const tools: ToolUse[] = Array.isArray(toolUses) ? toolUses : [];
      const readOnly = tools.filter(t => t.name === "find_item");
      const needsConfirm = tools.filter(t => t.name !== "find_item");

      const assistantMsg: Message = {
        role: "assistant",
        content: reply || "",
        blocks: rawBlocks,
        toolUses: needsConfirm,
        pendingTools: needsConfirm.map(t => t.id),
      };

      let history2 = [...history, assistantMsg];
      setMessages(history2);

      // Auto-run read-only tools, send results back for a follow-up turn.
      if (readOnly.length > 0) {
        const results = [];
        for (const t of readOnly) {
          const r = await runTool(t.name, t.input);
          results.push({ tool_use_id: t.id, result: r });
        }
        const userToolResult: Message = {
          role: "user",
          content: "",
          blocks: results.map(r => ({
            type: "tool_result",
            tool_use_id: r.tool_use_id,
            content: JSON.stringify(r.result),
          })),
        };
        history2 = [...history2, userToolResult];

        const res2 = await fetch("/api/autoai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: buildApiPayload(history2), systemPrompt }),
        });
        if (res2.ok) {
          const { reply: reply2, toolUses: tu2, rawBlocks: rb2 } = await res2.json();
          const followConfirm = (tu2 || []).filter((t: ToolUse) => t.name !== "find_item");
          setMessages(prev => [...prev, {
            role: "assistant",
            content: reply2 || "",
            blocks: rb2,
            toolUses: followConfirm,
            pendingTools: followConfirm.map((t: ToolUse) => t.id),
          }]);
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I couldn't connect right now. Please try again in a moment.",
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  // User tapped Confirm / Cancel on a pending tool card.
  async function handleToolDecision(msgIndex: number, tu: ToolUse, approved: boolean) {
    let resultText = "Cancelled.";
    if (approved) {
      const r = await runTool(tu.name, tu.input);
      resultText = r?.summary || (r?.success ? "Done." : "Could not complete.");
    }
    setMessages(prev => {
      const next = [...prev];
      const m = next[msgIndex];
      if (m) {
        m.pendingTools = (m.pendingTools || []).filter(id => id !== tu.id);
        m.resolvedTools = { ...(m.resolvedTools || {}), [tu.id]: { approved, resultText } };
      }
      next.push({ role: "assistant", content: resultText, systemNote: true });
      return next;
    });
  }

  function reset() {
    setMessages([]);
    setInput("");
    setLoadingInsight(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function savePreferences() {
    setSavingPrefs(true);
    try {
      localStorage.setItem(NOTIF_KEY, String(notifEnabled));
      localStorage.setItem(EMAIL_KEY, emailDigest);
      // Save to Supabase profiles for server-side email sending
      await supabase.from("profiles").update({
        autoai_notifications: notifEnabled,
        autoai_email_digest: emailDigest,
      }).eq("id", user.id);
    } catch {}
    setSavingPrefs(false);
    setShowSettings(false);
  }

  if (!authed) return <div className="flex min-h-screen items-center justify-center"><div className="text-gray-500">Loading...</div></div>;

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-4 py-10" style={{ minHeight: "calc(100vh - 73px)" }}>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AutoAI</h1>
          <p className="mt-1 text-sm text-gray-400">Your proactive finance assistant.</p>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 1 && (
            <button onClick={reset} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-400 hover:bg-white/10 hover:text-white transition">
              <RefreshCw size={13} /> New chat
            </button>
          )}
          <button
            onClick={() => setShowSettings(s => !s)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition ${showSettings ? "border-purple-500/40 bg-purple-500/10 text-purple-400" : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"}`}
          >
            <Bell size={13} /> Alerts
          </button>
        </div>
      </div>

      {/* Notification preferences panel */}
      {showSettings && (
        <div className="mb-6 rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-5">
          <p className="mb-4 text-sm font-semibold text-white">AutoAI Alert Preferences</p>
          <div className="space-y-4">
            {/* In-app notifications */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">In-app insights</p>
                <p className="text-xs text-gray-500">AutoAI opens every visit with a personalized financial check-in</p>
              </div>
              <button
                onClick={() => setNotifEnabled(v => !v)}
                className={`relative h-6 w-11 rounded-full transition-colors ${notifEnabled ? "bg-purple-500" : "bg-white/10"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${notifEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>

            {/* Email digest */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Mail size={14} className="text-purple-400" />
                <p className="text-sm font-medium">Email digest</p>
              </div>
              <p className="mb-3 text-xs text-gray-500">Sent to {userEmail || "your email"}</p>
              <div className="flex gap-2">
                {(["off", "weekly", "daily"] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => setEmailDigest(opt)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition"
                    style={{
                      background: emailDigest === opt ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.05)",
                      color: emailDigest === opt ? "#a855f7" : "#6b7280",
                      border: emailDigest === opt ? "1px solid rgba(168,85,247,0.3)" : "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {opt === "off" ? "Off" : opt === "weekly" ? "Weekly" : "Daily"}
                  </button>
                ))}
              </div>
              {emailDigest !== "off" && (
                <p className="mt-2 text-xs text-gray-600">
                  You'll receive a personalized financial recap with AI insights.
                  {" "}To activate, add <code className="text-purple-400">RESEND_API_KEY</code> to your environment.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={savePreferences}
            disabled={savingPrefs}
            className="mt-4 rounded-xl bg-purple-500 px-5 py-2 text-sm font-bold text-white hover:bg-purple-400 disabled:opacity-50 transition"
          >
            {savingPrefs ? "Saving..." : "Save preferences"}
          </button>
        </div>
      )}

      {/* Loading opening message */}
      {loadingInsight && messages.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center pb-10">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20">
              <Sparkles size={28} className="text-purple-400 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-white">AutoAI is reviewing your finances...</p>
              <p className="mt-1 text-sm text-gray-500">Preparing a personalized check-in for you.</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state with starters  -  shown only if insight failed to load */}
      {!loadingInsight && messages.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center pb-10 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20">
            <Sparkles size={28} className="text-purple-400" />
          </div>
          <h2 className="mb-1 text-xl font-bold">Ask me anything about money</h2>
          <p className="mb-8 text-sm text-gray-500">I can help with budgeting, saving, debt, bills, and more.</p>
          <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
            {STARTERS.map(s => (
              <button key={s} onClick={() => sendMessage(s)}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-gray-300 transition hover:border-purple-500/30 hover:bg-purple-500/5 hover:text-white">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div ref={messagesContainerRef} className="flex-1 space-y-4 overflow-y-auto pb-4" style={{ maxHeight: "60vh" }}>
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`flex w-full gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && !m.systemNote && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 mt-0.5">
                    <Bot size={15} className="text-purple-400" />
                  </div>
                )}
                {/* Render content unless this is a pure tool-use turn with no text */}
                {(m.content || (!m.toolUses?.length && !m.systemNote)) && (
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.systemNote
                      ? "rounded-tl-sm bg-white/[0.02] border border-white/5 text-xs italic text-gray-500"
                      : m.role === "user"
                      ? "rounded-tr-sm bg-purple-500/20 border border-purple-500/30 text-white"
                      : "rounded-tl-sm bg-white/[0.04] border border-white/10 text-gray-200"
                  }`}>
                    {m.role === "assistant" && !m.systemNote && i === 0 && (
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-400/70">AutoAI check-in</p>
                    )}
                    {(m.content || "").split("\n").map((line, j, arr) => (
                      <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                    ))}
                  </div>
                )}
                {m.role === "user" && !m.systemNote && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 mt-0.5">
                    <User size={14} className="text-gray-400" />
                  </div>
                )}
              </div>

              {/* Pending tool confirm cards (assistant side only) */}
              {Array.isArray(m.toolUses) && m.toolUses.length > 0 && (
                <div className="ml-11 flex w-full max-w-[80%] flex-col gap-2">
                  {m.toolUses.map(tu => {
                    const pending = (m.pendingTools || []).includes(tu.id);
                    const resolved = m.resolvedTools?.[tu.id];
                    const label =
                      tu.name === "mark_for_cancel"
                        ? `Mark item ${tu.input?.item_id || ""} to cancel?`
                        : `Run ${tu.name}?`;
                    const icon = tu.name === "mark_for_cancel" ? <CircleX size={13} className="text-red-400" /> : <Sparkles size={13} className="text-purple-400" />;
                    return (
                      <div key={tu.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                        <div className="mb-2 flex items-center gap-2">
                          {icon}
                          <p className="text-xs font-semibold text-white">{label}</p>
                        </div>
                        {pending ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToolDecision(i, tu, true)}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-purple-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-purple-400"
                            >
                              <Check size={12} /> Confirm
                            </button>
                            <button
                              onClick={() => handleToolDecision(i, tu, false)}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-gray-400 transition hover:bg-white/[0.06]"
                            >
                              <XIcon size={12} /> Cancel
                            </button>
                          </div>
                        ) : (
                          <p className="text-[11px] italic text-gray-500">{resolved?.resultText || ""}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Suggested replies after the opening message */}
          {messages.length === 1 && !loading && (
            <div className="flex flex-wrap gap-2 pl-11">
              {["Show me where I can save", "Review my subscriptions", "How's my budget?", "What should I do first?"].map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="rounded-full border border-purple-500/20 bg-purple-500/5 px-3 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-500/15 transition">
                  {s}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20">
                <Bot size={15} className="text-purple-400" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-white/[0.04] border border-white/10 px-4 py-3">
                <div className="flex gap-1.5 items-center h-4">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className="sticky bottom-0 pt-4 pb-2">
        <form onSubmit={e => { e.preventDefault(); sendMessage(input); }}
          className="flex gap-2 rounded-2xl border border-white/10 bg-[#111] p-2">
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            placeholder={messages.length > 0 ? "Reply to AutoAI..." : "Ask about budgeting, saving, debt..."}
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-gray-600"
            disabled={loading || loadingInsight} />
          <button type="submit" disabled={!input.trim() || loading || loadingInsight}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500 text-white transition hover:bg-purple-400 disabled:opacity-30">
            <Send size={15} />
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-gray-600">AutoAI can make mistakes. Verify important financial decisions.</p>
      </div>

    </div>
  );
}
