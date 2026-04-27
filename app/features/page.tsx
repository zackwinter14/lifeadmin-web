import { Zap, ShieldCheck, TrendingDown, Bell, Lock, Target, BarChart3, Calendar } from "lucide-react";

export default function Features() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h1 className="text-5xl font-bold md:text-6xl">
            Everything Life Admin <span className="gradient-text">does for you</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            We built the tool we wanted ourselves. Then we made it better.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Big
            icon={<Zap />}
            title="Subscription auto-detection"
            body="Connect your bank in 30 seconds via Plaid. Within minutes, we surface every recurring charge — even the sneaky ones billed annually that you forgot about. We catch what your bank's app doesn't."
          />
          <Big
            icon={<TrendingDown />}
            title="One-tap cancellation"
            body="See a sub you don't want? One tap. We handle the cancellation flow, including the companies that bury cancel buttons six pages deep."
          />
          <Big
            icon={<Bell />}
            title="Smart bill reminders"
            body="We notify you before any recurring charge hits — push notification + email. No more surprise renewals. No more 'I thought I cancelled that.'"
          />
          <Big
            icon={<BarChart3 />}
            title="Spending insights"
            body="Charts that show exactly where your money goes monthly. Spot the categories quietly eating your paycheck."
          />
          <Big
            icon={<Calendar />}
            title="Bill calendar"
            body="See every upcoming charge on a calendar. Plan your cash flow. Avoid overdrafts."
          />
          <Big
            icon={<Target />}
            title="Savings goals (web exclusive)"
            body="Set a goal: 'Save $5K by Christmas.' We track your progress automatically as you cancel subs and reduce burn."
          />
          <Big
            icon={<ShieldCheck />}
            title="Bank-grade security"
            body="256-bit AES encryption. Read-only Plaid access. Your bank credentials never touch our servers. We can't move your money even if we wanted to."
          />
          <Big
            icon={<Lock />}
            title="Privacy first"
            body="We don't sell your data. Period. We make money one way: from people who upgrade. That's the entire business model."
          />
        </div>
      </div>
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
