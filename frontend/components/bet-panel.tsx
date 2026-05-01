"use client";

import { FormEvent, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Loader2, LockKeyhole, Save, Shield, ShieldAlert, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { encryptBetPayload, randomComputationOffset } from "@/lib/arcium";
import { bytesToHex } from "@/lib/commitment";
import { getAnchorProvider, deriveBetPda, placeBetTx } from "@/lib/program";
import { saveLocalBetReceipt } from "@/lib/storage";
import { Market } from "@/lib/types";

export function BetPanel({ market }: { market: Market }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [outcome, setOutcome] = useState(0);
  const [amountSol, setAmountSol] = useState("0.1");
  const [maxStakeSol, setMaxStakeSol] = useState("0.1");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"IDLE" | "PREPARING" | "ENCRYPTING" | "SUBMITTING" | "PROCESSING_MPC">("IDLE");

  const nextBetId = market.nextBetId;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!wallet.publicKey) {
      setStatus("Connect a wallet before placing a private bet.");
      return;
    }
    if (market.address.startsWith("Demo")) {
      setStatus("Demo market selected. Deploy the program and open a real market address to submit transactions.");
      return;
    }

    if (isNaN(Number(amountSol)) || isNaN(Number(maxStakeSol))) {
      setStatus("Please enter valid numeric amounts.");
      return;
    }
    const amountLamports = BigInt(Math.floor(Number(amountSol) * 1_000_000_000));
    const maxStakeLamports = BigInt(Math.floor(Number(maxStakeSol) * 1_000_000_000));
    if (amountLamports <= 0n || maxStakeLamports < amountLamports) {
      setStatus("Max escrow must be greater than or equal to the encrypted amount.");
      return;
    }

    setLoading(true);
    setStep("PREPARING");
    setStatus(null);
    
    try {
      const provider = getAnchorProvider(connection, wallet);
      const marketKey = new PublicKey(market.address);
      
      setStep("ENCRYPTING");
      const payload = await encryptBetPayload({
        provider,
        market: marketKey,
        bettor: wallet.publicKey,
        betId: nextBetId,
        amountLamports,
        outcome
      });
      
      const [bet] = deriveBetPda(marketKey, nextBetId);
      
      setStep("SUBMITTING");
      const signature = await placeBetTx({
        provider,
        market: marketKey,
        betId: nextBetId,
        encryptedAmount: payload.encryptedAmount,
        encryptedOutcome: payload.encryptedOutcome,
        encryptionPubkey: payload.encryptionPubkey,
        nonce: payload.nonce,
        commitment: payload.commitment,
        maxStakeLamports,
        computationOffset: randomComputationOffset()
      });

      saveLocalBetReceipt({
        market: market.address,
        bet: bet.toBase58(),
        bettor: wallet.publicKey.toBase58(),
        betId: nextBetId.toString(),
        amountLamports: amountLamports.toString(),
        maxStakeLamports: maxStakeLamports.toString(),
        outcome,
        saltHex: bytesToHex(payload.salt),
        commitmentHex: bytesToHex(payload.commitment),
        createdAt: Date.now(),
        signature
      });
      
      setStep("PROCESSING_MPC");
      setStatus(`Success! Your bet is on-chain. The Arcium MPC cluster is now finalizing the aggregate pools.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to place encrypted bet.");
      setStep("IDLE");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden border-white/10 bg-white/[0.02] rounded-[2rem]">
      <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-6">
        <div className="flex items-center gap-2 text-primary mb-2">
          <LockKeyhole className="h-4 w-4" />
          <span className="text-xs font-black uppercase tracking-widest">Secure Betting Zone</span>
        </div>
        <CardTitle className="text-2xl font-black">Place Private Bet</CardTitle>
        <CardDescription className="text-sm">
          Your choice and amount stay encrypted in the Arcium MPC cluster until resolution.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {step !== "IDLE" && (
          <div className="mb-8 p-6 rounded-[1.5rem] border border-white/5 bg-white/[0.01]">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Transaction Progress</h4>
              {loading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
            </div>
            
            <div className="space-y-4">
              <StepItem label="Preparing Secure Context" active={step === "PREPARING"} done={["ENCRYPTING", "SUBMITTING", "PROCESSING_MPC"].includes(step)} />
              <StepItem label="Client-Side Encryption (SDK)" active={step === "ENCRYPTING"} done={["SUBMITTING", "PROCESSING_MPC"].includes(step)} />
              <StepItem label="Solana On-Chain Submission" active={step === "SUBMITTING"} done={["PROCESSING_MPC"].includes(step)} />
              <StepItem label="MPC Aggregate Computation" active={step === "PROCESSING_MPC"} done={false} pulse={step === "PROCESSING_MPC"} />
            </div>
          </div>
        )}

        <form onSubmit={submit} className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Select Outcome</p>
            <div className="grid gap-3">
              {market.outcomes.map((label, index) => (
                <button
                  type="button"
                  key={label}
                  disabled={loading}
                  onClick={() => setOutcome(index)}
                  className={`group relative flex items-center justify-between rounded-2xl border p-4 transition-all ${
                    outcome === index 
                      ? "border-primary bg-primary/10 shadow-glow-sm" 
                      : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06] disabled:opacity-50"
                  }`}
                >
                  <span className="font-bold">{label}</span>
                  {outcome === index && (
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-primary">
                      <Shield className="h-3 w-3" /> Selected
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Private Amount</span>
              <div className="relative">
                <Input type="number" min="0.000001" step="0.000001" disabled={loading} value={amountSol} onChange={(event) => setAmountSol(event.target.value)} className="h-12 bg-white/[0.03] border-white/10 rounded-xl pl-10 focus:ring-primary/20" />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50">
                  <LockKeyhole className="h-4 w-4" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Public Escrow</span>
              <div className="relative">
                <Input type="number" min="0.000001" step="0.000001" disabled={loading} value={maxStakeSol} onChange={(event) => setMaxStakeSol(event.target.value)} className="h-12 bg-white/[0.03] border-white/10 rounded-xl pl-10 focus:ring-secondary/20" />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                  <Save className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="flex items-center gap-2 font-bold text-foreground mb-2">
              <ShieldAlert className="h-3.5 w-3.5 text-accent" /> How it works
            </p>
            Your exact bet is hidden. The <span className="text-foreground">Public Escrow</span> is the maximum amount you commit. Arcium MPC verifies your stake privately. Any unused escrow is refunded on claim.
          </div>

          <Button type="submit" size="lg" disabled={loading || market.status !== "Open"} className="h-14 w-full rounded-2xl font-black shadow-violet transition-all hover:scale-[1.02] active:scale-95 disabled:hover:scale-100">
            {loading ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing Arcium...</>
            ) : (
              <><Zap className="mr-2 h-5 w-5" /> Place Encrypted Bet</>
            )}
          </Button>
          
          {status && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="rounded-xl bg-primary/5 p-4 border border-primary/10 font-mono text-[11px] break-all text-muted-foreground leading-relaxed">
                <span className="text-primary mr-2 font-black">STRIKE:</span> {status}
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function StepItem({ label, active, done, pulse }: { label: string; active: boolean; done: boolean; pulse?: boolean }) {
  return (
    <div className={`flex items-center gap-3 transition-all duration-500 ${active ? "opacity-100 translate-x-1" : done ? "opacity-50" : "opacity-30"}`}>
      <div className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-black ${
        done ? "border-primary bg-primary text-black" : 
        active ? "border-primary text-primary animate-pulse" : 
        "border-white/20"
      }`}>
        {done ? "✓" : ""}
      </div>
      <span className={`text-[11px] font-bold tracking-tight uppercase ${active ? "text-primary" : "text-foreground"}`}>
        {label}
        {pulse && <span className="ml-2 inline-flex h-1.5 w-1.5 rounded-full bg-primary animate-ping" />}
      </span>
    </div>
  );
}
