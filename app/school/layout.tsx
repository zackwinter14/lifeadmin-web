import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Money School  -  Life Admin | Learn Personal Finance",
  description: "Learn budgeting, saving, debt payoff, and investing with bite-sized lessons. Free personal finance education built into Life Admin.",
  keywords: ["personal finance education", "learn budgeting", "Life Admin money school", "debt payoff guide", "saving money tips", "investing basics for beginners", "how to budget", "how to save money", "how to pay off debt", "personal finance 101", "money tips app", "financial literacy app", "beginner finance guide", "how to build an emergency fund", "50 30 20 rule explained"],
  openGraph: {
    title: "Money School  -  Free Personal Finance Education",
    description: "Bite-sized lessons on budgeting, saving, debt payoff, and investing. Free inside Life Admin.",
    url: "https://lifeadminofficial.com/school",
    siteName: "Life Admin",
  },
  alternates: {
    canonical: "https://lifeadminofficial.com/school",
  },
};

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  return children;
}
