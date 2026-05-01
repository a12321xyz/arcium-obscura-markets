
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const mxeAccount = new PublicKey("G1ifpsVd4a6ypt5BBMAnmPYniRNEyrsb9ag68GyGmAAC");
  const acc = await connection.getAccountInfo(mxeAccount);
  if (!acc) return;
  
  // MXEAccount starts with 8 bytes discriminator.
  // Then option<u32> for cluster.
  // Option<u32> is 1 byte for presence + 4 bytes for value.
  const data = acc.data;
  console.log("Presence byte:", data[8]);
  if (data[8] === 1) {
    console.log("Cluster value:", data.readUInt32LE(9));
  }
}

main().catch(console.error);
