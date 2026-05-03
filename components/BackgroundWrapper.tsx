"use client";

import { useEffect, useState } from "react";
import AnimatedBackground from "./AnimatedBackground";

export default function BackgroundWrapper() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("bg_enabled");
      if (stored !== null) setEnabled(stored === "true");
    } catch {}

    // Listen for changes from the profile settings toggle
    function onStorage(e: StorageEvent) {
      if (e.key === "bg_enabled") setEnabled(e.newValue === "true");
    }
    // Also listen for a custom event (same-tab updates)
    function onBgChange(e: Event) {
      setEnabled((e as CustomEvent).detail === true);
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("bg_change", onBgChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("bg_change", onBgChange);
    };
  }, []);

  if (!enabled) return null;
  return <AnimatedBackground />;
}
