import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up Free  -  Life Admin",
  description: "Create your free Life Admin account. No credit card required. Start tracking subscriptions, bills, and expenses in 60 seconds.",
  openGraph: {
    title: "Sign Up Free  -  Life Admin",
    description: "No credit card required. Start tracking subscriptions, bills, and expenses in 60 seconds.",
    url: "https://lifeadminofficial.com/signup",
    siteName: "Life Admin",
  },
  alternates: {
    canonical: "https://lifeadminofficial.com/signup",
  },
  robots: {
    index: false,
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
