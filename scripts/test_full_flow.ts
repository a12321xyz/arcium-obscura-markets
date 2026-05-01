import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { randomBytes } from "crypto";
import {
  awaitComputationFinalization,
  getArciumEnv,
  getArciumProgram,
  getClusterAccAddress,
  getCompDefAccAddress,
  getCompDefAccOffset,
  getComputationAccAddress,
  getExecutingPoolAccAddress,
  getLookupTableAddress,
  getMempoolAccAddress,
  getMXEAccAddress,
} from "@arcium-hq/client";

async function main() {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.ArciumObscuraMarkets as any;
  const arciumProgram = getArciumProgram(provider);
  const arciumEnv = getArciumEnv();
  const clusterAccount = getClusterAccAddress(arciumEnv.arciumClusterOffset);

  console.log("--- PHASE 1: CREATE SHORT-LIVED MARKET ---");
  const marketId = new anchor.BN(Date.now());
  const [market] = PublicKey.findProgramAddressSync(
    [Buffer.from("market"), provider.wallet.publicKey.toBuffer(), marketId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  const [vault] = PublicKey.findProgramAddressSync([Buffer.from("vault"), market.toBuffer()], program.programId);
  const [signPda] = PublicKey.findProgramAddressSync([Buffer.from("ArciumSignerAccount")], program.programId);
  const createOffset = new anchor.BN(randomBytes(8), "le");
  console.log(`Create Offset: 0x${createOffset.toString("hex")}`);

  // 60 seconds duration
  const endTime = new anchor.BN(Math.floor(Date.now() / 1000) + 60);

  await program.methods
    .initializeMarket(
      createOffset,
      marketId,
      { prediction: {} },
      "Full Flow Test Market",
      ["Yes", "No"],
      endTime,
      0
    )
    .accountsPartial({
      creator: provider.wallet.publicKey,
      market,
      vault,
      signPdaAccount: signPda,
      mxeAccount: getMXEAccAddress(program.programId),
      mempoolAccount: getMempoolAccAddress(arciumEnv.arciumClusterOffset),
      executingPool: getExecutingPoolAccAddress(arciumEnv.arciumClusterOffset),
      computationAccount: getComputationAccAddress(arciumEnv.arciumClusterOffset, createOffset),
      compDefAccount: getCompDefAccAddress(program.programId, Buffer.from(getCompDefAccOffset("init_m8")).readUInt32LE()),
      clusterAccount,
    })
    .rpc({ commitment: "confirmed" });

  console.log(`Market Created: ${market.toBase58()}`);
  await awaitComputationFinalization(provider, createOffset, program.programId, "confirmed");
  console.log("Market State Finalized on Arcium. Waiting for Solana callback to open market...");
  
  let isOpen = false;
  for (let i = 0; i < 10; i++) {
    const marketAcc = await program.account.market.fetch(market);
    if (marketAcc.status.open) {
      isOpen = true;
      break;
    }
    console.log("  Still initializing...");
    await new Promise(r => setTimeout(r, 2000));
  }
  
  if (!isOpen) {
    throw new Error("Market failed to reach Open status");
  }
  console.log("Market is now OPEN.");

  console.log("--- PHASE 2: PLACE ENCRYPTED BET ---");
  const betId = new anchor.BN(0);
  const [bet] = PublicKey.findProgramAddressSync(
    [Buffer.from("bet"), market.toBuffer(), betId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  const betOffset = new anchor.BN(randomBytes(8), "le");
  const stake = new anchor.BN(100_000_000); // 0.1 SOL

  await program.methods
    .placeEncryptedBet(
      betOffset,
      betId,
      Array(32).fill(0), // Encrypted amount (dummy for test)
      Array(32).fill(0), // Encrypted outcome (dummy for test)
      Array(32).fill(0), // Bettor pubkey (dummy)
      new anchor.BN(0),  // Nonce
      Array(32).fill(0), // Commitment
      stake
    )
    .accountsPartial({
      bettor: provider.wallet.publicKey,
      market,
      bet,
      vault,
      signPdaAccount: signPda,
      mxeAccount: getMXEAccAddress(program.programId),
      mempoolAccount: getMempoolAccAddress(arciumEnv.arciumClusterOffset),
      executingPool: getExecutingPoolAccAddress(arciumEnv.arciumClusterOffset),
      computationAccount: getComputationAccAddress(arciumEnv.arciumClusterOffset, betOffset),
      compDefAccount: getCompDefAccAddress(program.programId, Buffer.from(getCompDefAccOffset("place_bet")).readUInt32LE()),
      clusterAccount,
    })
    .rpc({ commitment: "confirmed" });

  console.log(`Bet Placed: ${bet.toBase58()}`);
  await awaitComputationFinalization(provider, betOffset, program.programId, "confirmed");
  console.log("Bet Finalized.");

  console.log("--- PHASE 3: WAIT FOR EXPIRATION AND RESOLVE ---");
  const waitTime = endTime.toNumber() - Math.floor(Date.now() / 1000) + 5;
  if (waitTime > 0) {
    console.log(`Waiting ${waitTime}s for market to end...`);
    await new Promise(r => setTimeout(r, waitTime * 1000));
  }

  const resolveOffset = new anchor.BN(randomBytes(8), "le");
  const [resolution] = PublicKey.findProgramAddressSync(
    [Buffer.from("resolution"), market.toBuffer()],
    program.programId
  );

  await program.methods
    .resolvePredictionMarket(resolveOffset, 0) // Resolving to outcome 0
    .accountsPartial({
      resolver: provider.wallet.publicKey,
      market,
      resolution,
      signPdaAccount: signPda,
      mxeAccount: getMXEAccAddress(program.programId),
      mempoolAccount: getMempoolAccAddress(arciumEnv.arciumClusterOffset),
      executingPool: getExecutingPoolAccAddress(arciumEnv.arciumClusterOffset),
      computationAccount: getComputationAccAddress(arciumEnv.arciumClusterOffset, resolveOffset),
      compDefAccount: getCompDefAccAddress(program.programId, Buffer.from(getCompDefAccOffset("resolve_prediction_market")).readUInt32LE()),
      clusterAccount,
    })
    .rpc({ commitment: "confirmed" });

  console.log(`Market Resolved! Resolution PDA: ${resolution.toBase58()}`);
  await awaitComputationFinalization(provider, resolveOffset, program.programId, "confirmed");
  console.log("Resolution Finalized on Arcium.");
  console.log("--- FULL FLOW TEST COMPLETE ---");
}

main().catch(console.error);
