import Link from "next/link";
import {
  ShieldCheck, Ban, CreditCard, Eye, EyeOff, Lock,
  ArrowRight, CheckCircle2, XCircle,
} from "lucide-react";

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8 ${className}`}>
      {children}
    </div>
  );
}

function Check({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-brand" />
      <span className="text-gray-300">{text}</span>
    </li>
  );
}

function No({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <XCircle size={17} className="mt-0.5 shrink-0 text-red-400" />
      <span className="text-gray-300">{text}</span>
    </li>
  );
}

export default function TransparencyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">

      {/* Header */}
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-2 text-xs font-semibold text-brand">
          No fine print
        </div>
        <h1 className="text-4xl font-bold md:text-5xl">How we make money</h1>
        <p className="mt-4 text-lg text-gray-400 max-w-xl mx-auto">
          Most finance apps make money by selling your data to advertisers and data brokers.
          We don&apos;t. Here&apos;s exactly how Life Admin works.
        </p>
      </div>

      <div className="space-y-6">

        {/* The one thing */}
        <Section>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
              <CreditCard size={18} className="text-brand" />
            </div>
            <h2 className="text-xl font-bold">Two revenue sources. Both disclosed.</h2>
          </div>
          <p className="text-gray-400 mb-5">
            Life Admin has two revenue sources. First, display ads shown to free users  -  standard
            Google AdSense ads, the same kind you see on any website. Second, Pro subscriptions
            for users who want bank automation and an ad-free experience. That&apos;s it.
            No data selling. No hidden fees. No tricks.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs text-gray-500 mb-1">Free tier</p>
              <p className="text-lg font-black text-white">Display ads</p>
              <p className="text-xs text-gray-500 mt-1">Standard Google AdSense</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs text-gray-500 mb-1">Monthly Pro</p>
              <p className="text-2xl font-black text-brand">$6.99</p>
              <p className="text-xs text-gray-500 mt-1">No ads · cancel anytime</p>
            </div>
            <div className="rounded-xl border border-brand/20 bg-brand/5 p-4">
              <p className="text-xs text-gray-500 mb-1">Annual Pro</p>
              <p className="text-2xl font-black text-brand">$49.99</p>
              <p className="text-xs text-brand mt-1">No ads · save $33.89/yr</p>
            </div>
          </div>
        </Section>

        {/* What we never do */}
        <Section>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <Ban size={18} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold">What we will never do</h2>
          </div>
          <ul className="space-y-3">
            <No text="Sell your financial data to advertisers, data brokers, or third parties" />
            <No text="Share your bank transactions with anyone outside Life Admin's infrastructure" />
            <No text="Use your financial data or spending patterns to target ads at you" />
            <No text="Charge hidden fees or auto-enroll you in paid features" />
            <No text="Move money from your accounts  -  our Plaid connection is read-only, always" />
          </ul>
          <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm text-gray-400">
            <strong className="text-white">Why does this matter?</strong> Rocket Money, Mint (now shut down),
            and similar apps monetize your data through partnerships, targeted advertising, and selling
            anonymized (or not-so-anonymized) financial profiles to companies who want to market to you.
            When the product is free, you are the product. Life Admin is different by design.
          </div>
        </Section>

        {/* How your data is protected */}
        <Section>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Lock size={18} className="text-blue-400" />
            </div>
            <h2 className="text-xl font-bold">How your data is protected</h2>
          </div>
          <ul className="space-y-3">
            <Check text="Bank connections use Plaid  -  the same infrastructure used by Venmo, Robinhood, and Coinbase" />
            <Check text="Plaid access is read-only. We can see your transactions. We cannot initiate transfers, payments, or withdrawals" />
            <Check text="Your bank credentials never touch our servers  -  Plaid handles authentication directly" />
            <Check text="All data in transit is encrypted with TLS 1.2+. Data at rest is encrypted in Supabase" />
            <Check text="You can delete your account and all associated data at any time from your profile settings" />
            <Check text="We comply with applicable data protection regulations" />
          </ul>
        </Section>

        {/* Free vs Pro */}
        <Section>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
              <Eye size={18} className="text-purple-400" />
            </div>
            <h2 className="text-xl font-bold">Free vs Pro  -  what actually changes</h2>
          </div>
          <p className="text-gray-400 mb-5">
            The free tier is not a crippled demo. It&apos;s a fully functional finance tracker.
            Pro adds automation  -  it replaces manual entry with automatic bank data.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-sm font-bold text-gray-400 mb-3">Free forever</p>
              <ul className="space-y-2 text-sm text-gray-300">
                {[
                  "Track subscriptions manually",
                  "Bill calendar with reminders",
                  "Budget planner",
                  "Net worth tracker",
                  "Household sharing",
                  "Expense tracking",
                  "Push notifications",
                  "All financial tools",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-brand shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-brand/20 bg-brand/5 p-4">
              <p className="text-sm font-bold text-brand mb-3">Pro  -  adds automation</p>
              <ul className="space-y-2 text-sm text-gray-300">
                {[
                  "No ads",
                  "Auto-detect all subscriptions from bank",
                  "AI categorizes every transaction",
                  "Income auto-detected from deposits",
                  "Recurring charge detection",
                  "Transaction history (550+ days)",
                  "AI receipt scanning",
                  "One-tap sync across all accounts",
                  "Everything above, automatically",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-brand shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* Who built this */}
        <Section>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
              <ShieldCheck size={18} className="text-brand" />
            </div>
            <h2 className="text-xl font-bold">Who built this</h2>
          </div>
          <p className="text-gray-400">
            Life Admin is built and operated by ZZW LLC. We&apos;re a focused team building one
            thing  -  a finance tracker that respects your data. We use industry-standard
            infrastructure (Plaid for bank connections, Supabase for secure data storage,
            Apple for iOS payments) and we don&apos;t share your information with marketing
            partners or data brokers. Our revenue comes from two sources: display ads shown
            to free users (standard Google AdSense, not tied to your financial data) and Pro
            subscriptions that remove ads and unlock bank automation.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <Link href="/privacy" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">
              <EyeOff size={14} /> Read our Privacy Policy
            </Link>
            <Link href="/terms" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">
              Read our Terms of Use
            </Link>
          </div>
        </Section>

        {/* CTA */}
        <div className="rounded-2xl border border-brand/20 bg-brand/5 p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Ready to try it?</h3>
          <p className="text-gray-400 mb-6">
            Free forever. No credit card. No data selling. Just a finance tracker that works for you.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-8 py-4 font-semibold text-black hover:opacity-90"
          >
            Start free <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </div>
  );
}
