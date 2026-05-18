import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackgroundWrapper from "@/components/BackgroundWrapper";
import PinGate from "@/components/PinGate";
import AdBanner from "@/components/AdBanner";
import BankAutoSync from "@/components/BankAutoSync";
import AutoAINotification from "@/components/AutoAINotification";

const ADSENSE_PUBLISHER_ID = "ca-pub-5151835818661965";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Life Admin — Track Bills, Cancel Subscriptions, Save Money",
    template: "%s | Life Admin",
  },
  description:
    "Life Admin connects to your bank, finds every subscription you forgot you had, and helps you cancel them in one tap. Track bills, income, gas, and net worth. Save $240+/month on average.",
  keywords: [
    "subscription tracker",
    "bill manager",
    "cancel subscriptions",
    "personal finance app",
    "save money app",
    "budget tracker",
    "expense tracker",
    "net worth tracker",
    "Life Admin",
    "Rocket Money alternative",
  ],
  metadataBase: new URL("https://lifeadminofficial.com"),
  alternates: {
    canonical: "https://lifeadminofficial.com",
  },
  openGraph: {
    title: "Life Admin — Stop Bleeding Money on Forgotten Subscriptions",
    description:
      "Find every recurring charge in your bank account. Cancel what you don't use. Track bills, income, gas, and net worth. Save $240+/month on average.",
    url: "https://lifeadminofficial.com",
    siteName: "Life Admin",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Life Admin — Track Bills, Cancel Subscriptions, Save Money",
    description: "Find every recurring charge in your bank. Cancel what you don't use. Save $240+/month.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Apply saved theme before paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('app_theme') || 'forest';
            document.documentElement.setAttribute('data-theme', t);
          } catch(e) {}
        ` }} />
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`}
          crossOrigin="anonymous"
        />
      </head>
      <body className="relative">
        <BackgroundWrapper />
        <PinGate>
          <BankAutoSync />
          <AutoAINotification />
          <Navbar />
          <AdBanner position="mid" />
          <main className="min-h-screen">{children}</main>
          <AdBanner position="bottom" />
          <Footer />
        </PinGate>
      </body>
    </html>
  );
}
