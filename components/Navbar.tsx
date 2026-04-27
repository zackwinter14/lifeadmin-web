"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-black/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient font-bold">
            $
          </div>
          <span className="text-lg font-semibold">Life Admin</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-gray-300 transition hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="text-sm text-gray-300 transition hover:text-white"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Sign up free
          </Link>
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/5 bg-black/95 md:hidden">
          <div className="flex flex-col gap-4 p-6">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)}>
              Login
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-brand-gradient px-4 py-2 text-center font-semibold text-black"
            >
              Sign up free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
