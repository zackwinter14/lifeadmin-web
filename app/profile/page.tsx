"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { User, Gift, Lock, AlertTriangle, MessageCircle, ChevronRight, ChevronDown, Copy, Check, Send, Hash, Sparkles, Shield, Delete } from "lucide-react";
import { getPinHash, savePin, clearPin, markSessionVerified } from "@/components/PinGate";

// ── helpers ──────────────────────────────────────────────────────────────────

function generateCode(userId: string) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let seed = userId ? userId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) : Date.now();
  let code = "";
  for (let i = 0; i < 6; i++) { code += chars[seed % chars.length]; seed = (seed * 31 + 7) % 997; }
  return code;
}


function AccountCopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-400 hover:bg-white/5 hover:text-white">
      {copied ? <><Check size={11} className="text-brand" /> Copied</> : <><Copy size={11} /> Copy</>}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-brand">{title}</p>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, onClick, last = false }: { label: string; value?: string; onClick?: () => void; last?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between px-5 py-3.5 text-left transition hover:bg-white/5 ${!last ? "border-b border-white/5" : ""}`}
    >
      <span className="text-sm text-gray-200">{label}</span>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-gray-500">{value}</span>}
        {onClick && <ChevronRight size={15} className="text-gray-600" />}
      </div>
    </button>
  );
}

function AccordionItem({ label, detail, last = false }: { label: string; detail: string; last?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={!last ? "border-b border-white/5" : ""}>
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-start justify-between px-5 py-3.5 text-left transition hover:bg-white/5">
        <span className="mr-4 text-sm font-semibold text-gray-200">{label}</span>
        {open ? <ChevronDown size={15} className="mt-0.5 shrink-0 text-brand" /> : <ChevronRight size={15} className="mt-0.5 shrink-0 text-gray-600" />}
      </button>
      {open && <p className="px-5 pb-4 text-sm leading-relaxed text-gray-400">{detail}</p>}
    </div>
  );
}

function AccordionSection({ title, items }: { title: string; items: { label: string; detail: string }[] }) {
  return (
    <div className="mb-2">
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-brand">{title}</p>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        {items.map((item, i) => (
          <AccordionItem key={i} label={item.label} detail={item.detail} last={i === items.length - 1} />
        ))}
      </div>
    </div>
  );
}

// ── sub-pages ─────────────────────────────────────────────────────────────────

