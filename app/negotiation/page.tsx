"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Handshake, ChevronDown, ChevronUp, Copy, Check, Phone, Wifi, Tv, Heart, Car, Dumbbell, Zap } from "lucide-react";

interface Script {
  id: string;
  icon: React.ElementType;
  color: string;
  category: string;
  title: string;
  savingsRange: string;
  intro: string;
  steps: string[];
  script: string;
  tips: string[];
}

const SCRIPTS: Script[] = [
  {
    id: "internet",
    icon: Wifi,
    color: "#007AFF",
    category: "Internet",
    title: "Negotiate Your Internet Bill",
    savingsRange: "$20–$50/mo",
    intro: "ISPs expect you to negotiate. Loyalty discounts are real — you just have to ask.",
    steps: [
      "Find a competitor's current promotional rate in your area (Google '[competitor] internet deals [your city]').",
      "Call your ISP's retention department (say 'I'd like to cancel' to get transferred).",
      "Use the script below.",
    ],
    script: `"Hi, I've been a customer for [X years] and I really like the service. But I'm looking at my bill and it's just too high. I've been seeing [Competitor] offering [speed] for $[price]/month. I'd really like to stay, but I need a better rate. What can you do for me?"`,
    tips: [
      "If they say no, ask to speak with retentions or a supervisor.",
      "If the first agent won't help, call back — different reps have different authority.",
      "Best day/time: Tuesday–Thursday mornings.",
      "Works even if you've had 'promotional pricing' before.",
    ],
  },
  {
    id: "phone",
    icon: Phone,
    color: "#34C759",
    category: "Phone",
    title: "Lower Your Phone Bill",
    savingsRange: "$15–$40/mo",
    intro: "Phone carriers have major room to negotiate — especially if you've been a customer for years.",
    steps: [
      "Check competitor plans (Mint Mobile, Visible, Metro) — they're often 50% cheaper.",
      "Call your carrier's loyalty/retention line.",
      "Mention you're comparing plans and considering switching.",
    ],
    script: `"I've been a loyal customer for [X years] and I love your service, but I'm paying $[amount]/month and I've found plans elsewhere for $[lower amount]. I'd really prefer to stay with you — what loyalty discounts or plan adjustments can you offer?"`,
    tips: [
      "Ask specifically for 'loyalty credits' or 'account credits'.",
      "Military/teacher/student discounts are often not advertised — always ask.",
      "If you have multiple lines, mention that — they'll work harder to keep you.",
      "Consider downgrading data if you mostly use WiFi.",
    ],
  },
  {
    id: "cable",
    icon: Tv,
    color: "#FF9500",
    category: "Cable / Streaming",
    title: "Cut Your Cable or Streaming Bills",
    savingsRange: "$10–$80/mo",
    intro: "Cable companies have huge retention budgets. Streaming services will often offer pauses or discounts.",
    steps: [
      "List every streaming service you pay for.",
      "Cancel the ones you haven't used in 30 days — you can always re-subscribe.",
      "For cable, call and threaten to cancel to unlock hidden promos.",
    ],
    script: `"Hi, I'm calling because I need to reduce my expenses and I'm thinking about canceling my service. I've been a customer for [X years] — what's the best promotional rate you can offer to keep me?"`,
    tips: [
      "Cable companies often have $20–$30/mo 'loyal customer' discounts not listed online.",
      "Ask for a 'rate lock' so it doesn't jump back up in 6 months.",
      "Streaming tip: Share plans with family — Netflix, Spotify, Apple One all have family tiers.",
      "Rotate services: subscribe for 1–2 months to watch a show, cancel, rotate.",
    ],
  },
  {
    id: "insurance",
    icon: Heart,
    color: "#FF3B30",
    category: "Insurance",
    title: "Lower Your Insurance Premiums",
    savingsRange: "$20–$100/mo",
    intro: "Insurance companies expect annual rate shopping. Loyalty rarely pays — switching does.",
    steps: [
      "Get competing quotes online from 2–3 other carriers (takes 10 minutes).",
      "Call your current insurer and tell them you have a better quote.",
      "Ask about all available discounts.",
    ],
    script: `"I've been with you for [X years] and I've been happy, but I just got a quote from [Competitor] for $[amount] less per month for the same coverage. Before I switch, I wanted to give you the chance to match it. Can you look at my account and see what discounts I qualify for?"`,
    tips: [
      "Ask about: bundling (auto + home), good driver, paperless, auto-pay, safety device discounts.",
      "Raise your deductible to lower premiums — only do this if you have emergency savings.",
      "Shop every 12–24 months — loyalty rarely beats new customer pricing.",
      "Never let your policy lapse even one day — it raises your rates.",
    ],
  },
  {
    id: "medical",
    icon: Heart,
    color: "#AF52DE",
    category: "Medical",
    title: "Negotiate Medical Bills",
    savingsRange: "20–50% off",
    intro: "Medical bills are almost always negotiable. Hospitals have financial assistance programs few people know about.",
    steps: [
      "Request an itemized bill — errors are common and can be disputed.",
      "Call the billing department (not the front desk).",
      "Ask about financial assistance programs before negotiating the rate.",
    ],
    script: `"I received this bill for $[amount] and I'm not able to pay this in full. I'd like to understand my options. Do you have a financial assistance or charity care program I might qualify for? And if not, what's the lowest settlement amount you can accept for a lump sum payment?"`,
    tips: [
      "Lump sum payments often get 20–40% off — hospitals prefer certainty.",
      "Ask for a payment plan with 0% interest if you can't pay in full.",
      "Never pay before checking if insurance processed it correctly.",
      "Non-profits must offer charity care — always ask, income limits are often generous.",
    ],
  },
  {
    id: "gym",
    icon: Dumbbell,
    color: "#FF6B35",
    category: "Gym",
    title: "Negotiate Your Gym Membership",
    savingsRange: "$10–$30/mo",
    intro: "Gyms hate losing members and will often waive fees or discount rates to keep you.",
    steps: [
      "Look up any current promotions the gym is running for new members.",
      "Visit in person (works better than calling) — talk to a manager, not a sales rep.",
      "Tell them you want to stay but need a better rate.",
    ],
    script: `"I love coming here and I've been a member for [X time], but my budget has gotten tighter. I saw you're offering new members [deal]. Is there anything you can do for a loyal member to match that or get close to it?"`,
    tips: [
      "Best time: end of month when they're trying to hit membership goals.",
      "Ask to waive the annual fee ($40–$50 is common).",
      "Month-to-month is more expensive but gives you leverage to cancel anytime.",
      "Check if your employer or health insurance covers gym fees — many do.",
    ],
  },
  {
    id: "utilities",
    icon: Zap,
    color: "#F5C518",
    category: "Utilities",
    title: "Reduce Your Utility Bills",
    savingsRange: "$20–$60/mo",
    intro: "Utilities are harder to negotiate directly, but there are programs and habits that cut costs significantly.",
    steps: [
      "Call your utility company and ask about budget billing, low-income assistance, or levelized plans.",
      "Ask specifically about energy efficiency rebates.",
      "Audit your usage — small changes add up fast.",
    ],
    script: `"Hi, I'm a customer at [address] and I'm looking for ways to reduce my monthly bill. What programs do you offer for budget billing or energy assistance? Are there any rebates for energy-efficient appliances or smart thermostats?"`,
    tips: [
      "LIHEAP: Federal program that helps with heating/cooling costs — many qualify.",
      "Time-of-use plans: Run dishwasher, laundry, EV charging at off-peak hours.",
      "Programmable thermostat: 1% savings per degree you adjust over 8 hours.",
      "Audit: Seal drafts around doors/windows — massive heat/AC waste.",
      "LED bulbs pay back in 6 months and last 10+ years.",
    ],
  },
  {
    id: "car",
    icon: Car,
    color: "#38BDF8",
    category: "Auto",
    title: "Lower Your Car Payment or Rate",
    savingsRange: "$30–$150/mo",
    intro: "Refinancing your auto loan can drop your rate significantly, especially if your credit score has improved.",
    steps: [
      "Check your current loan rate and remaining balance.",
      "Get quotes from 2–3 lenders (credit unions typically beat banks).",
      "Refinance if you find a lower rate.",
    ],
    script: `"I have an auto loan at [X]% interest. My credit score has improved since I took it out and I'm looking to refinance. What rates can you offer on a [year/make/model] with [X miles] and a remaining balance of $[amount]?"`,
    tips: [
      "Credit unions often offer 1–2% lower rates than banks.",
      "Refinancing is free and only takes a small credit inquiry.",
      "Don't extend the loan term just to lower payments — you'll pay more interest total.",
      "If you have equity, avoid rolling negative equity into a new loan.",
      "Call your current lender first — they may match the rate to keep your business.",
    ],
  },
];

