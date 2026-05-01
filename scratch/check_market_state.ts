import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

async function main() {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.ArciumObscuraMarkets as any;
  const marketAddr = new PublicKey("AFe4e4WxPeRB5b2UE6y2QvdsjrHV2jeiKP7QMfDG2sCF");

  try {
    const marketAcc = await program.account.market.fetch(marketAddr);
    console.log("Market Status:", JSON.stringify(marketAcc.status));
    console.log("Market Creator:", marketAcc.creator.toBase58());
    console.log("Market ID:", marketAcc.marketId.toString());
  } catch (e) {
    console.log("Error fetching market:", e);
  }
}

main();
