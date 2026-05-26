"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Menu, X, User, DollarSign, TrendingUp, Calendar, Bot, GraduationCap, Handshake, Trophy, LayoutGrid, ChevronDown, Repeat, Landmark, Wallet, Users, History, Calculator, PiggyBank, CreditCard, BarChart2, CircleX, FileText, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const MENU_SECTIONS = [
  {
    label: "Track",
    items: [
      { href: "/expenses",  label: "Add Expense", icon: DollarSign,    color: "#007AFF" },
      { href: "/history",   label: "History",     icon: History,       color: "#38BDF8" },
      { href: "/networth",  label: "Net Worth",   icon: TrendingUp,    color: "#64D2FF" },
      { href: "/household", label: "Household",   icon: Users,         color: "#30D158" },
    ],
  },
  {
    label: "Plan",
    items: [
      { href: "/calendar",     label: "Calendar",    icon: Calendar,      color: "#FF9500" },
      { href: "/recurring",    label: "Recurring",   icon: Repeat,        color: "#5E8EFF" },
      { href: "/cancel",       label: "Cancel Mgr",  icon: CircleX,       color: "#FF3B30" },
      { href: "/report",       label: "Monthly",     icon: FileText,      color: "#38BDF8" },
      { href: "/wrapped",      label: "Year Review", icon: Sparkles,      color: "#F5C518" },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/autoai",      label: "AutoAI",      icon: Bot,           color: "#AF52DE" },
      { href: "/negotiation", label: "Negotiation", icon: Handshake,     color: "#FF6B35" },
      { href: "/tools",       label: "Free Tools",  icon: Calculator,    color: "#3EA758" },
      { href: "/school",      label: "School",      icon: GraduationCap, color: "#38BDF8" },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/insights", label: "Insights", icon: BarChart2, color: "#AF52DE" },
      { href: "/rewards",  label: "Rewards",  icon: Trophy,    color: "#F5C518" },
    ],
  },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dashOpen, setDashOpen] = useState(false);
  const dashRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [autoaiUnread, setAutoaiUnread] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase.from("profiles").select("full_name, is_pro").eq("id", user.id).single();
        if (data?.full_name) setProfileName(data.full_name);
        if (data?.is_pro) setIsPro(true);
        try {
          setAutoaiUnread(localStorage.getItem(`autoai_unread_${user.id}`) === "true");
        } catch {}
      }
    }
    loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setProfileName(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close menus on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (dashRef.current && !dashRef.current.contains(e.target as Node)) setDashOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfileName(null);
    router.push("/");
  }

  const displayName = profileName || user?.email?.split("@")[0] || null;

  const publicLinks = [
    { href: "/features",      label: "Features"      },
    { href: "/pricing",       label: "Pricing"       },
    { href: "/tools",         label: "Free Tools"    },
    { href: "/about",         label: "About"         },
    { href: "/transparency",  label: "How we make money" },
  ];

  const appLinks = [
    { href: "/income",   label: "Income"   },
    { href: "/upcoming", label: "Upcoming" },
    { href: "/budget",   label: "Budget"   },
    { href: "/save",     label: "Save"     },
    { href: "/gas",      label: "Gas"      },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-black/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src="/logo-white.png" alt="Life Admin" className="h-9 w-9 object-contain" />
          <span className="text-lg font-semibold">Life Admin</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {user ? (
            <>
              {/* Dashboard dropdown */}
              <div className="relative" ref={dashRef}>
                <button
                  onClick={() => setDashOpen(o => !o)}
                  className={`flex items-center gap-1 text-sm transition ${dashOpen ? "text-white" : "text-gray-300 hover:text-white"}`}
                >
                  Dashboard <ChevronDown size={13} className={`transition-transform ${dashOpen ? "rotate-180" : ""}`} />
                </button>
                {dashOpen && (
                  <div className="absolute left-0 top-8 z-50 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#111] shadow-2xl">
                    <div className="p-2">
                      <Link href="/dashboard" onClick={() => setDashOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/15"><LayoutGrid size={13} className="text-brand" /></div>
                        <span className="text-sm font-medium text-gray-200">Overview</span>
                      </Link>
                      <Link href="/manual" onClick={() => setDashOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-500/15"><Repeat size={13} className="text-green-400" /></div>
                        <span className="text-sm font-medium text-gray-200">My Finances</span>
                      </Link>
                      <Link href="/bank" onClick={() => setDashOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/15"><Landmark size={13} className="text-blue-400" /></div>
                        <span className="text-sm font-medium text-gray-200">Bank Accounts</span>
                      </Link>
                      <Link href="/vault" onClick={() => setDashOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/15"><PiggyBank size={13} className="text-brand" /></div>
                        <span className="text-sm font-medium text-gray-200">Savings Vault</span>
                      </Link>
                      <Link href="/credit" onClick={() => setDashOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#38BDF8]/15"><CreditCard size={13} className="text-[#38BDF8]" /></div>
                        <span className="text-sm font-medium text-gray-200">Credit Cards</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {appLinks.map(l => (
                <Link key={l.href} href={l.href} className="text-sm text-gray-300 transition hover:text-white">
                  {l.label}
                </Link>
              ))}

              {/* Menu button + dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${menuOpen ? "border-brand/50 bg-brand/10 text-brand" : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"}`}
                >
                  <LayoutGrid size={14} />
                  Menu
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#111] shadow-2xl">
                    <div className="p-3 space-y-3">
                      {MENU_SECTIONS.map(section => (
                        <div key={section.label}>
                          <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">{section.label}</p>
                          <div className="grid grid-cols-2 gap-1">
                            {section.items.map(item => {
                              const Icon = item.icon;
                              const isAutoAI = item.href === "/autoai";
                              return (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={() => { setMenuOpen(false); if (isAutoAI) setAutoaiUnread(false); }}
                                  className="flex items-center gap-2 rounded-xl px-2.5 py-2 transition hover:bg-white/5"
                                >
                                  <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: item.color + "20" }}>
                                    <Icon size={13} style={{ color: item.color }} />
                                    {isAutoAI && autoaiUnread && (
                                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-purple-500 ring-1 ring-black" />
                                    )}
                                  </div>
                                  <span className="text-xs font-medium text-gray-200">{item.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile */}
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full px-3 py-1.5 transition hover:opacity-90"
                style={isPro ? {
                  background: "linear-gradient(135deg, #1a1200, #2a1f00)",
                  border: "1px solid #F5C51860",
                } : {
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {isPro ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#F5C518"><path d="M2 19h20v2H2v-2zM2 6l5 7 5-7 5 7 5-7v11H2V6z"/></svg>
                ) : (
                  <User size={14} className="text-brand" />
                )}
                <span
                  className="text-sm font-semibold"
                  style={isPro ? { color: "#F5C518" } : {}}
                >
                  {displayName}
                </span>
                {isPro && (
                  <span className="rounded-full bg-yellow-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-yellow-400">
                    Pro
                  </span>
                )}
              </Link>
            </>
          ) : (
            <>
              {publicLinks.map(l => (
                <Link key={l.href} href={l.href} className="text-sm text-gray-300 transition hover:text-white">
                  {l.label}
                </Link>
              ))}
              <Link href="/login" className="text-sm text-gray-300 transition hover:text-white">Login</Link>
              <Link href="/signup" className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90">
                Sign up free
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden" onClick={() => setMobileOpen(o => !o)} aria-label="menu">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/5 bg-black/95 md:hidden">
          <div className="flex flex-col gap-1 p-4 max-h-[75vh] overflow-y-auto">
            {user ? (
              <>
                <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-widest text-gray-600">Dashboard</p>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white">Overview</Link>
                <Link href="/manual" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white">My Finances</Link>
                <Link href="/bank" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white">Bank Accounts</Link>
                <Link href="/vault" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white">Savings Vault</Link>
                <Link href="/credit" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white">Credit Cards</Link>
                <p className="mb-1 mt-3 px-3 text-xs font-semibold uppercase tracking-widest text-gray-600">Main</p>
                {appLinks.map(l => (
                  <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                    {l.label}
                  </Link>
                ))}
                {MENU_SECTIONS.map(section => (
                  <div key={section.label}>
                    <p className="mb-1 mt-3 px-3 text-xs font-semibold uppercase tracking-widest text-gray-600">{section.label}</p>
                    {section.items.map(item => {
                      const Icon = item.icon;
                      const isAutoAI = item.href === "/autoai";
                      return (
                        <Link key={item.href} href={item.href} onClick={() => { setMobileOpen(false); if (isAutoAI) setAutoaiUnread(false); }} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/5">
                          <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: item.color + "20" }}>
                            <Icon size={13} style={{ color: item.color }} />
                            {isAutoAI && autoaiUnread && (
                              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-purple-500 ring-1 ring-black" />
                            )}
                          </div>
                          <span className="text-sm text-gray-300">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
                <div className="my-2 border-t border-white/5" />
                <Link href="/profile" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5">
                  Profile ({displayName})
                </Link>
                <button onClick={handleLogout} className="rounded-xl border border-white/10 px-3 py-2.5 text-left text-sm text-gray-400 hover:bg-white/5">
                  Log out
                </button>
              </>
            ) : (
              <>
                {publicLinks.map(l => (
                  <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5">
                    {l.label}
                  </Link>
                ))}
                <Link href="/login" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5">Login</Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)} className="mt-1 rounded-xl bg-brand-gradient px-3 py-2.5 text-center text-sm font-semibold text-black">
                  Sign up free
                </Link>
                <a
                  href="https://apps.apple.com/app/id6762589970"
                  onClick={() => setMobileOpen(false)}
                  className="mt-1 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition hover:bg-white/10"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  <div className="leading-none">
                    <div className="text-[9px] text-gray-500">Download on the</div>
                    <div className="text-sm font-semibold text-white">App Store</div>
                  </div>
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
