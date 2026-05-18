import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features — Life Admin | Everything Your Money Needs in One App",
  description: "Auto-detect every subscription, track income, scan receipts with AI, monitor net worth, and never get surprised by a charge again. See every Life Admin feature.",
  keywords: ["Life Admin features", "Life Admin finance tracker features", "subscription tracker features", "bill management app", "AI receipt scanner app", "net worth tracker app", "income tracking app", "cancel subscriptions app", "gas tracker app", "budget planner features", "expense tracker features", "household finance app", "bank sync personal finance"],
  openGraph: {
    title: "Life Admin Features — Track Every Dollar Automatically",
    description: "Auto-detect subscriptions, scan receipts with AI, track net worth, manage bills, and cancel forgotten subs. Everything in one app.",
    url: "https://lifeadminofficial.com/features",
    siteName: "Life Admin",
  },
  alternates: {
    canonical: "https://lifeadminofficial.com/features",
  },
};

import {
  Zap,
  ShieldCheck,
  TrendingDown,
  Bell,
  Lock,
  Target,
  BarChart3,
  Calendar,
  Wallet,
  Fuel,
  Receipt,
  Bot,
  PiggyBank,
  Users,
  Layers,
  RefreshCw,
} from "lucide-react";

export default function Features() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h1 className="text-5xl font-bold md:text-6xl">
            Everything Life Admin <span className="gradient-text">does for you</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            Track every dollar. Cancel forgotten subs. See your full financial life on one screen.
          </p>
        </div>

        <Section title="Money Detection (Auto)">
          <Big
            icon={<Zap />}
            title="Subscription auto-detection"
            body="Connect your bank in 30 seconds via Plaid. Within 30 seconds, AI surfaces every recurring charge — even the annual ones billed once a year that you forgot existed. Strict recurrence checks prevent false positives, so Walmart visits don't become fake bills."
          />
          <Big
            icon={<Wallet />}
            title="Income tracking"
            body="Every paycheck, refund, interest payment, and deposit gets detected and categorized automatically. Salary, freelance, transfers, and refunds are sorted into clear categories. See your monthly income at a glance, broken down by source."
          />
          <Big
            icon={<Fuel />}
            title="Gas tracker"
            body="We recognize 150+ gas stations across the US, Canada, UK, EU, Latin America, and Asia-Pacific. Every fill-up logged with merchant, amount, and date. Manually add fill-ups too. Built-in disclaimer reminds you that not every charge at a gas station is fuel."
          />
          <Big
            icon={<Bot />}
            title="AI auto-organize"
            body="Powered by Claude. After Scan Bank runs, AI classifies every transaction into subscription, bill, gas, or one-time expense. Your organization persists across app restarts — no more redoing the same work every time you reopen the app."
          />
        </Section>

        <Section title="Track Everything Else">
          <Big
            icon={<Receipt />}
            title="Receipt scanning with AI Vision"
            body="Snap a photo of any receipt or invoice. Claude Vision reads the merchant, amount, and date automatically and adds it to your expenses. Works on crumpled paper, dim lighting, foreign languages."
          />
          <Big
            icon={<PiggyBank />}
            title="Net worth tracker"
            body="Add your assets (cash, investments, real estate) and liabilities (loans, credit cards). See your full financial picture grow over time. Every entry is stored securely against your account."
          />
          <Big
            icon={<Calendar />}
            title="Bill calendar"
            body="See every upcoming charge laid out by day. Plan your cash flow. Avoid overdrafts before they happen."
          />
          <Big
            icon={<Layers />}
            title="Manual + Bank dual view"
            body="Track manually for free, or connect your bank. Both views live side by side on your home screen so you always see the full picture — what you typed in and what your bank revealed."
          />
        </Section>

        <Section title="Save Money Automatically">
          <Big
            icon={<TrendingDown />}
            title="One-tap cancellation"
            body="See a sub you don't want? One tap. Life Admin handles the cancel flow, including the companies that bury cancel buttons six pages deep."
          />
          <Big
            icon={<Bell />}
            title="Smart bill reminders"
            body="Push notifications before any recurring charge or free trial hits. No more surprise renewals. No more 'I thought I cancelled that.' Customizable per item."
          />
          <Big
            icon={<BarChart3 />}
            title="Spending insights"
            body="Charts that show exactly where your money goes monthly. Spot the categories quietly eating your paycheck. Compare this month to last."
          />
          <Big
            icon={<Target />}
            title="Savings goals"
            body="Set a goal: 'Save $5K by Christmas.' Track your progress automatically as you cancel subs and reduce burn. Visual progress bars keep you motivated."
          />
        </Section>

        <Section title="Built for Real Life">
          <Big
            icon={<RefreshCw />}
            title="Multi-bank support"
            body="Connect as many banks as you have. Chase, Capital One, Bank of America, credit unions, Apple Card — all in one view. Cross-bank dedup means the same transaction never shows twice."
          />
          <Big
            icon={<Users />}
            title="Family-aware"
            body="Catch shared subscription leaks: someone paying for two Hulus, an old family Netflix, in-app purchases on a kid's account. Every charge surfaces so the whole household knows what's flowing where."
          />
          <Big
            icon={<ShieldCheck />}
            title="Bank-grade security"
            body="256-bit AES encryption. Read-only Plaid access. Your bank credentials never touch our servers. We can't move your money even if we wanted to. Disconnect any time and your tokens are wiped."
          />
          <Big
            icon={<Lock />}
            title="Privacy first"
            body="We don't sell your data. Period. We make money one way: from people who upgrade. That's the entire business model. No ads in the paid tier."
          />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-16">
      <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-brand">
        {title}
      </h2>
      <div className="grid gap-6 md:grid-cols-2">{children}</div>
    </div>
  );
}

function Big({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-2 text-gray-400">{body}</p>
    </div>
  );
}
