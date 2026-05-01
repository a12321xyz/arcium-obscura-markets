import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getCompDefAccAddress, getCompDefAccOffset } from "@arcium-hq/client";

async function main() {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const programId = new PublicKey("7R6y8MzZvWb8MuPcb6g12gnC6QLFoFs4MZzvQ3Nm2Ddt");
  const arciumProgramId = new PublicKey("Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ");

  const circuits = ["init_market_state", "place_bet", "resolve_prediction_market", "resolve_opinion_market"];

  for (const circuit of circuits) {
    const offset = getCompDefAccOffset(circuit);
    const addr = getCompDefAccAddress(programId, Buffer.from(offset).readUInt32LE());
    console.log(`Checking ${circuit} at ${addr.toBase58()}...`);
    
    try {
        const acc = await provider.connection.getAccountInfo(addr);
        if (!acc) {
            console.log(`  NOT FOUND`);
            continue;
        }
        console.log(`  Found! Size: ${acc.data.length}`);
        // We could decode it if we had the Arcium IDL in Anchor, but we can just check if it's initialized.
    } catch (e) {
        console.log(`  Error: ${e}`);
    }
  }
}

main();
