import * as anchor from "@coral-xyz/anchor";
import * as fs from "fs";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { randomBytes } from "crypto";
import {
  awaitComputationFinalization,
  getArciumEnv,
  getClusterAccAddress,
  getCompDefAccAddress,
  getCompDefAccOffset,
  getComputationAccAddress,
  getExecutingPoolAccAddress,
  getMempoolAccAddress,
  getMXEAccAddress,
} from "@arcium-hq/client";

async function main() {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  
  const idl = JSON.parse(fs.readFileSync("target/idl/arcium_obscura_markets.json", "utf8"));
  const program = new anchor.Program(idl, provider);
  const arciumEnv = getArciumEnv();
  const clusterAccount = getClusterAccAddress(arciumEnv.arciumClusterOffset);

  console.log("Program ID:", program.programId.toBase58());
  console.log("Payer:", provider.wallet.publicKey.toBase58());

  console.log("Creating test market on devnet...");
  const marketId = new anchor.BN(Date.now());
  const [market] = PublicKey.findProgramAddressSync(
    [Buffer.from("market"), provider.wallet.publicKey.toBuffer(), marketId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  const [vault] = PublicKey.findProgramAddressSync([Buffer.from("vault"), market.toBuffer()], program.programId);
  
  console.log("Market ID:", marketId.toString());
  console.log("Market PDA:", market.toBase58());
  console.log("Vault PDA:", vault.toBase58());

  const createOffset = new anchor.BN(randomBytes(8), "le");

  const tx = await program.methods
    .initializeMarket(
      createOffset,
      marketId,
      { prediction: {} },
      "Will Arcium Obscura Markets revolutionize private betting?",
      ["Definitely", "Maybe", "Unlikely"],
      new anchor.BN(Math.floor(Date.now() / 1000) + 86400 * 7),
      0
    )
    .accountsPartial({
      creator: provider.wallet.publicKey,
      market,
      vault,
      systemProgram: SystemProgram.programId,
      computationAccount: getComputationAccAddress(arciumEnv.arciumClusterOffset, createOffset),
      clusterAccount,
      mxeAccount: getMXEAccAddress(program.programId),
      mempoolAccount: getMempoolAccAddress(arciumEnv.arciumClusterOffset),
      executingPool: getExecutingPoolAccAddress(arciumEnv.arciumClusterOffset),
      compDefAccount: getCompDefAccAddress(
        program.programId,
        Buffer.from(getCompDefAccOffset("init_market_state")).readUInt32LE()
      ),
    });

  console.log("Accounts:", await tx.pubkeys());
  
  const ix = await tx.instruction();
  const transaction = new anchor.web3.Transaction().add(ix);
  
  const signature = await provider.sendAndConfirm(transaction, [], { 
    skipPreflight: true, 
    commitment: "confirmed" 
  });

  console.log("Transaction submitted:", tx);
  console.log("Market PDA:", market.toBase58());
  console.log("Waiting for Arcium finalization...");
  
  await awaitComputationFinalization(provider, createOffset, program.programId, "confirmed");
  console.log("Market successfully initialized on Arcium!");
}

main().catch(console.error);
