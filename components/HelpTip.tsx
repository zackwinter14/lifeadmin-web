"use client";

import { useState, useEffect } from "react";
import { X, Lightbulb } from "lucide-react";

interface HelpTipProps {
  storageKey: string;
  title: string;
  body: React.ReactNode;
  icon?: React.ReactNode;
  color?: string;
}

export default function HelpTip({ storageKey, title, body, icon, color = "#3EA758" }: HelpTipProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("helptip_" + storageKey)) setVisible(true);
    } catch {}
  }, [storageKey]);

  function dismiss() {
    setVisible(false);
    try { localStorage.setItem("helptip_" + storageKey, "1"); } catch {}
  }

  if (!visible) return null;

  return (
    <div
      className="mb-6 rounded-2xl border px-5 py-4"
      style={{ borderColor: color + "30", background: color + "08" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
          style={{ background: color + "20" }}
        >
          {icon ?? <Lightbulb size={15} style={{ color }} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm mb-1">{title}</p>
          <div className="text-xs leading-relaxed text-gray-400 space-y-1">{body}</div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-lg p-1 text-gray-600 hover:text-gray-300 hover:bg-white/10 transition mt-0.5"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
