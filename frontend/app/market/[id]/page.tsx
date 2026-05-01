"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Clock, LockKeyhole, Radar, ShieldAlert, ShieldCheck, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BetPanel } from "@/components/bet-panel";
import { fetchMarketByAddress } from "@/lib/program";
import { Market } from "@/lib/types";
import { formatDateTime, formatLamports, percent, truncateAddress } from "@/lib/utils";

export default function MarketPage() {
  const params = useParams<{ id: string }>();
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey } = wallet;
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchMarketByAddress(connection, wallet, decodeURIComponent(params.id))
      .then((item) => {
        if (active) setMarket(item);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [connection, params.id, publicKey]);

  if (loading) return (
    <div className="space-y-6">
      <div className="h-64 animate-pulse rounded-[2.5rem] bg-white/[0.03]" />
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="h-96 animate-pulse rounded-[2rem] bg-white/[0.03]" />
        <div className="h-96 animate-pulse rounded-[2rem] bg-white/[0.03]" />
      </div>
    </div>
  );

  if (!market) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 rounded-full bg-destructive/10 p-6">
        <ShieldAlert className="h-12 w-12 text-destructive" />
      </div>
      <h3 className="text-2xl font-black">Market not found</h3>
      <p className="mt-2 text-muted-foreground">This market might have been closed or the address is invalid.</p>
    </div>
  );

  const total = market.publicOutcomePools.reduce((sum, value) => sum + Number(value), 0);

  return (
    <div className="space-y-10 pb-20">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-8 sm:p-12">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
        <div className="relative">
          <div className="mb-6 flex flex-wrap gap-3">
            <Badge className="rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider bg-primary/20 text-primary border-primary/20">
              {market.kind}
            </Badge>
            <Badge className={`rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider border-transparent ${
              market.status === "Open" ? "bg-green-500/20 text-green-400" : 
              market.status === "Resolved" ? "bg-primary/20 text-primary border-primary/20" :
              market.status === "Initializing" ? "bg-yellow-500/20 text-yellow-400" :
              "bg-white/10 text-muted-foreground"
            }`}>
              {market.status}
            </Badge>
            {market.kind === "Opinion" && (
              <Badge variant="outline" className="rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider border-white/10">
                <Users className="mr-2 h-3 w-3" /> Quorum {market.quorum}
              </Badge>
            )}
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl leading-[1.1] max-w-4xl">
            {market.question}
          </h1>
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
        <div className="space-y-10">
          <div className="grid gap-4 sm:grid-cols-4">
            <Metric icon={LockKeyhole} label="Volume" value={formatLamports(Number(market.publicPoolLamports))} />
            <Metric icon={Users} label="Participants" value={String(market.acceptedBetCount)} />
            <Metric icon={Clock} label="Closes" value={formatDateTime(market.endTime).split(',')[0]} />
            <Metric icon={Trophy} label="Verified PDA" value={truncateAddress(market.address)} />
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Radar className="h-6 w-6 text-primary" /> Encrypted Market Depth
            </h2>
            <div className="grid gap-4">
              {market.outcomes.map((outcome, index) => {
                const pool = Number(market.publicOutcomePools[index] ?? 0);
                const share = total > 0 ? pool / total : 1 / market.outcomes.length;
                const percentage = percent(share);
                
                return (
                  <div key={outcome} className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] p-6 transition-all hover:bg-white/[0.04] hover:border-primary/30">
                    <div className="relative z-10 flex items-center justify-between gap-6">
                      <div className="flex-1">
                        <p className="text-xl font-black group-hover:text-primary transition-colors">{outcome}</p>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                          Arcium MPC scales payouts from this encrypted aggregate pool.
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-foreground">{total > 0 ? percentage : "??%"}</p>
                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mt-1">
                          {total > 0 ? formatLamports(pool) : "Encrypted"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/5 border border-white/5">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-1000 ease-out ${total === 0 ? "animate-pulse w-full opacity-30" : ""}`} 
                        style={{ width: total > 0 ? percentage : "100%" }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.01] p-8 sm:p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="h-32 w-32" />
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-accent" /> Why individual bets are hidden
              </h3>
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <h4 className="font-bold mb-2">Decision Window Privacy</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Public intent leaks are the main cause of herding bias. By keeping bets encrypted in the MPC cluster, Arcium ensures that participants vote based on their own signals rather than trailing others.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold mb-2">Trustless Aggregation</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    No central party can see your bet. Arcium nodes perform the arithmetic on ciphertexts, revealing only the final payout ratios required for trustless settlement on Solana.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-32 lg:self-start">
          <BetPanel market={market} />
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] bg-white/[0.03] border border-white/5 p-5 transition-all hover:bg-white/[0.05]">
      <Icon className="mb-3 h-5 w-5 text-primary" />
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 truncate font-black text-lg">{value}</p>
    </div>
  );
}
