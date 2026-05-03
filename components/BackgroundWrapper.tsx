"use client";

import { usePathname } from "next/navigation";
import AnimatedBackground from "./AnimatedBackground";

// Pages where the animated background should NOT appear (logged-in app pages)
const APP_ROUTES = [
  "/dashboard",
  "/profile",
  "/budget",
  "/calendar",
  "/expenses",
  "/gas",
  "/manual",
  "/negotiation",
  "/networth",
  "/rewards",
  "/save",
  "/school",
  "/upcoming",
  "/bank",
  "/autoai",
];

export default function BackgroundWrapper() {
  const pathname = usePathname();
  const isAppPage = APP_ROUTES.some((route) => pathname.startsWith(route));
  if (isAppPage) return null;
  return <AnimatedBackground />;
}
