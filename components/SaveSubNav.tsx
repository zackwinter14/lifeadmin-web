"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Goals",     href: "/save"     },
  { label: "Vault",     href: "/vault"    },
  { label: "Budget",    href: "/budget"   },
  { label: "Net Worth", href: "/networth" },
];

export default function SaveSubNav() {
  const pathname = usePathname();

  return (
    <div className="sticky z-40 bg-black/80 backdrop-blur-xl border-b border-white/[0.08]" style={{ top: 65 }}>
      <div className="mx-auto max-w-2xl px-4">
        <div className="flex">
          {TABS.map(tab => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  padding: "12px 18px",
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#00C853" : "#888",
                  borderBottom: active ? "2px solid #00C853" : "2px solid transparent",
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                  transition: "color 0.15s",
                  marginBottom: -1,
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
