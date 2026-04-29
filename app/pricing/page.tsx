import Link from "next/link";
import { Check } from "lucide-react";

export default function Pricing() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h1 className="text-5xl font-bold md:text-6xl">
            Simple, <span className="gradient-text">honest</span> pricing.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            Start free. Upgrade when you want more. Cancel any time. No tricks.
          </p>
        </div>

        <div className="mb-8 flex w-full items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-6 py-3 text-sm">
            <span className="gradient-text font-bold">Launch Special:</span>
            <span>Save 50% on yearly — $49.99 (normally $99.99)</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Plan
            name="Free"
            price="$0"
            period="forever"
            features={[
              "Track manually — unlimited entries",
              "Subscriptions, bills, trials, expenses",
              "Net worth tracker",
              "Bill calendar",
              "Push reminders before due dates",
            ]}
            cta="Start free"
            href="/signup"
          />
          <Plan
            name="Monthly"
            price="$10"
            period="/month"
            features={[
              "Everything in Free",
              "Connect unlimited banks via Plaid",
              "Auto-detect every recurring charge",
              "AI organize subs, bills, gas, expenses",
              "Income tracking from deposits",
              "Receipt scanning with AI Vision",
              "One-tap cancellation",
            ]}
            cta="Start monthly"
            href="/signup?plan=monthly"
          />
          <Plan
            name="3 Months"
            price="$24.99"
            period="/3 months"
            features={[
              "Everything in Monthly",
              "Save $5 vs paying monthly",
              "30-day money-back guarantee",
            ]}
            cta="Start 3 months"
            href="/signup?plan=3months"
          />
          <Plan
            name="Yearly"
            price="$49.99"
            period="/year"
            highlight
            originalPrice="$99.99"
            badge="50% OFF · LAUNCH"
            features={[
              "Everything in Monthly",
              "Save $70 vs paying monthly",
              "60-day money-back guarantee",
              "Web exclusive features",
              "Monthly PDF reports",
              "Priority support",
            ]}
            cta="Get yearly deal"
            href="/signup?plan=yearly"
          />
        </div>

        <div className="mt-16 rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <h2 className="text-2xl font-bold">Money-back guarantee</h2>
          <p className="mt-2 text-gray-400">
            Try Life Admin risk-free. If we don&apos;t find at least one subscription you forgot about, we&apos;ll refund you in full.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Note title="No hidden upcharges" body="The price you see is the price you pay. No paywall mid-feature. No surprise tier. Cancel inside the app any time." />
          <Note title="Cancel any time" body="Manage your subscription from your Apple ID or Life Admin profile. Two taps, you're out. We don't try to stop you." />
          <Note title="Same plan everywhere" body="Pay once, use the iOS app and the web app with the same account. Both stay in sync automatically." />
        </div>
      </div>
    </div>
  );
}

function Plan({
  name,
  price,
  period,
  features,
  cta,
  href,
  highlight,
  originalPrice,
  badge,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  href: string;
  highlight?: boolean;
  originalPrice?: string;
  badge?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-6 ${
        highlight
          ? "border-brand bg-brand/5"
          : "border-white/10 bg-white/[0.02]"
      }`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-gradient px-3 py-1 text-xs font-bold text-black">
          {badge}
        </div>
      )}
      <h3 className="text-lg font-semibold">{name}</h3>
      <div className="mt-4 flex items-end gap-1">
        <span className="text-4xl font-bold">{price}</span>
        <span className="mb-1 text-sm text-gray-400">{period}</span>
      </div>
      {originalPrice && (
        <div className="mt-1 text-sm text-gray-500 line-through">
          {originalPrice}
        </div>
      )}
      <ul className="mt-6 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check size={16} className="mt-0.5 flex-shrink-0 text-brand" />
            <span className="text-gray-300">{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`mt-8 block rounded-lg py-3 text-center font-semibold transition ${
          highlight
            ? "bg-brand-gradient text-black hover:opacity-90"
            : "border border-white/10 hover:bg-white/5"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

function Note({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <h3 className="font-bold">{title}</h3>
      <p className="mt-2 text-sm text-gray-400">{body}</p>
    </div>
  );
}
