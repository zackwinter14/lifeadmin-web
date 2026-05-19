"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import {
  CheckCircle2,
  ShieldCheck,
  Zap,
  TrendingDown,
  Bell,
  Lock,
  Wallet,
  Receipt,
  Calendar,
  Bot,
  PiggyBank,
  Users,
  Check,
  Wifi,
  TrendingUp,
  Star,
  Sparkles,
} from "lucide-react";

// ─── Animated Background ─────────────────────────────────────────────────────

function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.body.scrollHeight;
    };
    resize();

    type Particle = { x: number; y: number; size: number; speed: number; opacity: number; drift: number };
    const particles: Particle[] = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2.5 + 0.5,
      speed: Math.random() * 0.6 + 0.15,
      opacity: Math.random() * 0.6 + 0.15,
      drift: (Math.random() - 0.5) * 0.4,
    }));

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(62,167,88,${p.opacity})`;
        ctx.fill();
        p.y -= p.speed;
        p.x += p.drift;
        if (p.y < -4) {
          p.y = canvas.height + 4;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: -3, mixBlendMode: "screen" }}
      />
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -5 }}>
        <div className="orb-1 absolute -top-60 -left-60 h-[800px] w-[800px] rounded-full bg-brand/20 blur-[100px]" />
        <div className="orb-2 absolute top-1/3 -right-80 h-[700px] w-[700px] rounded-full bg-brand/15 blur-[90px]" />
        <div className="orb-3 absolute top-2/3 left-1/4 h-[600px] w-[600px] rounded-full bg-brand-light/10 blur-[80px]" />
        <div className="orb-4 absolute -bottom-60 right-1/4 h-[600px] w-[600px] rounded-full bg-brand/15 blur-[100px]" />
        <div className="aurora absolute -top-20 left-1/2 -translate-x-1/2 h-[350px] w-[1000px] rounded-full bg-brand/20 blur-[60px]" />
      </div>
      <div className="fixed inset-0 pointer-events-none bg-grid" style={{ zIndex: -4 }} />
    </>
  );
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function CountUp({ end, duration = 2000, prefix = "", suffix = "" }: { end: number; duration?: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(end * progress));
      if (progress < 1) requestAnimationFrame(tick);
    };
    tick();
  }, [end, duration, isInView]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── App Mockups ─────────────────────────────────────────────────────────────

function SubListMockup() {
  const subs = [
    { name: "Netflix", amount: "$15.99", color: "#E50914", type: "subscription" },
    { name: "Spotify", amount: "$9.99", color: "#1DB954", type: "subscription" },
    { name: "Electric Bill", amount: "$142.00", color: "#FFB300", type: "bill" },
    { name: "Hulu", amount: "$17.99", color: "#1CE783", type: "subscription" },
    { name: "Car Insurance", amount: "$189.00", color: "#FFB300", type: "bill" },
    { name: "Disney+", amount: "$13.99", color: "#113CCF", type: "subscription" },
  ];
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-4 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-white">Bank Accounts</span>
        <span className="rounded-full bg-brand/20 px-2 py-0.5 text-xs font-bold text-brand">
          6 detected
        </span>
      </div>
      <div className="space-y-2">
        {subs.map((sub, i) => (
          <motion.div
            key={sub.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.4 }}
            className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                style={{ background: sub.color + "22", color: sub.color }}
              >
                {sub.name[0]}
              </div>
              <span className="text-sm font-medium">{sub.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: sub.type === "bill" ? "#FFB30020" : "#3EA75820", color: sub.type === "bill" ? "#FFB300" : "#3EA758" }}>
                {sub.type}
              </span>
              <span className="text-sm text-gray-400">{sub.amount}</span>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl border border-brand/20 bg-brand/10 px-3 py-2.5">
        <span className="text-sm font-semibold text-brand">Monthly total</span>
        <span className="text-sm font-bold text-brand">$388.96/mo</span>
      </div>
    </div>
  );
}

function AIOrgMockup() {
  const items = [
    { name: "Netflix", from: "expense", to: "subscription", color: "#3EA758" },
    { name: "Electric Bill", from: "expense", to: "bill", color: "#FFB300" },
    { name: "Spotify", from: "expense", to: "subscription", color: "#3EA758" },
    { name: "Gym Membership", from: "expense", to: "subscription", color: "#3EA758" },
    { name: "Internet", from: "expense", to: "bill", color: "#FFB300" },
  ];
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-4 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-white">AI Organize</span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: done ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-full bg-brand/20 px-2 py-0.5 text-xs font-bold text-brand"
        >
          Done
        </motion.span>
      </div>
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
        <Sparkles size={13} className="text-brand" />
        <span className="text-xs text-gray-400">Classifying 5 merchants with AI...</span>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18 * i + 0.3, duration: 0.35 }}
            className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5"
          >
            <span className="text-sm font-medium">{item.name}</span>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="line-through">{item.from}</span>
              <span className="text-gray-500">→</span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.18 * i + 0.6 }}
                className="rounded-full px-2 py-0.5 font-semibold"
                style={{ background: item.color + "20", color: item.color }}
              >
                {item.to}
              </motion.span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CalendarMockup() {
  const events = [
    { day: "May 3", name: "Netflix", amount: "$15.99", urgent: false },
    { day: "May 7", name: "Electric Bill", amount: "$142.00", urgent: true },
    { day: "May 12", name: "Spotify", amount: "$9.99", urgent: false },
    { day: "May 15", name: "Car Insurance", amount: "$189.00", urgent: true },
    { day: "May 22", name: "Amazon Prime", amount: "$14.99", urgent: false },
    { day: "May 28", name: "Internet", amount: "$79.99", urgent: true },
  ];
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-4 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-white">Bill Calendar — May</span>
        <span className="text-xs text-gray-500">$452.96 upcoming</span>
      </div>
      <div className="space-y-2">
        {events.map((e, i) => (
          <motion.div
            key={e.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.4 }}
            className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2"
          >
            <div className={`w-12 shrink-0 text-xs font-bold ${e.urgent ? "text-red-400" : "text-gray-500"}`}>
              {e.day}
            </div>
            <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${e.urgent ? "bg-red-400" : "bg-brand"}`} />
            <span className="flex-1 text-sm">{e.name}</span>
            <span className="text-sm text-gray-400">{e.amount}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function NetWorthMockup() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May"];
  const values = [42, 44, 43, 46, 47];
  const max = Math.max(...values);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-4 shadow-2xl">
      <div className="mb-0.5 text-xs font-medium text-gray-500">Net Worth</div>
      <div className="text-3xl font-bold">$47,230</div>
      <div className="mb-5 text-xs font-semibold text-brand">+$1,240 this month</div>
      <div className="flex h-24 items-end gap-2">
        {months.map((m, i) => (
          <div key={m} className="flex flex-1 flex-col items-center gap-1.5">
            <motion.div
              initial={{ height: 0 }}
              animate={isInView ? { height: `${(values[i] / max) * 80}px` } : {}}
              transition={{ delay: 0.1 * i, duration: 0.6, ease: "easeOut" }}
              className={`w-full rounded-md ${i === months.length - 1 ? "bg-brand" : "bg-white/10"}`}
            />
            <span className="text-[10px] text-gray-600">{m}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
          <div className="mb-0.5 text-[10px] text-gray-500">Assets</div>
          <div className="text-sm font-bold text-brand">$63,400</div>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
          <div className="mb-0.5 text-[10px] text-gray-500">Liabilities</div>
          <div className="text-sm font-bold text-red-400">$16,170</div>
        </div>
      </div>
    </div>
  );
}

function ReceiptMockup() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-4 shadow-2xl">
      <div className="mb-4 text-sm font-semibold text-white">AI Receipt Scan</div>
      <div className="mb-3 flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-6 text-gray-600 text-xs">
        Receipt scanned — processing...
      </div>
      {[
        { label: "Merchant", value: "Whole Foods Market" },
        { label: "Amount", value: "$67.43" },
        { label: "Date", value: "May 2, 2025" },
        { label: "Category", value: "Groceries" },
      ].map((row) => (
        <motion.div
          key={row.label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between border-b border-white/5 py-2 last:border-0"
        >
          <span className="text-xs text-gray-500">{row.label}</span>
          <span className="text-xs font-medium">{row.value}</span>
        </motion.div>
      ))}
      <div className="mt-3 rounded-xl bg-brand/10 border border-brand/20 px-3 py-2 text-center text-xs font-semibold text-brand">
        Added to expenses automatically
      </div>
    </div>
  );
}

