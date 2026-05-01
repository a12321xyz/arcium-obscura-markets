import * as anchor from "@coral-xyz/anchor";
import { getArciumProgram, getCompDefAccAddress, getCompDefAccOffset, uploadCircuit } from "@arcium-hq/client";
import { PublicKey } from "@solana/web3.js";
import * as fs from "fs";

async function main() {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const programId = new PublicKey("4Bong499epakUpBjRxnfjouWnmXg718yu2KpJeRQv9yZ");

  for (const circuit of ["init_m8", "place_bet", "resolve_prediction_market", "resolve_opinion_market"]) {
    console.log(`Processing ${circuit}...`);
    const rawCircuit = fs.readFileSync(`build/${circuit}.arcis`);
    try {
        // This will attempt to upload remaining chunks and finalize
        await uploadCircuit(provider, circuit, programId, rawCircuit, true);
        console.log(`Successfully finalized ${circuit}`);
    } catch (e) {
        console.log(`Note for ${circuit}: ${e}`);
    }
  }
}

main();
