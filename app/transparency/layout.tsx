import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How We Make Money — Life Admin",
  description: "Life Admin makes money one way: Pro subscriptions. No ads, no data selling, no affiliate deals. Full transparency on our business model.",
  openGraph: {
    title: "How Life Admin Makes Money — Full Transparency",
    description: "We make money one way: Pro subscriptions. No ads, no data selling. Here's exactly how the business works.",
    url: "https://lifeadminofficial.com/transparency",
    siteName: "Life Admin",
  },
  alternates: {
    canonical: "https://lifeadminofficial.com/transparency",
  },
};

export default function TransparencyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