// ─── Reusable components ──────────────────────────────────────────────────────

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition hover:bg-white/[0.04] hover:border-white/10">
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
      <td className="p-3 text-sm font-medium sm:p-4">{label}</td>
      <td className="p-3 text-sm font-semibold text-brand sm:p-4">{us}</td>
      <td className="p-3 text-sm text-gray-500 sm:p-4">{them1}</td>
      <td className="p-3 text-sm text-gray-500 sm:p-4">{them2}</td>
    </tr>
  );
}

const features = [
  { icon: <Zap className="text-brand" />, title: "Auto-detect every charge", body: "Connect your bank and Life Admin surfaces every subscription, bill, and recurring charge from 90 days of history — including annual ones you forgot about." },
  { icon: <Bot className="text-brand" />, title: "AI auto-organize", body: "Hit 'AI Organize' and every charge is instantly sorted into subscriptions, bills, and expenses. No manual tagging, no guessing — AI handles the whole thing." },
  { icon: <Wallet className="text-brand" />, title: "Income detection", body: "Every paycheck and deposit is detected automatically from your bank. See your real monthly income at a glance — no manual entry needed." },
  { icon: <Calendar className="text-brand" />, title: "Bill calendar", body: "See every upcoming charge laid out by day. Plan your cash flow and avoid overdrafts before they happen." },
  { icon: <Receipt className="text-brand" />, title: "Receipt scanning", body: "Snap a photo of any receipt. AI reads the merchant, amount, and date automatically and logs it to your expense history." },
  { icon: <PiggyBank className="text-brand" />, title: "Net worth tracker", body: "Add your assets and liabilities. Watch your full financial picture grow as you cancel unused services and build better habits." },
  { icon: <Bell className="text-brand" />, title: "Bill reminders", body: "Get push notifications before any bill or subscription renews. No more surprise charges, no more 'I thought I cancelled that'." },
  { icon: <Users className="text-brand" />, title: "Household sharing", body: "Create or join a household to see everyone's subscriptions together. Automatically detect overlapping services and stop paying for the same thing twice." },
  { icon: <ShieldCheck className="text-brand" />, title: "Bank-grade security", body: "Read-only Plaid access. Your bank credentials never touch our servers. We can't move your money even if we tried." },
  { icon: <Lock className="text-brand" />, title: "Privacy first", body: "We don't sell your data. We make money one way: from people who choose to upgrade. That's the entire business model." },
];

