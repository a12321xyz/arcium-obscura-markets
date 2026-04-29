"use client";

import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Download, Loader2, ReceiptText, ShieldAlert, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAnchorProvider, claimWinningsTx } from "@/lib/program";
import { getLocalBetReceipts, exportReceipts, importReceipts } from "@/lib/storage";
import { hexToBytes } from "@/lib/commitment";
import { LocalBetReceipt } from "@/lib/types";
import { formatLamports, truncateAddress } from "@/lib/utils";

export default function MyBetsPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [receipts, setReceipts] = useState<LocalBetReceipt[]>([]);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setReceipts(getLocalBetReceipts());
  }, []);

  async function claim(receipt: LocalBetReceipt) {
    if (!wallet.publicKey) {
      setStatus("Connect the wallet that placed the bet.");
      return;
    }
    if (receipt.market.startsWith("Demo")) {
      setStatus("Demo receipts cannot be claimed on-chain.");
      return;
    }
    setClaiming(`${receipt.market}-${receipt.betId}`);
    setStatus("Revealing your committed amount/outcome after resolution and claiming payout...");
    try {
      const provider = getAnchorProvider(connection, wallet);
      const signature = await claimWinningsTx({
        provider,
        market: new PublicKey(receipt.market),
        betId: BigInt(receipt.betId),
        amountLamports: BigInt(receipt.amountLamports),
        outcome: receipt.outcome,
        salt: hexToBytes(receipt.saltHex)
      });
      setStatus(`Claim submitted: ${signature}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to claim winnings.");
    } finally {
      setClaiming(null);
    }
  }

  function handleExport() {
    const data = exportReceipts();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arcium-obscura-receipts-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Receipts exported successfully.");
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = importReceipts(content);
      if (result.success) {
        setReceipts(getLocalBetReceipts());
        setStatus(`Successfully imported ${result.count} new receipts.`);
      } else {
        setStatus(`Import failed: ${result.error}`);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Claim Center</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">My encrypted bet receipts</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Receipts are stored in local browser storage. They hold your salt and reveal data required to prove the post-resolution claim matches the original commitment.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-white/10 bg-white/[0.02] rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-white/[0.02] border-b border-white/5">
              <CardTitle className="flex items-center gap-2"><ReceiptText className="h-5 w-5 text-primary" /> Active Receipts</CardTitle>
              <CardDescription>Revealing your salt and reveal data is required for post-resolution claims.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {receipts.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.01] py-12 text-center">
                  <ReceiptText className="h-10 w-10 text-muted-foreground/30 mb-4" />
                  <p className="text-sm text-muted-foreground">No local bet receipts yet.</p>
                </div>
              )}
              {receipts.map((receipt) => {
                const key = `${receipt.market}-${receipt.betId}`;
                return (
                  <div key={key} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 transition-all hover:bg-white/[0.05]">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div>
                        <div className="mb-3 flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Bet #{receipt.betId}</Badge>
                          <Badge variant="secondary" className="bg-white/5 border-white/10">Outcome {receipt.outcome}</Badge>
                        </div>
                        <p className="font-bold text-lg">Market {truncateAddress(receipt.market, 6)}</p>
                        <div className="mt-3 grid gap-1 text-[11px] font-mono text-muted-foreground uppercase tracking-tighter">
                          <p>Amount: {formatLamports(BigInt(receipt.amountLamports))}</p>
                          <p>Escrow: {formatLamports(BigInt(receipt.maxStakeLamports))}</p>
                          <p className="break-all opacity-60">ID: {receipt.commitmentHex.slice(0, 32)}...</p>
                        </div>
                      </div>
                      <Button onClick={() => claim(receipt)} disabled={claiming === key} className="rounded-xl h-11 px-6 font-bold shadow-violet">
                        {claiming === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                        Claim
                      </Button>
                    </div>
                  </div>
                );
              })}
              {status && (
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-xs font-mono break-all animate-in fade-in duration-500">
                   <span className="text-primary mr-2">●</span> {status}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-white/10 bg-white/[0.02] rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-white/[0.02] border-b border-white/5">
              <CardTitle className="text-lg">Backup & Restore</CardTitle>
              <CardDescription>Protect your private claim data.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 text-xs text-orange-200/70 leading-relaxed">
                  <p className="font-bold mb-1 flex items-center gap-1.5"><ShieldAlert className="h-3 w-3" /> Important Warning</p>
                  Receipts are <strong>only</strong> stored in this browser. Clearing storage or changing browsers will prevent you from claiming winnings.
                </div>
                
                <Button onClick={handleExport} variant="outline" className="w-full h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold">
                  <Download className="mr-2 h-4 w-4" /> Export JSON Backup
                </Button>

                <div className="relative">
                  <input type="file" accept=".json" onChange={handleImport} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold pointer-events-none">
                    <Upload className="mr-2 h-4 w-4" /> Import Backup
                  </Button>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Security Model</h4>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Your <span className="text-foreground">Commitment Salt</span> is never shared with Arcium or Solana until the claim phase. This ensures your bet remains private even if the MPC cluster is compromised post-computation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
