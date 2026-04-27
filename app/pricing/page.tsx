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

        <div className="mb-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand/10 px-6 py-3 text-sm">
          🎉 <strong className="gradient-text">Launch Special:</strong>
          <span>Save 50% on yearly — $49.99 (normally $99.99)</span>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Plan
            name="Free"
            price="$0"
            period="forever"
            features={[
              "Connect 1 bank account",
              "See up to 5 subscriptions",
              "Basic bill reminders",
              "Cancel via support tickets",
            ]}
            cta="Start free"
            href="/signup"
          />
          <Plan
            name="Monthly"
            price="$10"
            period="/month"
            features={[
              "Unlimited bank accounts",
              "All subscriptions tracked",
              "One-tap cancellation",
              "Smart bill reminders",
              "Spending insights",
              "Priority support",
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
              "Save $5",
              "30-day money back",
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
              "Save $70 vs monthly",
              "60-day money back",
              "Web exclusive features",
              "Net worth tracker",
              "Monthly PDF reports",
            ]}
            cta="Get yearly deal"
            href="/signup?plan=yearly"
          />
        </div>

        <div className="mt-16 rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <h2 className="text-2xl font-bold">Money back guarantee</h2>
          <p className="mt-2 text-gray-400">
            Try Life Admin risk-free. If we don&apos;t find at least one subscription you forgot about, we&apos;ll refund you.
          </p>
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
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-gradient px-3 py-1 text-xs font-bold text-black">
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
