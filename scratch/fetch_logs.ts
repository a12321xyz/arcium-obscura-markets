
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const programId = new PublicKey("7R6y8MzZvWb8MuPcb6g12gnC6QLFoFs4MZzvQ3Nm2Ddt");
  const signatures = await connection.getSignaturesForAddress(programId, { limit: 20 });
  
  for (const sig of signatures) {
    console.log("Transaction:", sig.signature);
    const tx = await connection.getTransaction(sig.signature, { maxSupportedTransactionVersion: 0 });
    if (tx && tx.meta && tx.meta.logMessages) {
      console.log("Logs:", tx.meta.logMessages.join("\n"));
    }
    console.log("---");
  }
}

main().catch(console.error);
