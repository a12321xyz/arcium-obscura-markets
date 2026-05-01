import type { Metadata } from "next";
import "./globals.css";
import dynamic from "next/dynamic";
import { Header } from "@/components/header";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Arcium Obscura Markets",
  description: "Private prediction and opinion markets powered by Arcium Obscura on Solana."
};

const WalletContextProvider = dynamic(
  () => import("@/components/wallet-context-provider").then((m) => ({ default: m.WalletContextProvider })),
  { ssr: false }
);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <WalletContextProvider>
          <Header />
          <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </WalletContextProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
