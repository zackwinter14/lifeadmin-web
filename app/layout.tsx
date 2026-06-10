import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackgroundWrapper from "@/components/BackgroundWrapper";
import PinGate from "@/components/PinGate";
import AdBanner from "@/components/AdBanner";
import BankAutoSync from "@/components/BankAutoSync";
import AutoAINotification from "@/components/AutoAINotification";
import { Analytics } from "@vercel/analytics/next";

const ADSENSE_PUBLISHER_ID = "ca-pub-1670114813056071";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Life Admin — Savings Goals, Bill Tracker & Subscription Manager",
    template: "%s | Life Admin",
  },
  description:
    "Life Admin helps you save for a house, car, vacation, or emergency fund. Set a savings goal, track your progress, and find money to save faster by cancelling forgotten subscriptions. Free to start.",
  keywords: [
    // Brand
    "Life Admin",
    "Life Admin app",
    "Life Admin finance",
    "Life Admin finance tracker",
    "lifeadminofficial",
    // Subscription tracking
    "subscription tracker",
    "subscription manager",
    "cancel subscriptions",
    "find forgotten subscriptions",
    "subscription cancellation app",
    "recurring charge tracker",
    "auto detect subscriptions",
    "subscription tracker app",
    "best subscription tracker",
    // Bill management
    "bill manager",
    "bill tracker",
    "bill organizer",
    "bill reminder app",
    "monthly bill tracker",
    "bill calendar app",
    "upcoming bills tracker",
    "bill payment tracker",
    // Budgeting
    "budget tracker",
    "budget app",
    "budgeting app",
    "personal budget tracker",
    "monthly budget planner",
    "budget planner app",
    "spending tracker",
    "50 30 20 budget app",
    "zero based budget app",
    // Finance general
    "personal finance app",
    "personal finance tracker",
    "finance manager app",
    "money manager app",
    "money tracker app",
    "financial life admin",
    "manage your finances",
    "track your finances",
    "all in one finance app",
    // Expense tracking
    "expense tracker",
    "expense manager",
    "expense tracking app",
    "daily expense tracker",
    "monthly expense tracker",
    "spending tracker app",
    "receipt scanner app",
    "AI receipt scanner",
    // Income tracking
    "income tracker",
    "income tracking app",
    "paycheck tracker",
    "track monthly income",
    // Net worth
    "net worth tracker",
    "net worth app",
    "net worth calculator",
    "track net worth",
    "assets and liabilities tracker",
    // Gas tracking
    "gas tracker app",
    "gas expense tracker",
    "fuel tracker app",
    "gas fill up tracker",
    // Savings
    "save money app",
    "savings tracker",
    "savings goal app",
    "emergency fund tracker",
    "money saving app",
    // Bank connection
    "bank sync app",
    "connect bank account app",
    "Plaid finance app",
    "automatic bank tracking",
    // Competitors / alternatives
    "Rocket Money alternative",
    "Mint alternative",
    "YNAB alternative",
    "Bobby app alternative",
    "Copilot money alternative",
    "best personal finance app 2025",
    "free budget app",
    "free subscription tracker",
    // Household / family
    "household budget app",
    "family finance tracker",
    "shared subscription tracker",
    "household expense tracker",
    // iOS / app store
    "iOS finance app",
    "iPhone budget app",
    "iPhone subscription tracker",
    "App Store finance app",
  ],
  metadataBase: new URL("https://lifeadminofficial.com"),
  alternates: {
    canonical: "https://lifeadminofficial.com",
  },
  openGraph: {
    title: "Life Admin — Save for the Things That Actually Matter",
    description:
      "Set savings goals for a house, car, vacation, or anything else. Life Admin tracks your progress, shows when you'll get there, and helps you find money to save faster.",
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
        <meta name="google-adsense-account" content="ca-pub-1670114813056071" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "SoftwareApplication",
                "name": "Life Admin",
                "url": "https://lifeadminofficial.com",
                "description": "Life Admin tracks subscriptions, bills, expenses, income, gas, and net worth. Connect your bank to auto-detect every recurring charge and cancel forgotten subscriptions.",
                "applicationCategory": "FinanceApplication",
                "operatingSystem": "iOS, Web",
                "offers": [
                  { "@type": "Offer", "price": "0", "priceCurrency": "USD", "name": "Free" },
                  { "@type": "Offer", "price": "6.99", "priceCurrency": "USD", "name": "Pro Monthly" },
                  { "@type": "Offer", "price": "49.99", "priceCurrency": "USD", "name": "Pro Yearly" }
                ],
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "4.8",
                  "ratingCount": "500",
                  "bestRating": "5"
                },
                "screenshot": "https://lifeadminofficial.com/opengraph-image",
                "featureList": [
                  "Auto-detect subscriptions via bank connection",
                  "Cancel forgotten subscriptions",
                  "Bill calendar and reminders",
                  "Income tracking",
                  "Net worth tracker",
                  "Gas expense tracker",
                  "AI receipt scanning",
                  "Household sharing",
                  "Bill negotiation scripts",
                  "Budget goals"
                ]
              },
              {
                "@type": "Organization",
                "name": "Life Admin",
                "url": "https://lifeadminofficial.com",
                "logo": "https://lifeadminofficial.com/icon.png",
                "sameAs": []
              },
              {
                "@type": "WebSite",
                "url": "https://lifeadminofficial.com",
                "name": "Life Admin",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://lifeadminofficial.com/tools?q={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              }
            ]
          })}}
        />
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
        <Analytics />
      </body>
    </html>
  );
}
