"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, User } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        if (data?.full_name) setProfileName(data.full_name);
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

  const navLinks = [
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
  ];

  const appLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/upcoming", label: "Upcoming" },
    { href: "/budget", label: "Budget" },
    { href: "/save", label: "Save" },
    { href: "/gas", label: "Gas" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-black/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient font-bold text-black">
            $
          </div>
          <span className="text-lg font-semibold">Life Admin</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-gray-300 transition hover:text-white">
              {l.label}
            </Link>
          ))}

          {user ? (
            <>
              {appLinks.map(l => (
                <Link key={l.href} href={l.href} className="text-sm text-gray-300 transition hover:text-white">
                  {l.label}
                </Link>
              ))}
              <Link href="/profile" className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 transition hover:bg-white/10">
                <User size={14} className="text-brand" />
                <span className="text-sm font-medium">{displayName}</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-300 transition hover:text-white">
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Sign up free
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="menu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/5 bg-black/95 md:hidden">
          <div className="flex flex-col gap-4 p-6">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-gray-300 hover:text-white">
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                {appLinks.map(l => (
                  <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-gray-300 hover:text-white">
                    {l.label}
                  </Link>
                ))}
                <Link href="/profile" onClick={() => setOpen(false)} className="text-gray-300 hover:text-white">
                  Profile ({displayName})
                </Link>
                <button onClick={handleLogout} className="rounded-lg border border-white/10 py-2 text-sm text-gray-400 hover:text-white">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)}>Login</Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="rounded-lg bg-brand-gradient px-4 py-2 text-center font-semibold text-black">
                  Sign up free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
