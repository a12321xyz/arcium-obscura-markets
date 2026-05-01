"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ArrowRight, LockKeyhole, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketCard } from "@/components/market-card";
import { PrivacyPanel } from "@/components/privacy-panel";
import { TechSection } from "@/components/tech-section";
import { fetchMarkets } from "@/lib/program";
import { Market } from "@/lib/types";

export default function HomePage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey } = wallet;
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchMarkets(connection, wallet)
      .then((items) => {
        if (active) setMarkets(items);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [connection, publicKey]);

  return (
    <div className="space-y-16 pb-20">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] p-6 shadow-glow sm:p-10 lg:p-14">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-primary/15 blur-[100px]" />
        <div className="absolute bottom-0 right-28 h-96 w-96 rounded-full bg-secondary/15 blur-[100px]" />
        <div className="relative max-w-3xl">
          <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider border-white/10">
            Developer OFFCHAIN RTG submission
          </Badge>
          <h1 className="text-5xl font-black tracking-tight sm:text-7xl leading-[1.1]">
            The crowd can move <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">in the dark.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-xl leading-8 text-muted-foreground">
            Prediction and opinion markets powered by Arcium Obscura. Bets are encrypted client-side, processed in private, and settled on Solana.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="h-14 px-8 text-lg font-bold rounded-2xl shadow-violet transition-transform hover:scale-105 active:scale-95">
              <Link href="/create">Create Private Market <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-2xl border-white/10 bg-white/5 hover:bg-white/10">
              <a href="https://rtg.arcium.com" target="_blank" rel="noreferrer">View RTG Specs</a>
            </Button>
          </div>
        </div>
      </section>

      <PrivacyPanel />

      <TechSection />

      <section id="markets">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
              <Radar className="h-4 w-4" /> Live encrypted markets
            </div>
            <h2 className="mt-3 text-4xl font-black tracking-tight">Active Market Board</h2>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-2 text-sm text-muted-foreground">
            <LockKeyhole className="h-4 w-4 text-primary" /> Individual bets are never shown publicly.
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-[420px] animate-pulse rounded-[2rem] bg-white/[0.03] border border-white/5" />
            ))}
          </div>
        ) : markets.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {markets.map((market) => <MarketCard key={market.address} market={market} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/10 py-20 text-center">
            <div className="mb-6 rounded-full bg-white/5 p-6">
              <Radar className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold">No active markets found</h3>
            <p className="mt-2 text-muted-foreground">Be the first to create a private market on Arcium!</p>
            <Button asChild className="mt-8 rounded-2xl" variant="secondary">
              <Link href="/create">Create Market</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
