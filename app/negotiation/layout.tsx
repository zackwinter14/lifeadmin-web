import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bill Negotiation Scripts — Life Admin",
  description: "AI-generated scripts to lower your cable, internet, insurance, and phone bills. Know exactly what to say before you call. Free with Life Admin.",
  keywords: ["bill negotiation script", "lower cable bill", "negotiate internet bill", "lower insurance premium", "phone bill negotiation"],
  openGraph: {
    title: "Bill Negotiation Scripts — Know Exactly What to Say",
    description: "AI generates word-for-word scripts to lower your actual bills. Works for cable, internet, insurance, phone, and more.",
    url: "https://lifeadminofficial.com/negotiation",
    siteName: "Life Admin",
  },
  alternates: {
    canonical: "https://lifeadminofficial.com/negotiation",
  },
};

export default function NegotiationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
