import type { Metadata } from "next";
import Link from "next/link";
import { existsSync } from "fs";
import path from "path";
import { GraduationCap, Shield, Heart, DollarSign } from "lucide-react";

export const metadata: Metadata = {
  title: "About Zack, Founder of Life Admin Finance Tracker",
  description:
    "Why I built Life Admin Finance Tracker — from growing up broke in Los Angeles to building a free finance app that helps people keep more of what they earn.",
  keywords: [
    "Life Admin founder",
    "Zachary Winter",
    "about Life Admin",
    "why Life Admin is free",
    "free finance tracker founder",
  ],
  openGraph: {
    title: "About Zack, Founder of Life Admin Finance Tracker",
    description:
      "Army veteran. Two associate degrees. Built a free finance tracker because nobody should pay a subscription to see their own money.",
    url: "https://lifeadminofficial.com/about",
    siteName: "Life Admin",
  },
  alternates: {
    canonical: "https://lifeadminofficial.com/about",
  },
};

export default function AboutPage() {
  // Check at render time whether the founder photo is actually on disk.
  // If not, we fall back to a tasteful initials placeholder so the page doesn't ship broken.
  const photoExists = existsSync(path.join(process.cwd(), "public", "zack-founder.jpg"));

  return (
    <div className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-5xl">
        {/* HERO */}
        <div className="mb-16 grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand">
              Founder Story
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              I built this because I wished it{" "}
              <span className="gradient-text">existed when I was broke.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-400">
              Hi, I&apos;m Zack, Army veteran, founder of Life Admin Finance Tracker,
              and the reason the core app is free.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              <Pill icon={<Shield size={12} />} label="Army Veteran" color="#3EA758" />
              <Pill icon={<GraduationCap size={12} />} label="2× Associate Degrees" color="#5E8EFF" />
              <Pill icon={<Heart size={12} />} label="Built in Los Angeles" color="#FF6B35" />
              <Pill icon={<DollarSign size={12} />} label="Free Forever Core" color="#F5C518" />
            </div>
          </div>

          {/* Photo */}
          <div className="relative mx-auto w-full max-w-sm">
            <div
              className="absolute -inset-3 rounded-3xl opacity-40 blur-2xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(94,142,255,0.35), rgba(175,82,222,0.25), rgba(62,167,88,0.3))",
              }}
            />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] shadow-2xl">
              {photoExists ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/zack-founder.jpg"
                  alt="Zachary Winter, founder of Life Admin Finance Tracker"
                  className="aspect-[3/4] w-full object-cover"
                />
              ) : (
                <div
                  className="flex aspect-[3/4] w-full items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #1a2440 0%, #0d1828 55%, #1a1230 100%)",
                  }}
                >
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur">
                    <span className="font-mono text-5xl font-black tracking-tight text-white/80">
                      ZW
                    </span>
                  </div>
                </div>
              )}
              <div className="border-t border-white/5 px-4 py-3">
                <p className="text-sm font-semibold text-white">Zachary Winter</p>
                <p className="text-xs text-gray-500">
                  Founder &amp; Creator, Life Admin Finance Tracker
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* STORY */}
        <article className="mx-auto max-w-2xl space-y-6 text-[17px] leading-[1.75] text-gray-300">
          <p>
            My name is Zachary Winter. I&apos;m an Army veteran with two associate
            degrees: one in professional accounting, one in business administration.
            I&apos;m the founder and creator of Life Admin Finance Tracker.
          </p>

          <p>
            I grew up in Los Angeles without a lot of money. My mom raised me — she was
            a cancer survivor and she was sick a lot. I never knew my biological father,
            but I had a stepdad who stepped up and helped raise me. Money was tight, and
            when it wasn&apos;t tight, I had no idea where it was going.
          </p>

          <p>
            I tried to track it. I&apos;d jot things down in notes and lose the notes.
            I&apos;d open a spreadsheet and have no idea what I was doing. Subscriptions
            I forgot about kept charging me month after month. Money I thought I had was
            already gone. I was the kind of person who&apos;d open my bank app, see the
            number, and just hope it added up.
          </p>

          <PullQuote>Money I thought I had was already gone.</PullQuote>

          <p>
            It clicked when my wife sat me down and explained what a budget actually
            was. Not the word — the <em>thing</em>. Where money comes in. Where it goes
            out. What&apos;s left over. Nobody had ever broken it down for me before.
            The second I understood it, I felt stupid for not understanding it sooner —
            and angry that nobody had ever bothered to show me.
          </p>

          <p>That&apos;s when I decided to build Life Admin Finance Tracker.</p>

          <p>
            Every app I looked at wanted my money to teach me how to manage my money.
            Rocket Money. Copilot. The big ones charging $60 to $120 a year — five to
            ten bucks a month — just to show me my own transactions. Growing up broke,
            I would have killed for something that just <em>worked</em> and didn&apos;t
            cost me anything to use.
          </p>

          <p>
            So Life Admin Finance Tracker is free. The whole core app — track income,
            track expenses, log subscriptions, build a budget, see where your money is
            actually going. Completely free. You can pay if you want bank sync and the
            AI features, but you will never <em>have</em> to pay just to track your own
            money.
          </p>

          <PullQuote>
            You will never <em>have</em> to pay just to track your own money.
          </PullQuote>

          <p>
            Here&apos;s what I believe: even when you&apos;re broke, you should track
            your money. <em>Especially</em> when you&apos;re broke. If you don&apos;t
            know where it&apos;s going, you don&apos;t actually know what you have.
          </p>

          <p>
            I want Life Admin Finance Tracker to help people get smarter with their
            money. I want it to help people get stable. I want people to keep more of
            what they earn instead of handing it to big corporations that don&apos;t
            deserve it.
          </p>

          <p className="text-xl font-semibold text-white">
            You earned that money. You should keep it.
          </p>

          <p className="pt-2 font-mono text-sm text-gray-500">Zack</p>
        </article>

        {/* MISSION BOX */}
        <div className="mx-auto mt-16 max-w-3xl rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-8 md:p-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand">
            The Mission
          </p>
          <h2 className="text-2xl font-bold leading-snug md:text-3xl">
            Nobody should get blindsided by a charge they forgot about — and nobody
            should have to{" "}
            <span className="gradient-text">pay a subscription to see their own money.</span>
          </h2>
        </div>

        {/* CTAs */}
        <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="rounded-xl bg-brand-gradient px-7 py-3.5 text-sm font-bold text-black transition hover:opacity-90"
          >
            Try Life Admin Finance Tracker — Free
          </Link>
          <Link
            href="/pricing"
            className="rounded-xl border border-white/15 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-gray-200 transition hover:bg-white/10"
          >
            See Pricing
          </Link>
          <a
            href="https://apps.apple.com/app/id6762589970"
            className="rounded-xl border border-white/15 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-gray-200 transition hover:bg-white/10"
          >
            Download on App Store
          </a>
        </div>

        {/* Company info — small, at the bottom */}
        <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-white/5 bg-white/[0.015] p-6 text-sm text-gray-500">
          <p className="mb-2">
            <span className="font-semibold text-gray-300">The company.</span> Life Admin
            Finance Tracker is built and operated by{" "}
            <span className="text-gray-300">ZZW LLC</span>, an independent software
            company.
          </p>
          <p>
            <span className="font-semibold text-gray-300">The stack.</span> Plaid for
            secure read-only bank connections (the same layer used by Venmo, Robinhood,
            and Coinbase), Supabase for encrypted storage, and Apple / RevenueCat for
            iOS payments. Read more on{" "}
            <Link href="/transparency" className="text-gray-300 underline hover:text-white">
              How we make money
            </Link>{" "}
            or reach out via{" "}
            <Link href="/contact" className="text-gray-300 underline hover:text-white">
              Contact
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function Pill({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
      style={{
        background: `${color}14`,
        borderColor: `${color}40`,
        color,
      }}
    >
      {icon}
      {label}
    </span>
  );
}

function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="my-2 border-l-2 border-brand/60 bg-white/[0.02] py-3 pl-5 pr-3 text-lg font-semibold italic text-white">
      &ldquo;{children}&rdquo;
    </blockquote>
  );
}
