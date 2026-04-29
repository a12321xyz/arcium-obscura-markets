"use client";

import { FormEvent, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Clock, ListTree, Loader2, MessageSquare, Plus, PlusCircle, Radar, ShieldCheck, Trash2, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAnchorProvider, createMarketTx } from "@/lib/program";
import { randomComputationOffset } from "@/lib/arcium";
import { MarketKind } from "@/lib/types";

export function CreateMarketForm() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [kind, setKind] = useState<MarketKind>("Prediction");
  const [question, setQuestion] = useState("");
  const [outcomes, setOutcomes] = useState(["Yes", "No"]);
  const [endDate, setEndDate] = useState("");
  const [quorum, setQuorum] = useState("25");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!wallet.publicKey) {
      setStatus("Connect a wallet to create a market.");
      return;
    }
    const filteredOutcomes = outcomes.map((item) => item.trim()).filter(Boolean);
    if (filteredOutcomes.length < 2 || filteredOutcomes.length > 4) {
      setStatus("Markets need 2 to 4 outcomes.");
      return;
    }
    const endTime = Math.floor(new Date(endDate).getTime() / 1000);
    if (!Number.isFinite(endTime) || endTime <= Math.floor(Date.now() / 1000)) {
      setStatus("Choose a future end time.");
      return;
    }

    setLoading(true);
    setStatus("Queueing Arcium market-state initialization...");
    try {
      const provider = getAnchorProvider(connection, wallet);
      const marketId = BigInt(Date.now());
      const signature = await createMarketTx({
        provider,
        marketId,
        kind,
        question,
        outcomes: filteredOutcomes,
        endTime,
        quorum: kind === "Opinion" ? Number(quorum) : 0,
        computationOffset: randomComputationOffset()
      });
      setStatus(`Success! Market created: ${signature.slice(0, 8)}...`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to create market.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden border-white/10 bg-white/[0.02] rounded-[2rem]">
      <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-8">
        <div className="flex items-center gap-2 text-secondary mb-2">
          <PlusCircle className="h-4 w-4" />
          <span className="text-xs font-black uppercase tracking-widest">Market Forge</span>
        </div>
        <CardTitle className="text-3xl font-black">Deploy Private Market</CardTitle>
        <CardDescription className="text-base">
          Configure your prediction or opinion market. The initial state is initialized privately via Arcium.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={submit} className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {["Prediction", "Opinion"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setKind(item as MarketKind)}
                className={`relative flex flex-col rounded-[2rem] border p-6 text-left transition-all duration-300 ${
                  kind === item 
                    ? "border-primary bg-primary/10 shadow-glow-sm scale-[1.02]" 
                    : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06] grayscale opacity-70 hover:grayscale-0 hover:opacity-100"
                }`}
              >
                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${kind === item ? "bg-primary/20" : "bg-white/10"}`}>
                  {item === "Prediction" ? <Radar className="h-5 w-5 text-primary" /> : <Users className="h-5 w-5 text-secondary" />}
                </div>
                <p className="text-lg font-black">{item} Market</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item === "Prediction"
                    ? "Creator resolves the outcome based on real-world events."
                    : "Community votes privately. Quorum determines the winner."}
                </p>
                {kind === item && (
                  <div className="absolute right-4 top-4">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">
              <MessageSquare className="h-4 w-4" /> The Question
            </label>
            <Textarea 
              value={question} 
              maxLength={160} 
              onChange={(event) => setQuestion(event.target.value)} 
              placeholder="e.g., Will SOL reach $500 before end of year?" 
              className="min-h-[100px] rounded-2xl bg-white/[0.03] border-white/10 focus:border-primary/50 text-lg font-medium p-5"
              required 
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between ml-1">
              <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                <ListTree className="h-4 w-4" /> Outcomes
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-primary hover:bg-primary/10 rounded-full"
                disabled={outcomes.length >= 4}
                onClick={() => setOutcomes([...outcomes, ""])}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Slot
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {outcomes.map((outcome, index) => (
                <div key={index} className="relative group">
                  <Input
                    value={outcome}
                    maxLength={32}
                    onChange={(event) => {
                      const next = [...outcomes];
                      next[index] = event.target.value;
                      setOutcomes(next);
                    }}
                    placeholder={`Outcome ${index + 1}`}
                    className="h-12 bg-white/[0.03] border-white/10 rounded-xl pr-10"
                    required
                  />
                  {index >= 2 && (
                    <button
                      type="button"
                      onClick={() => setOutcomes(outcomes.filter((_, i) => i !== index))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">
                <Clock className="h-4 w-4" /> End Time
              </label>
              <Input 
                type="datetime-local" 
                value={endDate} 
                onChange={(event) => setEndDate(event.target.value)} 
                className="h-12 bg-white/[0.03] border-white/10 rounded-xl"
                required 
              />
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">
                <ShieldCheck className="h-4 w-4" /> Opinion Quorum
              </label>
              <Input 
                type="number" 
                min="1" 
                disabled={kind === "Prediction"} 
                value={quorum} 
                onChange={(event) => setQuorum(event.target.value)} 
                className="h-12 bg-white/[0.03] border-white/10 rounded-xl disabled:opacity-30"
              />
            </div>
          </div>

          <div className="flex gap-4 items-start rounded-[2rem] border border-primary/20 bg-primary/5 p-6">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Market creation involves a <span className="text-foreground font-bold">computation queue</span>. Arcium MXE will initialize the private pool state before any bets are accepted.
            </p>
          </div>

          <Button type="submit" size="lg" disabled={loading} className="h-16 w-full rounded-2xl font-black text-lg shadow-violet transition-all hover:scale-[1.01] active:scale-95">
            {loading ? (
              <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Finalizing Private State...</>
            ) : (
              <><Zap className="mr-2 h-6 w-6" /> Deploy Private Market</>
            )}
          </Button>
          
          {status && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="rounded-xl bg-white/[0.03] p-4 border border-white/5 font-mono text-xs break-all text-muted-foreground text-center">
                <span className="text-primary mr-2">●</span> {status}
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
