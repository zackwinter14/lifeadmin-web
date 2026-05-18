import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Financial Tools — Life Admin",
  description: "Free budgeting calculators, savings estimators, subscription cost calculators, and more. No signup required. Built by Life Admin.",
  keywords: ["free budget calculator", "free savings calculator", "subscription cost calculator", "personal finance tools free", "Life Admin free tools", "monthly budget calculator", "net worth calculator free", "expense calculator", "bill calculator", "how much am I spending calculator", "cancel subscription savings calculator"],
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
