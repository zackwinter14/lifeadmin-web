import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Life Admin | Free Forever, Pro from $4.17/mo",
  description: "Life Admin is free forever with manual tracking. Upgrade to Pro for $6.99/month or $49.99/year to connect your bank, auto-detect subscriptions, and scan receipts with AI.",
  keywords: ["Life Admin pricing", "Life Admin finance app cost", "subscription tracker app price", "personal finance app free", "free budget app", "free subscription tracker", "bank sync app pricing", "cancel subscriptions app cost", "Rocket Money alternative pricing", "cheap finance app", "budget app free forever"],
  openGraph: {
    title: "Life Admin Pricing — Free Forever, Pro from $4.17/mo",
    description: "Start free with full manual tracking. Upgrade to Pro to connect your bank, auto-detect every subscription, and scan receipts with AI. Cancel any time.",
    url: "https://lifeadminofficial.com/pricing",
    siteName: "Life Admin",
  },
  alternates: {
    canonical: "https://lifeadminofficial.com/pricing",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