function ReferPage({ onBack }: { onBack: () => void }) {
  const [code] = useState(() => {
    try {
      const stored = localStorage.getItem("referral_code");
      if (stored) return stored;
      const userId = localStorage.getItem("auth_user_id") || String(Date.now());
      const c = generateCode(userId);
      localStorage.setItem("referral_code", c);
      return c;
    } catch { return generateCode(String(Date.now())); }
  });
  const [referralCount] = useState(() => { try { return parseInt(localStorage.getItem("referral_count") || "0"); } catch { return 0; } });
  const subscribedCount = Math.floor(referralCount * 0.4);
  const freeMonths = subscribedCount;
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function share() {
    const msg = `I've been saving money with Life Admin — track your bills, subs, and budget. Use my code ${code} for a free first month! Download: https://apps.apple.com/app/id6762589970`;
    if (navigator.share) { navigator.share({ title: "Life Admin", text: msg }).catch(() => {}); }
    else { navigator.clipboard?.writeText(msg).catch(() => {}); }
  }

  return (
    <div>
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white">
        ← Back to Profile
      </button>
      <h1 className="mb-1 text-2xl font-bold">Refer &amp; Earn</h1>
      <p className="mb-6 text-sm text-gray-400">Your unique invite code</p>

      <div className="mb-4 rounded-2xl border border-brand/30 bg-brand/5 p-5">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-brand/40 bg-brand/20 mx-auto">
          <Gift size={22} className="text-brand" />
        </div>
        <h2 className="mb-1 text-center text-lg font-bold">Give a month, get a month</h2>
        <p className="mb-5 text-center text-sm text-gray-400 leading-relaxed">
          Your friend gets their first month free. When they subscribe, you get a free month too.
        </p>

        <div className="mb-3 rounded-xl border border-brand/25 bg-black/40 p-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Your Referral Code</p>
          <div className="flex items-center justify-between">
            <span className="font-mono text-2xl font-black tracking-widest text-brand">{code}</span>
            <button
              onClick={copy}
              className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-black hover:opacity-90"
            >
              {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>
        </div>

        <button onClick={share} className="w-full rounded-xl border border-brand/30 bg-brand/10 py-2.5 text-sm font-bold text-brand hover:bg-brand/20">
          Share with a friend
        </button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "Referrals", value: referralCount, color: "#3EA758" },
          { label: "Subscribed", value: subscribedCount, color: "#34C759" },
          { label: "Free Months", value: freeMonths, color: "#F5C518" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
            <p className="font-mono text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="mt-0.5 text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand">How It Works</p>
      <div className="mb-4 space-y-2">
        {[
          { step: "1", text: "Share your code with a friend" },
          { step: "2", text: "They download Life Admin and enter your code at signup" },
          { step: "3", text: "Their first month is free — no credit card hold" },
          { step: "4", text: "When they subscribe, you both get 1 free month credited" },
        ].map(s => (
          <div key={s.step} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <span className="rounded-md bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">Step {s.step}</span>
            <p className="text-sm text-gray-300">{s.text}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        Free months apply when your referral&apos;s first paid month clears. Both free months auto-renew at standard rates after. No limit on referrals.
      </p>
    </div>
  );
}

function PrivacyPage({ onBack }: { onBack: () => void }) {
  const sections = [
    { title: "What We Collect", items: [
      { label: "Transaction data", detail: "Merchant name, amount, date — read-only via Plaid. We never see your credentials or full account number." },
      { label: "Email metadata", detail: "Subject line, sender, date, and key fields only. We never read or store full email bodies." },
      { label: "Structured extracts", detail: "We save only: company name, amount, due date, category. Raw emails and bank statements are never stored." },
      { label: "Profile info", detail: "Name, email, phone — entered by you. Used only for your account and notifications." },
    ]},
    { title: "How We Use It", items: [
      { label: "Bill & subscription detection", detail: "Our rules engine classifies recurring charges. AI only runs on ambiguous items." },
      { label: "Reminders & alerts", detail: "Due dates and renewal dates power push notifications. Nothing sold to advertisers." },
      { label: "Ads on free plan", detail: "Free users see sponsored banner placements. Pro subscribers see zero ads. We never sell your data." },
      { label: "No ads on Pro", detail: "Any active paid subscription removes all advertising from your account for the duration of the subscription." },
    ]},
    { title: "Your Rights", items: [
      { label: "Access your data", detail: "Export everything stored about you at any time from Profile → Export Data." },
      { label: "Delete your account", detail: "Deleting your account permanently removes all stored data within 30 days, including backups." },
      { label: "Disconnect sources", detail: "Removing a bank or email source stops all future scanning immediately." },
      { label: "CCPA & GDPR", detail: "California and EU/EEA residents have additional rights including data portability, erasure, and objection to processing." },
    ]},
    { title: "Security", items: [
      { label: "Encryption in transit", detail: "All data is encrypted using TLS 1.3." },
      { label: "Encryption at rest", detail: "Stored data is encrypted using AES-256." },
      { label: "OAuth only", detail: "We never store your bank or email passwords. All connections use OAuth 2.0." },
      { label: "Plaid security", detail: "Bank connections use Plaid — SOC 2 Type II certified." },
    ]},
    { title: "Purchases & Refunds", items: [
      { label: "All purchases are final — no refunds", detail: "All subscription payments — monthly ($10), quarterly ($24.99), or annual ($99.99) — are non-refundable. We offer a 7-day free trial so you can fully evaluate before any charge." },
      { label: "Cancellation policy", detail: "You may cancel at any time. Cancellation takes effect at the end of the current billing period. You retain Pro access until that date." },
      { label: "7-day free trial", detail: "New users get a 7-day free trial. No charge during the trial. After 7 days, your plan auto-starts at the monthly rate ($10/mo) unless you selected a different plan or cancelled." },
      { label: "Referral free month", detail: "Referred users receive 1 free month. After that, their subscription auto-renews at $10/mo. The referring user also receives 1 free month." },
    ]},
    { title: "Applicable Laws", items: [
      { label: "CCPA (California)", detail: "California residents have the right to know, delete, and opt out of the sale of personal information. We do not sell personal information." },
      { label: "GDPR (EU/EEA)", detail: "EU and EEA residents have rights to access, rectify, erase, and port their data. Lawful basis is contract performance and legitimate interests." },
      { label: "GLBA (US Financial)", detail: "We comply with the Gramm-Leach-Bliley Act. We provide clear notice of our privacy practices and limit sharing of nonpublic personal information." },
      { label: "CAN-SPAM & TCPA", detail: "All emails and SMS comply with CAN-SPAM and TCPA. Opt out anytime in Notification Settings." },
    ]},
  ];

  return (
    <div>
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white">
        ← Back to Profile
      </button>
      <h1 className="mb-1 text-2xl font-bold">Privacy &amp; Terms</h1>
      <p className="mb-2 text-sm text-gray-400">Last updated April 17, 2025</p>
      <div className="mb-6 rounded-xl border border-brand/30 bg-brand/5 px-4 py-3 text-sm leading-relaxed text-gray-300">
        Your financial data belongs to you. We collect only what&apos;s needed, never sell it, and you can delete everything at any time.
      </div>

      {sections.map((sec, si) => (
        <AccordionSection key={si} title={sec.title} items={sec.items} />
      ))}

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <p className="mb-2 text-sm font-bold">Data Protection Officer</p>
        <p className="text-sm text-brand">privacy@lifeadminofficial.com</p>
      </div>
      <p className="mt-4 text-center text-xs text-gray-600 leading-relaxed">
        Life Admin Inc. · San Francisco, CA<br />By using this app you agree to these Terms.
      </p>
      <a
        href="https://zackwinter14.github.io/lifeadmin-privacy/privacy-policy.html"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block w-full rounded-xl border border-brand/25 py-3 text-center text-sm font-semibold text-brand hover:bg-brand/5"
      >
        View Full Privacy Policy
      </a>
    </div>
  );
}

function DisclaimerPage({ onBack }: { onBack: () => void }) {
  const sections = [
    { title: "Informational Purposes Only", items: [
      { label: "Not financial advice", detail: "Life Admin is a personal-finance tracking tool. Nothing in this app constitutes financial, investment, tax, legal, accounting, or other professional advice. Always consult a qualified professional before making financial decisions." },
      { label: "No fiduciary duty", detail: "Life Admin Inc. and its operators are not your financial advisor, broker, accountant, attorney, or fiduciary. We do not recommend specific products, investments, or actions." },
      { label: "Educational only", detail: "Any budgeting tips, savings suggestions, subscription recommendations, category classifications, or automated insights are provided for educational and informational purposes only." },
    ]},
    { title: "Bank Data & Merchant Names", items: [
      { label: "Merchant names may be incorrect", detail: "Transactions are imported from your financial institution through Plaid. The merchant name, category, and description shown reflect raw data from your bank and may contain abbreviations, store numbers, or codes that don't match the actual business you paid." },
      { label: "Automatic classification is best-effort", detail: "Our rules engine and AI-assisted classification attempt to identify subscriptions, bills, and expenses. Classifications may be wrong, incomplete, or out of date. You are responsible for reviewing and correcting any imported data." },
      { label: "Balances and amounts may lag", detail: "Balances and transaction amounts are provided by your bank via Plaid and may be delayed, cached, or temporarily unavailable. Always verify against your bank's official statement." },
    ]},
    { title: "Bank Reconnection & Reinstalls", items: [
      { label: "You must re-link your bank after reinstall", detail: "For your protection, any time the app is deleted, reinstalled, or signed out, you will be required to re-authenticate your bank connection through Plaid. This is a security feature, not a bug." },
      { label: "Signing out has the same effect", detail: "Signing out also requires re-linking your bank on next sign-in. Your historical data (items, expenses) is preserved under your account and will reappear once you sign back in." },
      { label: "Re-linking takes under a minute", detail: "Go to Profile → Manage Accounts → Add Bank, pick your institution, and complete the Plaid flow. No historical data is lost during re-link." },
    ]},
    { title: "No Warranty", items: [
      { label: "Provided \"as is\"", detail: "The app and all features are provided on an \"as is\" and \"as available\" basis, without warranties of any kind, express or implied." },
      { label: "No guarantee of accuracy", detail: "We do not warrant that information displayed is accurate, complete, current, or error-free. We do not warrant that notifications or reminders will be delivered on time or at all." },
      { label: "Third-party services", detail: "The app depends on third-party services including Plaid, Supabase, OneSignal, Apple, and your bank. We are not responsible for their availability, accuracy, or actions." },
    ]},
    { title: "Limitation of Liability", items: [
      { label: "You use this app at your own risk", detail: "To the maximum extent permitted by law, Life Admin Inc. shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of the app." },
      { label: "No liability for financial loss", detail: "We are not responsible for any missed payments, late fees, overdraft charges, incorrect budgets, or any other financial loss resulting from your use of the app." },
      { label: "Cap on damages", detail: "Our aggregate liability for any claim shall not exceed the greater of (a) the amount you paid us in the twelve months preceding the claim, or (b) $100." },
    ]},
    { title: "AI & Automated Output", items: [
      { label: "AI can be wrong", detail: "Some classifications, suggestions, and insights are generated by machine-learning models. AI output can be incorrect, biased, outdated, or nonsensical. Always verify before relying on it." },
      { label: "Not a substitute for professionals", detail: "AI output is never a substitute for professional advice from a licensed CPA, CFP, attorney, or similar professional." },
    ]},
    { title: "Changes & Contact", items: [
      { label: "We may update this disclaimer", detail: "We may modify this disclaimer at any time. Material changes will be announced in the app or via email. Continued use after an update constitutes acceptance." },
      { label: "Governing law", detail: "This disclaimer is governed by the laws of the State of California. Disputes shall be resolved in the state or federal courts in San Francisco County, California." },
      { label: "Contact", detail: "Questions: support@lifeadminofficial.com" },
    ]},
  ];

  return (
    <div>
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white">
        ← Back to Profile
      </button>
      <h1 className="mb-1 text-2xl font-bold">Disclaimer</h1>
      <p className="mb-2 text-sm text-gray-400">Please read carefully</p>
      <div className="mb-6 rounded-xl border border-orange-500/30 bg-orange-500/5 px-4 py-3 text-sm leading-relaxed text-gray-300">
        Life Admin is a tracking tool, not financial advice. Imported bank data (especially merchant names) can be incorrect. Always verify against your bank before acting.
      </div>

      {sections.map((sec, si) => (
        <AccordionSection key={si} title={sec.title} items={sec.items} />
      ))}

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <p className="mb-1 text-sm font-bold text-gray-200">By continuing to use Life Admin, you acknowledge that you have read, understood, and agree to this disclaimer in its entirety.</p>
        <p className="text-xs text-gray-500">If you do not agree, you must discontinue use.</p>
      </div>
      <p className="mt-4 text-center text-xs text-gray-600">Life Admin Inc. · San Francisco, CA · Effective April 23, 2026</p>
    </div>
  );
}

function ContactPage({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const valid = form.name && form.email && form.message;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 800));
    setSending(false);
    setSent(true);
  }

  if (sent) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-500 bg-green-500/10">
        <Check size={28} className="text-green-400" />
      </div>
      <h2 className="mb-2 text-2xl font-bold">Message Sent!</h2>
      <p className="mb-6 text-gray-400">We&apos;ll reply within 24 hours at <strong className="text-white">{form.email}</strong>.</p>
      <button onClick={onBack} className="rounded-xl bg-brand-gradient px-8 py-3 font-semibold text-black hover:opacity-90">
        Back to Profile
      </button>
    </div>
  );

  return (
    <div>
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white">
        ← Back to Profile
      </button>
      <h1 className="mb-1 text-2xl font-bold">Contact Us</h1>
      <p className="mb-6 text-sm text-gray-400">We reply within 24 hours.</p>

      <form onSubmit={submit} className="space-y-4">
        {[
          { key: "name", label: "Full Name *", placeholder: "John Smith", type: "text" },
          { key: "email", label: "Email *", placeholder: "john@email.com", type: "email" },
          { key: "phone", label: "Phone (optional)", placeholder: "+1 (555) 000-0000", type: "tel" },
        ].map(f => (
          <div key={f.key}>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">{f.label}</label>
            <input
              type={f.type}
              value={(form as any)[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-brand"
            />
          </div>
        ))}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">How can we help? *</label>
          <textarea
            value={form.message}
            onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
            placeholder="Describe your issue or question…"
            rows={5}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-brand resize-y"
          />
        </div>
        <button
          type="submit"
          disabled={!valid || sending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient py-3 font-semibold text-black hover:opacity-90 disabled:opacity-40"
        >
          <Send size={15} />
          {sending ? "Sending…" : "Send Message"}
        </button>
      </form>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-sm text-gray-400">
          Also reach us at <span className="text-brand">support@lifeadminofficial.com</span>
        </p>
      </div>
    </div>
  );
}

// ── main profile page ─────────────────────────────────────────────────────────

type SubPage = "refer" | "privacy" | "disclaimer" | "contact" | "pin" | "mfa" | null;

// ── PIN components ────────────────────────────────────────────────────────────

function SecuritySection({ onPinSetup, onMfaSetup }: { onPinSetup: () => void; onMfaSetup: () => void }) {
  const [hasPin, setHasPin] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [hasMfa, setHasMfa] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [showMfaRemove, setShowMfaRemove] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(true);
  const supabase = createClient();

  async function loadMfa() {
    const { data } = await supabase.auth.mfa.listFactors();
    const verified = data?.totp?.find((f: any) => f.status === "verified");
    if (verified) {
      setHasMfa(true);
      setMfaFactorId(verified.id);
    } else {
      setHasMfa(false);
      setMfaFactorId(null);
    }
    setMfaLoading(false);
  }

  useEffect(() => {
    setHasPin(!!getPinHash());
    loadMfa();
  }, []);

  function removePin() {
    clearPin();
    setHasPin(false);
    setShowRemoveConfirm(false);
  }

  async function removeMfa() {
    if (!mfaFactorId) return;
    await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
    setShowMfaRemove(false);
    await loadMfa();
  }

  return (
    <Section title="Security">
      {/* App PIN row */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
            <Shield size={15} className="text-brand" />
          </div>
          <div>
            <p className="text-sm font-medium">App PIN</p>
            <p className="text-xs text-gray-500">
              {hasPin ? "PIN is enabled — required on every new session" : "Add a PIN lock after login"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!showRemoveConfirm && (
            <button
              onClick={onPinSetup}
              className="rounded-lg border border-brand/30 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/15"
            >
              {hasPin ? "Change PIN" : "Set PIN"}
            </button>
          )}
          {hasPin && !showRemoveConfirm && (
            <button
              onClick={() => setShowRemoveConfirm(true)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:bg-white/5"
            >
              Remove
            </button>
          )}
          {showRemoveConfirm && (
            <div className="flex items-center gap-2">
              <button onClick={removePin} className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10">Confirm</button>
              <button onClick={() => setShowRemoveConfirm(false)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-500 hover:bg-white/5">Cancel</button>
            </div>
          )}
        </div>
      </div>

      {/* Two-Factor Auth row */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
            <Lock size={15} className="text-brand" />
          </div>
          <div>
            <p className="text-sm font-medium">
              Two-factor authentication
              {hasMfa && <span className="ml-2 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">ON</span>}
            </p>
            <p className="text-xs text-gray-500">
              {mfaLoading ? "Loading..." : hasMfa
                ? "Authenticator app required at every login"
                : "Use an authenticator app for an extra layer of login security"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!mfaLoading && !showMfaRemove && (
            <button
              onClick={onMfaSetup}
              className="rounded-lg border border-brand/30 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/15"
            >
              {hasMfa ? "Manage" : "Set up"}
            </button>
          )}
          {hasMfa && !showMfaRemove && (
            <button
              onClick={() => setShowMfaRemove(true)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:bg-white/5"
            >
              Remove
            </button>
          )}
          {showMfaRemove && (
            <div className="flex items-center gap-2">
              <button onClick={removeMfa} className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10">Confirm</button>
              <button onClick={() => setShowMfaRemove(false)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-500 hover:bg-white/5">Cancel</button>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

function MfaSetupPage({ onBack }: { onBack: () => void }) {
  const supabase = createClient();
  const [step, setStep] = useState<"loading" | "scan" | "verify" | "done">("loading");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    async function start() {
      // Clean up any unverified factors first
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const unverified = factors?.totp?.filter((f: any) => f.status !== "verified") || [];
      for (const f of unverified) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (enrollError || !data) {
        setError(enrollError?.message || "Failed to start setup");
        return;
      }
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStep("scan");
    }
    start();
  }, []);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || code.length !== 6) return;
    setVerifying(true);
    setError(null);
    const { error: vErr } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });
    setVerifying(false);
    if (vErr) {
      setError(vErr.message);
      setCode("");
      return;
    }
    setStep("done");
  }

  return (
    <div>
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white">
        ← Back
      </button>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10">
            <Lock size={22} className="text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Two-factor authentication</h1>
            <p className="text-sm text-gray-500">Extra security on every login</p>
          </div>
        </div>

        {step === "loading" && (
          <p className="text-center py-12 text-gray-500">Setting up...</p>
        )}

        {step === "scan" && qrCode && (
          <>
            <div className="mb-6 space-y-3">
              <p className="text-sm text-gray-300">
                <span className="font-bold">Step 1:</span> Open an authenticator app (Google Authenticator, Authy, 1Password, etc.) and scan this QR code:
              </p>
              <div className="flex justify-center rounded-2xl bg-white p-6">
                <img src={qrCode} alt="2FA QR code" className="w-48 h-48" />
              </div>
              <p className="text-xs text-gray-500 text-center">
                Or enter this code manually:
              </p>
              <div className="rounded-lg bg-black/40 p-3 text-center font-mono text-sm tracking-wider text-gray-300 break-all">
                {secret}
              </div>
            </div>

            <form onSubmit={verify} className="space-y-3">
              <p className="text-sm text-gray-300">
                <span className="font-bold">Step 2:</span> Enter the 6-digit code your app shows:
              </p>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono outline-none focus:border-brand"
              />

              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={verifying || code.length !== 6}
                className="w-full rounded-lg bg-brand-gradient py-3 font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
              >
                {verifying ? "Verifying..." : "Enable two-factor auth"}
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="text-center py-6">
            <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand/15">
              <Check size={28} className="text-brand" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Two-factor enabled</h2>
            <p className="mb-6 text-sm text-gray-400">
              From now on, you&apos;ll need a code from your authenticator app every time you log in.
            </p>
            <button
              onClick={onBack}
              className="rounded-xl bg-brand-gradient px-8 py-3 font-semibold text-black hover:opacity-90"
            >
              Done
            </button>
          </div>
        )}

        {step === "loading" && error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function PinSetupPage({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<"enter" | "confirm" | "done">("enter");
  const [first, setFirst] = useState("");
  const [entered, setEntered] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const hasPin = !!getPinHash();

  const title = step === "enter" ? (hasPin ? "Enter new PIN" : "Set a PIN") : step === "confirm" ? "Confirm PIN" : "PIN set";
  const sub = step === "enter" ? "Choose a 4-digit PIN" : step === "confirm" ? "Enter it again to confirm" : "Your app is now PIN-protected";

  function press(digit: string) {
    if (entered.length >= 4 || shake) return;
    const next = entered + digit;
    setEntered(next);
    if (next.length === 4) {
      if (step === "enter") {
        setFirst(next);
        setEntered("");
        setStep("confirm");
      } else {
        if (next === first) {
          savePin(next);
          markSessionVerified();
          setStep("done");
        } else {
          setError("PINs don't match. Try again.");
          setShake(true);
          setTimeout(() => { setShake(false); setEntered(""); setError(""); }, 700);
        }
      }
    }
  }

  function backspace() {
    if (shake) return;
    setEntered(prev => prev.slice(0, -1));
  }

  const keys = ["1","2","3","4","5","6","7","8","9","","0","back"];

  return (
    <div>
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white">
        ← Back
      </button>

      <div className="flex flex-col items-center py-10">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
          <Shield size={26} className="text-brand" />
        </div>

        <p className="mb-1 text-xl font-bold">{title}</p>
        <p className="mb-10 text-sm text-gray-500">{sub}</p>

        {step === "done" ? (
          <div className="text-center">
            <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-brand/15">
              <Check size={28} className="text-brand" />
            </div>
            <p className="text-sm text-gray-400 mb-6">You&apos;ll be asked for your PIN each time you open a new session.</p>
            <button onClick={onBack} className="rounded-xl bg-brand-gradient px-8 py-3 font-semibold text-black hover:opacity-90">
              Done
            </button>
          </div>
        ) : (
          <>
            <div
              className="mb-8 flex gap-5"
              style={{ animation: shake ? "shake 0.5s ease-in-out" : "none" }}
            >
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className="h-4 w-4 rounded-full transition-all duration-150"
                  style={{
                    background: i < entered.length ? "#3EA758" : "rgba(255,255,255,0.1)",
                    transform: i < entered.length ? "scale(1.2)" : "scale(1)",
                  }}
                />
              ))}
            </div>

            {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

            <div className="grid grid-cols-3 gap-3" style={{ width: 264 }}>
              {keys.map((k, i) =>
                k === "" ? <div key={i} /> : (
                  <button
                    key={i}
                    onClick={() => k === "back" ? backspace() : press(k)}
                    className="flex h-[72px] w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl font-semibold transition hover:bg-white/10 active:scale-95"
                  >
                    {k === "back" ? <Delete size={22} className="text-gray-400" /> : k}
                  </button>
                )
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subPage, setSubPage] = useState<SubPage>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [income, setIncome] = useState("");
  const [accountCode, setAccountCode] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [bgEnabled, setBgEnabled] = useState(true);
  const [editField, setEditField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("bg_enabled");
      if (stored !== null) setBgEnabled(stored === "true");
    } catch {}

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      setEmail(user.email || "");

      const { data } = await supabase.from("profiles").select("full_name, phone, monthly_income, account_code, is_pro").eq("id", user.id).single();
      if (data) {
        setName(data.full_name || "");
        setPhone(data.phone || "");
        setIncome(data.monthly_income ? String(data.monthly_income) : "");
        setAccountCode(data.account_code || "");
        if (data.is_pro) setIsPro(true);
      }
      setLoading(false);
    }
    load();
  }, []);

  function toggleBg() {
    const next = !bgEnabled;
    setBgEnabled(next);
    try { localStorage.setItem("bg_enabled", String(next)); } catch {}
    window.dispatchEvent(new CustomEvent("bg_change", { detail: next }));
  }

  async function saveProfile() {
    setSaving(true);
    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: name,
      phone: phone,
      monthly_income: parseFloat(income) || 0,
    });
    setSaving(false);
    setSaved(true);
    setEditField(null);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="text-gray-500">Loading...</div></div>;


  if (subPage === "pin") return <div className="mx-auto max-w-2xl px-4 py-10"><PinSetupPage onBack={() => setSubPage(null)} /></div>;
  if (subPage === "mfa") return <div className="mx-auto max-w-2xl px-4 py-10"><MfaSetupPage onBack={() => setSubPage(null)} /></div>;
  if (subPage === "refer") return <div className="mx-auto max-w-2xl px-4 py-10"><ReferPage onBack={() => setSubPage(null)} /></div>;
  if (subPage === "privacy") return <div className="mx-auto max-w-2xl px-4 py-10"><PrivacyPage onBack={() => setSubPage(null)} /></div>;
  if (subPage === "disclaimer") return <div className="mx-auto max-w-2xl px-4 py-10"><DisclaimerPage onBack={() => setSubPage(null)} /></div>;
  if (subPage === "contact") return <div className="mx-auto max-w-2xl px-4 py-10"><ContactPage onBack={() => setSubPage(null)} /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">

      {/* Avatar + name */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative">
          {isPro && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#F5C518"><path d="M2 19h20v2H2v-2zM2 6l5 7 5-7 5 7 5-7v11H2V6z"/></svg>
            </div>
          )}
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-black"
            style={isPro ? {
              background: "linear-gradient(135deg, #F5C518, #f0a500)",
              boxShadow: "0 0 20px #F5C51850",
            } : { background: "linear-gradient(135deg, #3EA758, #2ecc71)" }}
          >
            {name ? name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold" style={isPro ? { color: "#F5C518" } : {}}>{name || email.split("@")[0]}</h1>
            {isPro && (
              <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-black uppercase tracking-wider text-yellow-400">Pro</span>
            )}
          </div>
          <p className="text-sm text-gray-400">{email}</p>
        </div>
      </div>

      {/* Account number */}
      {accountCode && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 border border-brand/20">
              <Hash size={15} className="text-brand" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Account Number</p>
              <p className="font-mono text-sm font-bold tracking-widest">{accountCode}</p>
            </div>
          </div>
          <AccountCopyButton value={accountCode} />
        </div>
      )}

      {/* Profile info */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand">Your Info</p>
        <div className="space-y-4">
          {[
            { key: "name", label: "Full Name", value: name, setter: setName, type: "text", placeholder: "Your name" },
            { key: "email", label: "Email", value: email, setter: setEmail, type: "email", placeholder: "your@email.com" },
            { key: "phone", label: "Phone", value: phone, setter: setPhone, type: "tel", placeholder: "+1 (555) 000-0000" },
            { key: "income", label: "Monthly Income", value: income, setter: setIncome, type: "number", placeholder: "0" },
          ].map(f => (
            <div key={f.key}>
              <label className="mb-1 block text-xs text-gray-500">{f.label}</label>
              {editField === f.key ? (
                <input
                  autoFocus
                  type={f.type}
                  value={f.value}
                  onChange={e => f.setter(e.target.value)}
                  onBlur={() => setEditField(null)}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border border-brand bg-black/30 px-3 py-2 text-sm outline-none"
                />
              ) : (
                <button
                  onClick={() => setEditField(f.key)}
                  className="flex w-full items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-left hover:border-white/10"
                >
                  <span className={`text-sm ${f.value ? "text-white" : "text-gray-600"}`}>
                    {f.value || f.placeholder}
                  </span>
                  <span className="text-xs text-brand">edit</span>
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={saveProfile}
          disabled={saving}
          className="mt-5 w-full rounded-xl bg-brand-gradient py-2.5 font-semibold text-black hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : saved ? "Saved" : "Save Changes"}
        </button>
      </div>

      {/* Appearance */}
      <Section title="Appearance">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
              <Sparkles size={15} className="text-brand" />
            </div>
            <div>
              <p className="text-sm font-medium">Animated Background</p>
              <p className="text-xs text-gray-500">Moving orbs and particles on all pages</p>
            </div>
          </div>
          <button
            onClick={toggleBg}
            className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${bgEnabled ? "bg-brand" : "bg-white/10"}`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${bgEnabled ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </div>
      </Section>

      <div className="my-4" />

      {/* Quick links */}
      <Section title="Account">
        <Row label="Refer & Earn" value="Free months" onClick={() => setSubPage("refer")} />
        <Row label="Go to Dashboard" onClick={() => router.push("/dashboard")} last />
      </Section>

      <div className="my-4" />

      <SecuritySection
        onPinSetup={() => setSubPage("pin")}
        onMfaSetup={() => setSubPage("mfa")}
      />

      <div className="my-4" />

      <Section title="Legal">
        <Row label="Privacy & Terms" onClick={() => setSubPage("privacy")} />
        <Row label="How We Make Money" onClick={() => router.push("/transparency")} />
        <Row label="Disclaimer" onClick={() => setSubPage("disclaimer")} last />
      </Section>

      <div className="my-4" />

      <Section title="Support">
        <Row label="Contact Support" onClick={() => setSubPage("contact")} last />
      </Section>

      <div className="my-6" />

      <button
        onClick={handleLogout}
        className="w-full rounded-xl border border-red-500/20 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10"
      >
        Log out
      </button>

      <p className="mt-6 text-center text-xs text-gray-600">Life Admin Inc. · San Francisco, CA</p>
    </div>
  );
}
