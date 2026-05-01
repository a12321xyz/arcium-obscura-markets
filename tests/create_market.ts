import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
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

describe("Create Market", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.ArciumObscuraMarkets as Program<any>;
  const arciumEnv = getArciumEnv();
  const clusterAccount = getClusterAccAddress(arciumEnv.arciumClusterOffset);

  it("creates a test market on devnet", async () => {
    console.log("Creating test market on devnet...");
    
    const marketId = new anchor.BN(Date.now());
    const [market] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), provider.wallet.publicKey.toBuffer(), marketId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [vault] = PublicKey.findProgramAddressSync([Buffer.from("vault"), market.toBuffer()], program.programId);
    
    const createOffset = new anchor.BN(randomBytes(8), "le");

    function arciumAccounts(computationOffset: anchor.BN, circuit: string) {
      return {
        computationAccount: getComputationAccAddress(arciumEnv.arciumClusterOffset, computationOffset),
        clusterAccount,
        mxeAccount: getMXEAccAddress(program.programId),
        mempoolAccount: getMempoolAccAddress(arciumEnv.arciumClusterOffset),
        executingPool: getExecutingPoolAccAddress(arciumEnv.arciumClusterOffset),
        compDefAccount: getCompDefAccAddress(
          program.programId,
          Buffer.from(getCompDefAccOffset(circuit)).readUInt32LE()
        ),
      };
    }

    const tx = await program.methods
      .initializeMarket(
        createOffset,
        marketId,
        { prediction: {} },
        "Will Arcium Obscura Markets revolutionize private betting?",
        ["Definitely", "Maybe", "Unlikely"],
        new anchor.BN(Math.floor(Date.now() / 1000) + 86400 * 7), // 7 days from now
        0
      )
      .accountsPartial({
        creator: provider.wallet.publicKey,
        market,
        vault,
        systemProgram: SystemProgram.programId,
        ...arciumAccounts(createOffset, "init_market_state"),
      })
      .rpc({ skipPreflight: true, commitment: "confirmed" });

    console.log("Transaction submitted:", tx);
    console.log("Market PDA:", market.toBase58());
    console.log("Waiting for Arcium finalization...");
    
    await awaitComputationFinalization(provider, createOffset, program.programId, "confirmed");
    console.log("Market successfully initialized on Arcium!");
  });
});
