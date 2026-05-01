import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

async function main() {
  const marketAddress = process.argv[2];
  if (!marketAddress) {
    console.error("Usage: npx ts-node scripts/force_open_market.ts <MARKET_PDA>");
    process.exit(1);
  }

  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.ArciumObscuraMarkets as any;
  const marketKey = new PublicKey(marketAddress);

  const market = await program.account.market.fetch(marketKey);
  console.log("Market status:", Object.keys(market.status)[0]);
  console.log("Market creator:", market.creator.toBase58());
  console.log("Your wallet:", provider.wallet.publicKey.toBase58());

  if (Object.keys(market.status)[0] !== "initializing") {
    console.log("Market is not in Initializing state. No action needed.");
    return;
  }

  if (market.creator.toBase58() !== provider.wallet.publicKey.toBase58()) {
    console.error("Only the market creator can force-open.");
    process.exit(1);
  }

  console.log("Force-opening market...");
  const tx = await program.methods
    .forceOpenMarket()
    .accounts({
      creator: provider.wallet.publicKey,
      market: marketKey,
    })
    .rpc({ commitment: "confirmed" });

  console.log("Market force-opened! TX:", tx);

  const updated = await program.account.market.fetch(marketKey);
  console.log("New status:", Object.keys(updated.status)[0]);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
