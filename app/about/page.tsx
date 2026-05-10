import Link from "next/link";
import { Building2, Target, Heart, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">

      {/* Hero */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold md:text-5xl">
          About <span className="gradient-text">Life Admin</span>
        </h1>
        <p className="mt-4 text-lg text-gray-400 max-w-xl mx-auto">
          A finance app built for everyday people who want to actually know
          where their money is going.
        </p>
      </div>

      {/* The story */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
              <Heart size={18} className="text-brand" />
            </div>
            <h2 className="text-xl font-bold">Why we built it</h2>
          </div>
          <p className="text-gray-400 leading-relaxed">
            Most finance apps are built to sell your data, push you into
            credit cards you don&apos;t need, or hide everything behind a
            paywall. Life Admin is different. We built it because we got
            tired of paying for subscriptions we forgot about, missing
            bills, and never really knowing what was happening with our
            money. The app does one thing well — it shows you exactly where
            every dollar is going, so you can make smarter decisions.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
              <Target size={18} className="text-brand" />
            </div>
            <h2 className="text-xl font-bold">What we believe</h2>
          </div>
          <ul className="space-y-3 text-gray-400">
            <li className="flex gap-3">
              <span className="text-brand font-bold shrink-0">·</span>
              <span><strong className="text-white">Your data is yours.</strong> We never sell it, share it with brokers, or use it to target ads.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-brand font-bold shrink-0">·</span>
              <span><strong className="text-white">Free should mean free.</strong> The free tier is a fully functional finance tracker, not a crippled demo.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-brand font-bold shrink-0">·</span>
              <span><strong className="text-white">Money knowledge is power.</strong> Most people lose hundreds a year on stuff they could easily fix if they knew about it.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-brand font-bold shrink-0">·</span>
              <span><strong className="text-white">Privacy is non-negotiable.</strong> Bank connections are read-only. We can&apos;t move your money even if we wanted to.</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
              <Building2 size={18} className="text-brand" />
            </div>
            <h2 className="text-xl font-bold">The company</h2>
          </div>
          <p className="text-gray-400 leading-relaxed mb-4">
            Life Admin is built and operated by <strong className="text-white">ZZW LLC</strong>, an
            independent software company. We&apos;re focused on building one thing — a
            personal finance tracker that respects your data and actually helps you
            keep more of your money.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Our infrastructure: Plaid (the same secure bank-connection layer used
            by Venmo, Robinhood, and Coinbase), Supabase for encrypted data
            storage, and Apple/RevenueCat for iOS payments. The technology is
            industry-standard. The mission is to use it to actually help people.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-12 rounded-2xl border border-brand/20 bg-brand/5 p-8 text-center">
        <h3 className="text-2xl font-bold mb-2">Ready to see where your money goes?</h3>
        <p className="text-gray-400 mb-6">Free forever. No credit card. No data selling.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-8 py-3.5 font-semibold text-black hover:opacity-90"
          >
            Start free <ArrowRight size={16} />
          </Link>
          <Link
            href="/transparency"
            className="rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 font-semibold hover:bg-white/10"
          >
            How we make money
          </Link>
        </div>
      </div>
    </div>
  );
}
