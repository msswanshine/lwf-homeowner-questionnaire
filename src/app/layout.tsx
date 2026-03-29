import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/layout/SiteHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FireWise Landscape Planner",
  description:
    "Pacific Northwest homeowner MVP — questionnaire, plant recommendations, and phased action plan using the Living with Fire catalog.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)] antialiased">
        <SiteHeader />
        <main className="min-h-[calc(100vh-5rem)]">{children}</main>
        <footer className="print:hidden border-t border-black/10 bg-[var(--surface)] px-4 py-8 text-center text-xs text-[var(--muted)]">
          Data © Living with Fire API. Use alongside local fire authority guidance.
        </footer>
      </body>
    </html>
  );
}
