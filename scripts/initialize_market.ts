import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { randomBytes } from "crypto";
import * as fs from "fs";
import {
  awaitComputationFinalization,
  getArciumAccountBaseSeed,
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
  uploadCircuit,
} from "@arcium-hq/client";

async function main() {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  
  const program = anchor.workspace.ArciumObscuraMarkets as any;
  const arciumProgram = getArciumProgram(provider);
  const arciumEnv = getArciumEnv();
  const clusterAccount = getClusterAccAddress(arciumEnv.arciumClusterOffset);

  console.log("Ensuring circuits are registered and uploaded...");
  for (const circuit of ["init_m8", "place_bet", "resolve_prediction_market", "resolve_opinion_market"]) {
    const baseSeed = getArciumAccountBaseSeed("ComputationDefinitionAccount");
    const offset = getCompDefAccOffset(circuit);
    const compDefAccount = PublicKey.findProgramAddressSync(
      [baseSeed, program.programId.toBuffer(), offset],
      new PublicKey("Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ")
    )[0];
    
    const mxeAccount = getMXEAccAddress(program.programId);
    const mxeAcc = await arciumProgram.account.mxeAccount.fetch(mxeAccount);
    const addressLookupTable = getLookupTableAddress(program.programId, mxeAcc.lutOffsetSlot);

    const methodByCircuit: Record<string, string> = {
      init_m8: "initM8CompDef",
      place_bet: "initPlaceBetCompDef",
      resolve_prediction_market: "initResolvePredictionMarketCompDef",
      resolve_opinion_market: "initResolveOpinionMarketCompDef",
    };

    try {
      console.log(`Registering ${circuit}...`);
      await (program.methods as any)[methodByCircuit[circuit]]()
        .accounts({ 
          payer: provider.wallet.publicKey, 
          mxeAccount, 
          compDefAccount, 
          addressLookupTable,
          arciumProgram: new PublicKey("Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ"),
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc({ commitment: "confirmed" });
    } catch (e) {
      console.log(`Circuit ${circuit} already registered or registration error: ${e}`);
    }

    try {
      const rawCircuit = fs.readFileSync(`build/${circuit}.arcis`);
      console.log(`Uploading ${circuit}...`);
      await uploadCircuit(provider, circuit, program.programId, rawCircuit, true);
      console.log(`Uploaded ${circuit}`);
    } catch (e) {
      console.log(`Circuit ${circuit} upload error or already finalized: ${e}`);
    }
  }

  console.log("Creating test market on devnet...");
  const marketId = new anchor.BN(Date.now());
  const [market] = PublicKey.findProgramAddressSync(
    [Buffer.from("market"), provider.wallet.publicKey.toBuffer(), marketId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  const [vault] = PublicKey.findProgramAddressSync([Buffer.from("vault"), market.toBuffer()], program.programId);
  const [signPda] = PublicKey.findProgramAddressSync([Buffer.from("ArciumSignerAccount")], program.programId);
  
  const createOffset = new anchor.BN(randomBytes(8), "le");

  const txBuilder = program.methods
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
      signPdaAccount: signPda,
      mxeAccount: getMXEAccAddress(program.programId),
      mempoolAccount: getMempoolAccAddress(arciumEnv.arciumClusterOffset),
      executingPool: getExecutingPoolAccAddress(arciumEnv.arciumClusterOffset),
      computationAccount: getComputationAccAddress(arciumEnv.arciumClusterOffset, createOffset),
      compDefAccount: getCompDefAccAddress(
        program.programId,
        Buffer.from(getCompDefAccOffset("init_m8")).readUInt32LE()
      ),
      clusterAccount,
    });

  const tx = await txBuilder.rpc({ commitment: "confirmed" });
  console.log(`Market initialized! TX: ${tx}`);
  console.log(`Market PDA: ${market.toBase58()}`);

  console.log("Waiting for Arcium finalization...");
  await awaitComputationFinalization(provider, createOffset, program.programId, "confirmed");
  console.log("Market state initialized on-chain!");
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
