"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { TrendingDown, CreditCard, Bell, Target } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      setLoading(false);
    }
    load();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-12 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Welcome back, <span className="gradient-text">{user?.email?.split("@")[0]}</span>
          </h1>
          <p className="mt-2 text-gray-400">Here&apos;s your money summary.</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
        >
          Log out
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Total monthly burn" value="$847.23" trend="-$120 vs last month" icon={<CreditCard />} />
        <Stat label="Saved YTD" value="$2,430" trend="+$240 this month" icon={<TrendingDown />} />
        <Stat label="Forgotten subs found" value="11" trend="3 cancelled" icon={<Bell />} />
        <Stat label="Goal progress" value="62%" trend="$3,800 / $6,000" icon={<Target />} />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Active subscriptions</h2>
            <span className="text-sm text-gray-400">11 total</span>
          </div>
          <div className="space-y-3">
            <Sub name="Netflix" amount="$22.99" date="Tomorrow" />
            <Sub name="Spotify Family" amount="$16.99" date="Apr 30" />
            <Sub name="Adobe Creative Cloud" amount="$54.99" date="May 2" />
            <Sub name="Apple One" amount="$32.95" date="May 5" />
            <Sub name="Peloton" amount="$24.00" date="May 8" />
          </div>
          <button className="mt-4 w-full rounded-lg border border-white/10 py-2 text-sm hover:bg-white/5">
            View all
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="mb-4 text-xl font-semibold">Zombie subscriptions detected</h2>
          <p className="mb-4 text-sm text-gray-400">
            Charges from apps you haven&apos;t used in 90+ days.
          </p>
          <div className="space-y-3">
            <Zombie name="Calm Premium" amount="$14.99" lastUsed="6 months ago" />
            <Zombie name="Headspace" amount="$12.99" lastUsed="8 months ago" />
            <Zombie name="MasterClass" amount="$15.00" lastUsed="11 months ago" />
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-brand/30 bg-brand/5 p-6">
        <p className="text-sm text-gray-400">⚡ Demo data shown above</p>
        <p className="mt-2 text-gray-300">
          To see your real subscriptions, connect your bank account. Takes 30 seconds via Plaid.
        </p>
        <button className="mt-4 rounded-lg bg-brand-gradient px-6 py-3 font-semibold text-black">
          Connect bank account
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, trend, icon }: { label: string; value: string; trend: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
        {icon}
      </div>
      <div className="text-sm text-gray-400">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-brand">{trend}</div>
    </div>
  );
}

function Sub({ name, amount, date }: { name: string; amount: string; date: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-black/20 p-3">
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-xs text-gray-500">Next charge: {date}</div>
      </div>
      <div className="font-semibold">{amount}</div>
    </div>
  );
}

function Zombie({ name, amount, lastUsed }: { name: string; amount: string; lastUsed: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 p-3">
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-xs text-gray-500">Last used: {lastUsed}</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="font-semibold text-red-400">{amount}</div>
        <button className="rounded-md bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/30">
          Cancel
        </button>
      </div>
    </div>
  );
}
