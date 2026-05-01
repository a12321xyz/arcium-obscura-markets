import Link from "next/link";
import { ArrowUpRight, Clock, LockKeyhole, Radar, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Market } from "@/lib/types";
import { formatDateTime, formatLamports } from "@/lib/utils";

export function MarketCard({ market }: { market: Market }) {
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
              market.status === "Resolving" ? "bg-yellow-500/20 text-yellow-400" :
              market.status === "Cancelled" ? "bg-red-500/20 text-red-400" :
              market.status === "Initializing" ? "bg-blue-500/20 text-blue-400" :
              "bg-white/10 text-muted-foreground"
            }`}>
              {market.status}
            </Badge>
          </div>
          <LockKeyhole className="h-5 w-5 text-primary/40 transition-colors group-hover:text-primary" />
        </div>

        <h3 className="min-h-[4.5rem] text-2xl font-black leading-tight tracking-tight decoration-primary/30 group-hover:underline underline-offset-4">
          {market.question}
        </h3>

        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/5 p-3 text-[10px] font-bold uppercase tracking-widest text-primary">
            <LockKeyhole className="h-3 w-3" /> Encrypted Arcium Pools
          </div>
          {market.outcomes.map((outcome) => (
            <div key={outcome} className="relative flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground/80">{outcome}</span>
              <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" />
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-3 gap-2">
          {[
            { label: "Staked", value: formatLamports(Number(market.publicPoolLamports)), icon: Radar },
            { label: "Ends", value: formatDateTime(market.endTime).split(',')[0], icon: Clock },
            { label: "Status", value: market.status, icon: ShieldCheck }
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
