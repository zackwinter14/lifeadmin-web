import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Life Admin",
  description:
    "Get in touch with the Life Admin team. Support, feedback, privacy questions, or partnership inquiries — we respond within one business day.",
  keywords: ["Life Admin support", "contact Life Admin", "Life Admin help", "finance app support"],
  alternates: { canonical: "https://lifeadminofficial.com/contact" },
  openGraph: {
    title: "Contact Us | Life Admin",
    description: "Get in touch with the Life Admin team. We respond within one business day.",
    url: "https://lifeadminofficial.com/contact",
    siteName: "Life Admin",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