export default function NegotiationPage() {
  const router = useRouter();
  const supabase = createClient();
  const [authed, setAuthed] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setAuthed(true);
    }
    init();
  }, []);

  const categories = ["All", ...Array.from(new Set(SCRIPTS.map(s => s.category)))];
  const filtered = filter === "All" ? SCRIPTS : SCRIPTS.filter(s => s.category === filter);

  async function copyScript(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!authed) return <div className="flex min-h-screen items-center justify-center"><div className="text-gray-500">Loading...</div></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Negotiation</h1>
        <p className="mt-1 text-sm text-gray-400">Word-for-word scripts to lower your bills and save money.</p>
      </div>

      {/* Banner */}
      <div className="mb-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
        <p className="font-semibold text-orange-300">Most people never ask. Those who do save an average of $500/year.</p>
        <p className="mt-0.5 text-sm text-gray-500">Use the scripts below — they work for any bill, any company.</p>
      </div>

      {/* Category filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className="rounded-full border px-4 py-1.5 text-sm font-semibold transition"
            style={{
              borderColor: filter === cat ? "#FF6B35" : "rgba(255,255,255,0.1)",
              background: filter === cat ? "#FF6B3520" : "transparent",
              color: filter === cat ? "#FF6B35" : "#9ca3af",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Scripts */}
      <div className="space-y-3">
        {filtered.map(script => {
          const Icon = script.icon;
          const isOpen = open === script.id;
          return (
            <div
              key={script.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
              style={isOpen ? { borderColor: script.color + "40" } : {}}
            >
              <button
                onClick={() => setOpen(isOpen ? null : script.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: script.color + "15", border: `1px solid ${script.color}30` }}
                >
                  <Icon size={18} style={{ color: script.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                      style={{ background: script.color + "20", color: script.color }}
                    >
                      Save {script.savingsRange}
                    </span>
                  </div>
                  <p className="mt-0.5 font-semibold">{script.title}</p>
                  <p className="text-xs text-gray-500">{script.intro}</p>
                </div>
                <div className="text-gray-600">
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-white/5 px-5 py-5 space-y-5">
                  {/* Steps */}
                  <div>
                    <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-gray-500">Steps</p>
                    <ol className="space-y-2">
                      {script.steps.map((step, i) => (
                        <li key={i} className="flex gap-3 text-sm text-gray-300 leading-relaxed">
                          <span
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-black mt-0.5"
                            style={{ background: script.color }}
                          >
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Script */}
                  <div>
                    <div className="mb-2.5 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Script</p>
                      <button
                        onClick={() => copyScript(script.id, script.script)}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-xs font-semibold transition hover:bg-white/5"
                        style={{ color: copied === script.id ? script.color : "#9ca3af" }}
                      >
                        {copied === script.id ? <Check size={11} /> : <Copy size={11} />}
                        {copied === script.id ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <div
                      className="rounded-xl border p-4 text-sm text-gray-200 italic leading-relaxed"
                      style={{ borderColor: script.color + "30", background: script.color + "08" }}
                    >
                      {script.script}
                    </div>
                  </div>

                  {/* Tips */}
                  <div>
                    <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-gray-500">Pro Tips</p>
                    <ul className="space-y-2">
                      {script.tips.map((tip, i) => (
                        <li key={i} className="flex gap-2.5 text-sm text-gray-400 leading-relaxed">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: script.color }} />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-center">
        <Handshake size={22} className="mx-auto mb-2 text-gray-500" />
        <p className="text-sm text-gray-400">Need help crafting a custom negotiation? Ask <span className="text-purple-400">AutoAI</span> for a personalized script.</p>
        <button
          onClick={() => router.push("/autoai")}
          className="mt-3 rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-sm font-semibold text-purple-400 hover:bg-purple-500/15"
        >
          Open AutoAI
        </button>
      </div>
    </div>
  );
}
