import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Financial Tools — Life Admin",
  description: "Free budgeting calculators, savings estimators, subscription cost calculators, and more. No signup required. Built by Life Admin.",
  keywords: ["free budget calculator", "savings calculator", "subscription cost calculator", "personal finance tools free"],
  openGraph: {
    title: "Free Financial Tools — Life Admin",
    description: "Free budgeting calculators, savings estimators, and subscription cost tools. No signup required.",
    url: "https://lifeadminofficial.com/tools",
    siteName: "Life Admin",
  },
  alternates: {
    canonical: "https://lifeadminofficial.com/tools",
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
