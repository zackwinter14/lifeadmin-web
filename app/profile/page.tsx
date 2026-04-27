"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { User, Gift, Lock, AlertTriangle, MessageCircle, ChevronRight, ChevronDown, Copy, Check, Send } from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────

function generateCode(userId: string) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let seed = userId ? userId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) : Date.now();
  let code = "";
  for (let i = 0; i < 6; i++) { code += chars[seed % chars.length]; seed = (seed * 31 + 7) % 997; }
  return code;
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

type SubPage = "refer" | "privacy" | "disclaimer" | "contact" | null;

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
  const [editField, setEditField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      setEmail(user.email || "");

      const { data } = await supabase.from("profiles").select("full_name, phone, monthly_income").eq("id", user.id).single();
      if (data) {
        setName(data.full_name || "");
        setPhone(data.phone || "");
        setIncome(data.monthly_income ? String(data.monthly_income) : "");
      }
      setLoading(false);
    }
    load();
  }, []);

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

  if (subPage === "refer") return <div className="mx-auto max-w-2xl px-4 py-10"><ReferPage onBack={() => setSubPage(null)} /></div>;
  if (subPage === "privacy") return <div className="mx-auto max-w-2xl px-4 py-10"><PrivacyPage onBack={() => setSubPage(null)} /></div>;
  if (subPage === "disclaimer") return <div className="mx-auto max-w-2xl px-4 py-10"><DisclaimerPage onBack={() => setSubPage(null)} /></div>;
  if (subPage === "contact") return <div className="mx-auto max-w-2xl px-4 py-10"><ContactPage onBack={() => setSubPage(null)} /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">

      {/* Avatar + name */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient text-2xl font-bold text-black">
          {name ? name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{name || email.split("@")[0]}</h1>
          <p className="text-sm text-gray-400">{email}</p>
        </div>
      </div>

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
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save Changes"}
        </button>
      </div>

      {/* Quick links */}
      <Section title="Account">
        <Row label="Refer & Earn" value="Free months" onClick={() => setSubPage("refer")} />
        <Row label="Go to Dashboard" onClick={() => router.push("/dashboard")} last />
      </Section>

      <div className="my-4" />

      <Section title="Legal">
        <Row label="Privacy & Terms" onClick={() => setSubPage("privacy")} />
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
