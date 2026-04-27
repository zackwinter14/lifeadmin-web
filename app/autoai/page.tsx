"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Bot, Send, User, Sparkles, RefreshCw } from "lucide-react";

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

export default function AutoAIPage() {
  const router = useRouter();
  const supabase = createClient();
  const [authed, setAuthed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setAuthed(true);
    }
    init();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
        body: JSON.stringify({ messages: history }),
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
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  if (!authed) return <div className="flex min-h-screen items-center justify-center"><div className="text-gray-500">Loading...</div></div>;

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-4 py-10" style={{ minHeight: "calc(100vh - 73px)" }}>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AutoAI</h1>
          <p className="mt-1 text-sm text-gray-400">Your personal finance assistant.</p>
        </div>
        {messages.length > 0 && (
          <button onClick={reset} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-400 hover:bg-white/10 hover:text-white">
            <RefreshCw size={13} /> New chat
          </button>
        )}
      </div>

      {/* Empty state / starters */}
      {messages.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center pb-10 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20">
            <Sparkles size={28} className="text-purple-400" />
          </div>
          <h2 className="mb-1 text-xl font-bold">Ask me anything about money</h2>
          <p className="mb-8 text-sm text-gray-500">I can help with budgeting, saving, debt, bills, and more.</p>
          <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
            {STARTERS.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-gray-300 transition hover:border-purple-500/30 hover:bg-purple-500/5 hover:text-white"
              >
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
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-tr-sm bg-purple-500/20 border border-purple-500/30 text-white"
                    : "rounded-tl-sm bg-white/[0.04] border border-white/10 text-gray-200"
                }`}
              >
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
        <form
          onSubmit={e => { e.preventDefault(); sendMessage(input); }}
          className="flex gap-2 rounded-2xl border border-white/10 bg-[#111] p-2"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about budgeting, saving, debt..."
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-gray-600"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500 text-white transition hover:bg-purple-400 disabled:opacity-30"
          >
            <Send size={15} />
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-gray-600">AutoAI can make mistakes. Verify important financial decisions.</p>
      </div>

    </div>
  );
}
