import * as anchor from "@coral-xyz/anchor";
import { getArciumProgram, getCompDefAccAddress, getCompDefAccOffset } from "@arcium-hq/client";
import { PublicKey } from "@solana/web3.js";

async function main() {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const programId = new PublicKey("4Bong499epakUpBjRxnfjouWnmXg718yu2KpJeRQv9yZ");
  const arciumProgram = getArciumProgram(provider);

  const circuit = "init_m8";
  const offset = getCompDefAccOffset(circuit);
  const compDefAccount = getCompDefAccAddress(programId, Buffer.from(offset).readUInt32LE());
  
  try {
    const compDef = await arciumProgram.account.computationDefinitionAccount.fetch(compDefAccount);
    console.log(`Circuit: ${circuit}`);
    console.log(`Address: ${compDefAccount.toBase58()}`);
    console.log(`Status: ${compDef.isCompleted ? "Completed" : "Incomplete"}`);
  } catch (e) {
    console.log(`Error fetching ${circuit}: ${e}`);
  }
}

main();