const testimonials = [
  { name: "Marcus T.", handle: "@marcust", body: "Found $127/month I was wasting in 2 minutes. Cancelled 4 subs I completely forgot about. This app paid for itself the first day.", stars: 5 },
  { name: "Daniel K.", handle: "@dk_finance", body: "The bill calendar alone is worth it. I haven't had a surprise charge hit my account since I started using Life Admin.", stars: 5 },
  { name: "Ashley M.", handle: "@ashleym", body: "I had no idea I was still paying for a gym membership from two years ago. Life Admin found it instantly. Cancelled and got a partial refund.", stars: 5 },
  { name: "Chris L.", handle: "@chrisliving", body: "I've tried Rocket Money, Mint, and a few others. None of them are this clean or this fast. Life Admin is the first one I actually kept using past a week.", stars: 5 },
  { name: "Nina B.", handle: "@ninab", body: "Receipt scanning is unreal. I just snap a photo after every grocery run and it logs everything automatically. My expense tracking is finally accurate.", stars: 5 },
  { name: "Jordan W.", handle: "@jordanw_", body: "Set up in under 5 minutes and it found 6 subscriptions I'd completely forgotten about. $84 a month I'm now saving. Worth every penny.", stars: 5 },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-16 pt-16 md:pb-24 md:pt-32">
        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
            <span className="text-gray-300">Live on the App Store · 4.8 star rating</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-7xl"
          >
            Stop losing money to <br />
            things you <span className="gradient-text">forgot about</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 md:text-xl"
          >
            Connect your bank and AI automatically finds every subscription, bill, and expense — then sorts them so you always know exactly what you&apos;re paying for.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/signup"
              className="w-full rounded-xl bg-brand-gradient px-8 py-4 text-center text-lg font-bold text-black transition hover:opacity-90 sm:w-auto"
            >
              Start saving free
            </Link>
            <a
              href="https://apps.apple.com/app/id6762589970"
              className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 transition hover:bg-white/10 sm:w-auto"
            >
              <svg viewBox="0 0 24 24" width="26" height="26" fill="white">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <div className="text-left leading-none">
                <div className="text-xs text-gray-400">Download on the</div>
                <div className="text-lg font-bold text-white">App Store</div>
              </div>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 grid grid-cols-2 gap-8 text-center sm:grid-cols-4"
          >
            {[
              { value: <>$<CountUp end={240} />+</>, label: "average monthly savings" },
              { value: <><CountUp end={90} />s</>, label: "to connect your bank" },
              { value: <><CountUp end={6} />+</>, label: "forgotten charges found" },
              { value: <>Free</>, label: "forever, no card needed" },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-4xl font-bold gradient-text">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mockup trio */}
      <section className="border-t border-white/5 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <FadeIn className="mb-16 text-center">
            <h2 className="text-4xl font-bold md:text-5xl">
              Your financial life,{" "}
              <span className="gradient-text">finally organized</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-400">
              Connect your bank once. Life Admin finds everything, AI sorts it, and you always know exactly where you stand.
            </p>
          </FadeIn>
          <div className="grid gap-6 md:grid-cols-3">
            <FadeIn delay={0}><SubListMockup /></FadeIn>
            <FadeIn delay={0.15}><CalendarMockup /></FadeIn>
            <FadeIn delay={0.3}><NetWorthMockup /></FadeIn>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/5 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <FadeIn className="mb-16 text-center">
            <h2 className="text-4xl font-bold md:text-5xl">
              Up and running in <span className="gradient-text">90 seconds</span>
            </h2>
            <p className="mt-4 text-gray-400">No spreadsheets. No manual entry. Just connect and go.</p>
          </FadeIn>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { step: "01", icon: <Wifi size={22} className="text-brand" />, title: "Connect your bank", body: "Securely link your accounts via Plaid in under 90 seconds. Read-only access — we can never move your money." },
              { step: "02", icon: <Bot size={22} className="text-brand" />, title: "AI organizes everything", body: "AI scans 90 days of transactions and auto-sorts every charge into subscriptions, bills, and expenses. No setup required." },
              { step: "03", icon: <TrendingDown size={22} className="text-brand" />, title: "Cancel what you don't need", body: "See what you're paying, remove what you forgot, and get alerts before anything renews." },
            ].map((s, i) => (
              <FadeIn key={s.step} delay={i * 0.15}>
                <div className="relative h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                  <div className="absolute -left-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-black">
                    {s.step}
                  </div>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                    {s.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-bold">{s.title}</h3>
                  <p className="text-sm text-gray-400">{s.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Spotlight 1 — Auto detect */}
      <section className="border-t border-white/5 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-16 md:grid-cols-2">
            <FadeIn>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                Bank Accounts
              </div>
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Find every charge you forgot about
              </h2>
              <p className="mb-6 text-gray-400">
                Connect your bank and Life Admin automatically pulls in every subscription, bill, and recurring charge. Most users find at least 4 they had completely forgotten about.
              </p>
              <ul className="space-y-3">
                {[
                  "Scans 90 days of transactions instantly",
                  "Separates bills, subscriptions, and expenses",
                  "Detects annual charges too",
                  "Works across all connected accounts",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check size={15} className="shrink-0 text-brand" />
                    <span className="text-gray-300">{f}</span>
                  </li>
                ))}
              </ul>
            </FadeIn>
            <FadeIn delay={0.2}><SubListMockup /></FadeIn>
          </div>
        </div>
      </section>

      {/* Spotlight 2 — AI Organize */}
      <section className="border-t border-white/5 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-16 md:grid-cols-2">
            <FadeIn delay={0.2} className="order-2 md:order-1"><AIOrgMockup /></FadeIn>
            <FadeIn className="order-1 md:order-2">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                AI-powered
              </div>
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                AI sorts everything the moment it connects
              </h2>
              <p className="mb-6 text-gray-400">
                Tap "AI Organize" and every merchant is instantly classified as a subscription, bill, or one-time expense. No manual setup, no categories to pick through — AI handles it in seconds.
              </p>
              <ul className="space-y-3">
                {[
                  "Bills: rent, utilities, insurance, phone",
                  "Subscriptions: streaming, apps, memberships",
                  "Expenses: one-time and irregular purchases",
                  "You can always override any classification",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check size={15} className="shrink-0 text-brand" />
                    <span className="text-gray-300">{f}</span>
                  </li>
                ))}
              </ul>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Spotlight 3 — Calendar */}
      <section className="border-t border-white/5 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-16 md:grid-cols-2">
            <FadeIn>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                Bill Calendar
              </div>
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Never get surprised by a charge again
              </h2>
              <p className="mb-6 text-gray-400">
                Every upcoming bill laid out by day. See exactly what's hitting your account this month and plan your cash flow before it becomes a problem.
              </p>
              <ul className="space-y-3">
                {[
                  "Every bill visible in one timeline",
                  "Push reminders before due dates",
                  "Color-coded bills vs subscriptions",
                  "Avoid overdrafts before they happen",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check size={15} className="shrink-0 text-brand" />
                    <span className="text-gray-300">{f}</span>
                  </li>
                ))}
              </ul>
            </FadeIn>
            <FadeIn delay={0.2}><CalendarMockup /></FadeIn>
          </div>
        </div>
      </section>

      {/* Spotlight 4 — Receipt scanning */}
      <section className="border-t border-white/5 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-16 md:grid-cols-2">
            <FadeIn delay={0.2} className="order-2 md:order-1"><ReceiptMockup /></FadeIn>
            <FadeIn className="order-1 md:order-2">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                AI Vision
              </div>
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Snap a receipt. Done.
              </h2>
              <p className="mb-6 text-gray-400">
                Take a photo of any receipt or invoice. AI reads the merchant, amount, and date instantly and logs it to your expenses. No typing, no categories to pick.
              </p>
              <ul className="space-y-3">
                {[
                  "Works with any printed or digital receipt",
                  "Merchant, amount, and date extracted automatically",
                  "Added to spending history instantly",
                  "Great for cash purchases your bank can't see",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check size={15} className="shrink-0 text-brand" />
                    <span className="text-gray-300">{f}</span>
                  </li>
                ))}
              </ul>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="border-t border-white/5 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <FadeIn className="mb-16 text-center">
            <h2 className="text-4xl font-bold md:text-5xl">
              Everything to <span className="gradient-text">take back control</span>
            </h2>
            <p className="mt-4 text-gray-400">
              Free to use. No credit card. Built for people tired of mystery charges.
            </p>
          </FadeIn>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={(i % 4) * 0.06}>
                <Feature {...f} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-white/5 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <FadeIn className="mb-16 text-center">
            <h2 className="text-4xl font-bold md:text-5xl">
              People are <span className="gradient-text">saving real money</span>
            </h2>
            <p className="mt-4 text-gray-400">From the App Store.</p>
          </FadeIn>
          <div className="columns-1 gap-6 md:columns-3">
            {testimonials.map((t, i) => (
              <FadeIn key={t.name} delay={(i % 3) * 0.1} className="mb-6 break-inside-avoid">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} size={13} className="fill-brand text-brand" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-300 mb-4">&ldquo;{t.body}&rdquo;</p>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.handle}</div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t border-white/5 bg-gradient-to-b from-transparent to-brand/5 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-sm font-semibold text-brand mb-6">
              No credit card required · Free forever
            </div>
            <h2 className="text-4xl font-bold md:text-5xl">
              Free to start. <br />
              <span className="gradient-text">No paywalls hiding the good stuff.</span>
            </h2>
            <p className="mt-4 text-gray-400">The free tier is a fully working app — not a demo. Upgrade to Pro only if you want bank sync and AI features.</p>
          </FadeIn>

          <FadeIn delay={0.1} className="mt-12 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[480px] text-left">
              <thead className="bg-white/5 text-sm">
                <tr>
                  <th className="p-3 sm:p-4"></th>
                  <th className="p-3 sm:p-4"><span className="gradient-text font-bold">Life Admin</span></th>
                  <th className="p-3 sm:p-4 text-gray-400">Rocket Money</th>
                  <th className="p-3 sm:p-4 text-gray-400">Bobby</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <Row label="Free tier" us="Yes" them1="Limited" them2="Yes" />
                <Row label="Auto-detect subs" us="Yes" them1="Yes" them2="No" />
                <Row label="AI auto-organize" us="Yes" them1="No" them2="No" />
                <Row label="Expense tracking" us="Yes" them1="Yes" them2="No" />
                <Row label="Income detection" us="Yes" them1="Yes" them2="No" />
                <Row label="Net worth tracker" us="Yes" them1="Limited" them2="No" />
                <Row label="Receipt AI scan" us="Yes" them1="No" them2="No" />
                <Row label="Bill reminders" us="Yes" them1="Yes" them2="No" />
                <Row label="Household sharing" us="Yes" them1="No" them2="No" />
                <Row label="No data selling" us="Yes" them1="No" them2="Yes" />
                <Row label="Monthly cost" us="Free / $6.99 Pro" them1="$12" them2="$3" />
                <Row label="iOS + Web" us="Yes" them1="Yes" them2="iOS only" />
              </tbody>
            </table>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <h2 className="text-4xl font-bold md:text-5xl">
              Find out how much you&apos;re losing.
            </h2>
            <p className="mt-4 text-lg text-gray-400">Takes 90 seconds. Free forever. No card needed.</p>
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-xl bg-brand-gradient px-10 py-5 text-lg font-semibold text-black transition hover:opacity-90"
            >
              Start free
            </Link>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <CheckCircle2 size={16} className="text-brand" />
              <span>No credit card required</span>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
