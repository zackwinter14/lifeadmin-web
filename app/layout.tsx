import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackgroundWrapper from "@/components/BackgroundWrapper";
import PinGate from "@/components/PinGate";

export const metadata: Metadata = {
  title: "Life Admin — Track bills. Cancel forgotten subscriptions. Save hundreds.",
  description:
    "Life Admin connects to your bank, finds every subscription you forgot you had, and helps you cancel them in one tap. Save $240+/month on average.",
  keywords: [
    "subscription tracker",
    "bill manager",
    "cancel subscriptions",
    "personal finance",
    "save money",
    "Life Admin",
  ],
  openGraph: {
    title: "Life Admin — Stop bleeding money on forgotten subscriptions",
    description:
      "Find every recurring charge in your bank account. Cancel what you don't use. Save hundreds.",
    url: "https://lifeadminofficial.com",
    siteName: "Life Admin",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="relative">
        <BackgroundWrapper />
        <PinGate>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </PinGate>
      </body>
    </html>
  );
}
