"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

const THEMES = [
  {
    id: "forest",
    label: "Forest",
    description: "Default dark green",
    bg: "#0a0a0a",
    accent: "#3EA758",
    gradient: "linear-gradient(135deg, #3EA758, #5dd377)",
  },
  {
    id: "midnight",
    label: "Midnight",
    description: "Deep indigo",
    bg: "#080a14",
    accent: "#6366F1",
    gradient: "linear-gradient(135deg, #6366F1, #818CF8)",
  },
  {
    id: "ember",
    label: "Ember",
    description: "Warm orange",
    bg: "#0f0a08",
    accent: "#F97316",
    gradient: "linear-gradient(135deg, #F97316, #FB923C)",
  },
  {
    id: "ocean",
    label: "Ocean",
    description: "Sky blue",
    bg: "#050d18",
    accent: "#38BDF8",
    gradient: "linear-gradient(135deg, #38BDF8, #7DD3FC)",
  },
  {
    id: "amethyst",
    label: "Amethyst",
    description: "Soft purple",
    bg: "#0d0a14",
    accent: "#A855F7",
    gradient: "linear-gradient(135deg, #A855F7, #C084FC)",
  },
  {
    id: "pearl",
    label: "Pearl",
    description: "White & silver",
    bg: "#0a0a0a",
    accent: "#E5E5E5",
    gradient: "linear-gradient(135deg, #ffffff, #d4d4d4)",
  },
  {
    id: "gold",
    label: "Gold",
    description: "Warm amber",
    bg: "#0c0a05",
    accent: "#F5C518",
    gradient: "linear-gradient(135deg, #F5C518, #FCD34D)",
  },
];

export default function ThemeSelector() {
  const [active, setActive] = useState("forest");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("app_theme");
      if (stored) setActive(stored);
    } catch {}
  }, []);

  function apply(id: string) {
    setActive(id);
    try { localStorage.setItem("app_theme", id); } catch {}
    document.documentElement.setAttribute("data-theme", id);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <p className="text-sm font-bold text-white">App Theme</p>
        <p className="text-xs text-gray-500 mt-0.5">Changes accent color and background across the whole app</p>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {THEMES.map(theme => {
          const isActive = active === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => apply(theme.id)}
              className="relative rounded-xl border p-3 text-left transition hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: theme.bg,
                borderColor: isActive ? theme.accent : "rgba(255,255,255,0.08)",
                boxShadow: isActive ? `0 0 0 1px ${theme.accent}` : "none",
              }}
            >
              {/* Color swatch */}
              <div
                className="mb-2.5 h-6 w-full rounded-lg"
                style={{ background: theme.gradient }}
              />
              {/* Label */}
              <p className="text-xs font-bold text-white">{theme.label}</p>
              <p className="text-[10px] text-gray-500">{theme.description}</p>

              {/* Active check */}
              {isActive && (
                <div
                  className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ background: theme.accent }}
                >
                  <Check size={10} color="#000" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
