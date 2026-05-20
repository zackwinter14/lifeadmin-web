"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Bot, Send, User, Sparkles, RefreshCw, Bell, BellOff, Mail } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
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
  const bottomRef = useRef<HTMLDivElement>(null);
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

      // Always generate fresh on AutoAI page open (unlike dashboard which caches 24h)
      setLoadingInsight(true);
      try {
        const res = await fetch("/api/autoai/insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
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
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    init();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, loadingInsight]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/autoai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, systemPrompt }),
      });
      if (!res.ok) throw new Error("API error");
      const { reply } = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
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

      {/* Empty state with starters — shown only if insight failed to load */}
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
        <div className="flex-1 space-y-4 pb-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 mt-0.5">
                  <Bot size={15} className="text-purple-400" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "rounded-tr-sm bg-purple-500/20 border border-purple-500/30 text-white"
                  : "rounded-tl-sm bg-white/[0.04] border border-white/10 text-gray-200"
              }`}>
                {/* First assistant message gets a subtle "proactive" label */}
                {m.role === "assistant" && i === 0 && (
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-400/70">AutoAI check-in</p>
                )}
                {m.content.split("\n").map((line, j) => (
                  <span key={j}>{line}{j < m.content.split("\n").length - 1 && <br />}</span>
                ))}
              </div>
              {m.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 mt-0.5">
                  <User size={14} className="text-gray-400" />
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
