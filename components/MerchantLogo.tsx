"use client";

import { useState } from "react";
import { simplifyName, getMerchantDomain } from "@/lib/merchantUtils";

interface Props {
  name: string;
  color: string;
  size?: number;
}

export default function MerchantLogo({ name, color, size = 36 }: Props) {
  const clean = simplifyName(name);
  const domain = getMerchantDomain(clean);
  const [stage, setStage] = useState<0 | 1 | 2>(domain ? 0 : 2);

  const initials = clean.slice(0, 2).toUpperCase() || "??";

  const src =
    stage === 0 && domain
      ? `https://logo.clearbit.com/${domain}`
      : stage === 1 && domain
      ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
      : null;

  return (
    <div
      className="rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
      style={{ width: size, height: size, background: color + "20" }}
    >
      {src ? (
        <img
          src={src}
          alt={clean}
          width={size}
          height={size}
          className="object-contain w-full h-full"
          onError={() => setStage(s => (s + 1) as 0 | 1 | 2)}
        />
      ) : (
        <span className="text-xs font-bold" style={{ color }}>{initials}</span>
      )}
    </div>
  );
}
