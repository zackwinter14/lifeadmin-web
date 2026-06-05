"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, User } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [autoaiUnread, setAutoaiUnread] = useState(false);
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

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfileName(null);
    router.push("/");
  }

  const displayName = profileName || user?.email?.split("@")[0] || null;

  const publicLinks = [
    { href: "/features", label: "Features" },
    { href: "/pricing",  label: "Pricing"  },
    { href: "/about",    label: "About"    },
  ];

  const authLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/save",      label: "Save"      },
    { href: "/finances",  label: "Finances"  },
    { href: "/calendar",  label: "Calendar"  },
    { href: "/tools",     label: "Tools"     },
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
              {authLinks.map(l => (
                <Link key={l.href} href={l.href} className="text-sm text-gray-300 transition hover:text-white">
                  {l.label}
                </Link>
              ))}

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
                {authLinks.map(l => (
                  <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                    {l.label}
                  </Link>
                ))}
                <div className="my-2 border-t border-white/5" />
                <Link href="/profile" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
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
