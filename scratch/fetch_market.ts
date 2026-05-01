
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

async function main() {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.ArciumObscuraMarkets as any;
  const marketPda = new PublicKey("2anUEm8RZWsbDdczkjzZLyoKzWJDRoWQhnQcztYiQJhr");
  const marketAcc = await program.account.market.fetch(marketPda);
  console.log("Market Status:", JSON.stringify(marketAcc.status));
  console.log("Market ID:", marketAcc.marketId.toString());
}

main().catch(console.error);
