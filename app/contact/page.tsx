"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MessageCircle, Shield, Clock, ArrowRight, Check, Send } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);

    // Open email client with pre-filled email — works without backend
    const body = `Name: ${name}%0D%0AEmail: ${email}%0D%0A%0D%0A${encodeURIComponent(message)}`;
    const subjectLine = encodeURIComponent(subject || "Life Admin support");
    window.location.href = `mailto:lifeadminofficial@gmail.com?subject=${subjectLine}&body=${body}`;

    setTimeout(() => {
      setSent(true);
      setSending(false);
    }, 500);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold md:text-5xl">Get in touch</h1>
        <p className="mt-4 text-lg text-gray-400 max-w-xl mx-auto">
          Questions, bug reports, or just want to chat about money? We&apos;re here.
        </p>
      </div>

      {/* Contact methods */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
            <MessageCircle size={18} className="text-brand" />
          </div>
          <p className="font-semibold mb-1">Email us</p>
          <a href="mailto:lifeadminofficial@gmail.com" className="text-xs text-brand hover:underline break-all">
            lifeadminofficial@gmail.com
          </a>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
            <Clock size={18} className="text-brand" />
          </div>
          <p className="font-semibold mb-1">Response time</p>
          <p className="text-xs text-gray-500">Within 24 hours</p>
        </div>
      </div>

      {/* Contact form */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
            <Mail size={18} className="text-brand" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Send us a message</h2>
            <p className="text-xs text-gray-500">Opens your email app to send</p>
          </div>
        </div>

        {sent ? (
          <div className="text-center py-8">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand/15">
              <Check size={26} className="text-brand" />
            </div>
            <p className="text-lg font-bold mb-1">Email opened</p>
            <p className="text-sm text-gray-400">Check your email app to send the message.</p>
            <button
              onClick={() => { setSent(false); setName(""); setEmail(""); setSubject(""); setMessage(""); }}
              className="mt-4 text-sm text-brand hover:underline"
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Name</label>
                <input
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Subject</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-brand"
              >
                <option value="">Select a topic</option>
                <option value="Bug report">Bug report</option>
                <option value="Feature request">Feature request</option>
                <option value="Account / billing question">Account / billing question</option>
                <option value="Bank connection issue">Bank connection issue</option>
                <option value="Privacy / data question">Privacy / data question</option>
                <option value="Just saying hi">Just saying hi</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Message</label>
              <textarea
                required
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind..."
                rows={6}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-brand resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending || !name || !email || !message}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient py-3 font-semibold text-black hover:opacity-90 disabled:opacity-50"
            >
              {sending ? "Opening email..." : <>Send message <Send size={15} /></>}
            </button>
          </form>
        )}
      </div>

      {/* Footer note */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 mb-3">Need help with something specific?</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/transparency" className="text-sm text-brand hover:underline">
            How we make money
          </Link>
          <span className="text-gray-700">·</span>
          <Link href="/privacy" className="text-sm text-brand hover:underline">
            Privacy policy
          </Link>
          <span className="text-gray-700">·</span>
          <Link href="/terms" className="text-sm text-brand hover:underline">
            Terms of service
          </Link>
        </div>
      </div>
    </div>
  );
}
