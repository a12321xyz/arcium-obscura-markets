import Link from "next/link";
import { ArrowUpRight, Clock, LockKeyhole, Radar, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Market } from "@/lib/types";
import { formatDateTime, formatLamports, percent } from "@/lib/utils";

export function MarketCard({ market }: { market: Market }) {
  const total = market.publicOutcomePools.reduce((sum, value) => sum + value, 0);

  return (
    <Card className="group relative overflow-hidden rounded-[2rem] border-white/10 bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow hover:bg-white/[0.05]">
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/10 blur-3xl transition-opacity group-hover:opacity-100" />
      
      <CardContent className="p-6">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary border-primary/20">
              {market.kind}
            </Badge>
            <Badge className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider border-transparent ${
              market.status === "Open" ? "bg-green-500/20 text-green-400" : 
              market.status === "Resolved" ? "bg-primary/20 text-primary border-primary/20" :
              market.status === "Cancelled" ? "bg-red-500/20 text-red-400" :
              "bg-white/10 text-muted-foreground"
            }`}>
              {market.status === "Cancelled" ? "Refund Active" : market.status}
            </Badge>
          </div>
          <LockKeyhole className="h-5 w-5 text-primary/40 transition-colors group-hover:text-primary" />
        </div>

        <h3 className="min-h-[4.5rem] text-2xl font-black leading-tight tracking-tight decoration-primary/30 group-hover:underline underline-offset-4">
          {market.question}
        </h3>

        <div className="mt-8 space-y-4">
          {market.outcomes.map((outcome, index) => {
            const pool = market.publicOutcomePools[index] ?? 0;
            const share = total > 0 ? pool / total : 1 / market.outcomes.length;
            const percentage = percent(share);
            
            return (
              <div key={outcome} className="relative">
                <div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-foreground/80">{outcome}</span>
                  <span className="text-primary">{percentage}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/5 border border-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-1000 ease-out"
                    style={{ width: percentage }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-3 gap-2">
          {[
            { label: "Volume", value: formatLamports(market.publicPoolLamports), icon: Radar },
            { label: "Bets", value: market.acceptedBetCount, icon: Users },
            market.kind === "Opinion" 
              ? { label: "Quorum", value: `${market.acceptedBetCount}/${market.quorum}`, icon: ShieldCheck }
              : { label: "Ends", value: formatDateTime(market.endTime).split(',')[0], icon: Clock }
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white/[0.03] border border-white/5 p-3 transition-colors group-hover:bg-white/[0.06]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
              <p className="flex items-center gap-1.5 text-xs font-black truncate">
                <stat.icon className="h-3 w-3 text-primary" />
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <Button asChild className="mt-8 h-12 w-full rounded-2xl font-bold shadow-glow-sm transition-all group-hover:shadow-violet group-hover:scale-[1.02] active:scale-95">
          <Link href={`/market/${market.address}`}>
            Enter Market <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
