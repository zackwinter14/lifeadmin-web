"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, Zap, TrendingDown, Bell, Lock } from "lucide-react";
import { useEffect, useState } from "react";

function CountUp({ end, duration = 2000, prefix = "", suffix = "" }: { end: number; duration?: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(end * progress));
      if (progress < 1) requestAnimationFrame(tick);
    };
    tick();
  }, [end, duration]);
  return (
    <span>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20 md:pt-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(62,167,88,0.15),transparent_50%)]" />
        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand"></span>
            <span className="text-gray-300">Live on the App Store · 4.8★ rating</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl font-bold leading-tight tracking-tight md:text-7xl"
          >
            Know exactly where <br />
            every dollar <span className="gradient-text">goes</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 md:text-xl"
          >
            Life Admin is free to use. Manually track every subscription, bill, trial,
            and expense in one place. Want it done automatically?{" "}
            <span className="font-semibold text-white">Upgrade to connect your bank.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 md:flex-row"
          >
            <Link
              href="/signup"
              className="rounded-xl bg-brand-gradient px-8 py-4 font-semibold text-black transition hover:opacity-90"
            >
              Start saving free →
            </Link>
            <a
              href="https://apps.apple.com/app/id6762589970"
              className="rounded-xl border border-white/10 bg-white/5 px-8 py-4 font-semibold transition hover:bg-white/10"
            >
              Download iOS App
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 flex justify-center gap-12 text-center"
          >
            <div>
              <div className="text-4xl font-bold gradient-text">Free</div>
              <div className="text-sm text-gray-500">forever, no credit card</div>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text">
                <CountUp end={4} />
              </div>
              <div className="text-sm text-gray-500">item types tracked</div>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text">
                <CountUp end={1} />
              </div>
              <div className="text-sm text-gray-500">account, app + web</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold md:text-5xl">
              Everything you need to <span className="gradient-text">take back control</span>
            </h2>
            <p className="mt-4 text-gray-400">
              Built for people tired of $9.99 charges from apps they don&apos;t remember.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Feature
              icon={<Zap className="text-brand" />}
              title="Free manual tracking"
              body="Add every subscription, bill, trial, and expense yourself. No bank connection needed. Always free."
            />
            <Feature
              icon={<TrendingDown className="text-brand" />}
              title="One dashboard"
              body="See your full spending breakdown in a donut chart — subscriptions, bills, trials, and expenses all in one view."
            />
            <Feature
              icon={<Bell className="text-brand" />}
              title="Bill reminders"
              body="Never get hit with a surprise charge again. We notify you before any bill hits, so you can pause or cancel in time."
            />
            <Feature
              icon={<ShieldCheck className="text-brand" />}
              title="App + web, in sync"
              body="Your account works on iOS and the web. Add something in the app and it shows up on the website instantly."
            />
            <Feature
              icon={<TrendingDown className="text-brand" />}
              title="Auto-import with Plaid"
              body="Upgrade to Pro and connect your bank. We find every recurring charge automatically — no manual entry needed."
            />
            <Feature
              icon={<Lock className="text-brand" />}
              title="Privacy first"
              body="We don't sell your data. Ever. We make money one way: from people who choose to upgrade. That's it."
            />
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t border-white/5 bg-gradient-to-b from-transparent to-brand/5 px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold md:text-5xl">
            We&apos;re cheaper. <br />
            And we don&apos;t hide a paywall.
          </h2>
          <p className="mt-4 text-gray-400">
            Compare us to the others.
          </p>

          <div className="mt-12 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-sm">
                <tr>
                  <th className="p-4"></th>
                  <th className="p-4">
                    <span className="gradient-text font-bold">Life Admin</span>
                  </th>
                  <th className="p-4 text-gray-400">Rocket Money</th>
                  <th className="p-4 text-gray-400">Bobby</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <Row label="Free tier" us="✓" them1="Limited" them2="✓" />
                <Row label="Auto-cancel subs" us="✓" them1="✓" them2="✗" />
                <Row label="Bill reminders" us="✓" them1="✓" them2="✗" />
                <Row label="Monthly cost" us="$10" them1="$12" them2="$3" />
                <Row label="Yearly special" us="$49.99" them1="$72" them2="$36" />
                <Row label="No data selling" us="✓" them1="✗" them2="✓" />
                <Row label="iOS + Web" us="✓" them1="✓" them2="iOS only" />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold md:text-5xl">
            Find out how much you&apos;re losing.
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Takes 90 seconds. Free forever.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-xl bg-brand-gradient px-10 py-5 text-lg font-semibold text-black transition hover:opacity-90"
          >
            Start free →
          </Link>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <CheckCircle2 size={16} className="text-brand" />
            <span>No credit card required</span>
          </div>
        </div>
      </section>
    </>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition hover:bg-white/[0.04]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm text-gray-400">{body}</p>
    </div>
  );
}

function Row({ label, us, them1, them2 }: { label: string; us: string; them1: string; them2: string }) {
  return (
    <tr className="border-t border-white/5">
      <td className="p-4 font-medium">{label}</td>
      <td className="p-4 font-semibold text-brand">{us}</td>
      <td className="p-4 text-gray-500">{them1}</td>
      <td className="p-4 text-gray-500">{them2}</td>
    </tr>
  );
}
