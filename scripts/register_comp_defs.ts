import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  getArciumAccountBaseSeed,
  getArciumProgram,
  getCompDefAccOffset,
  getMXEAccAddress,
  getLookupTableAddress,
  uploadCircuit,
} from "@arcium-hq/client";
import * as fs from "fs";
import * as path from "path";

async function main() {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  
  const program = anchor.workspace.ArciumObscuraMarkets as any;
  const arciumProgram = getArciumProgram(provider);

  console.log("Available methods:", Object.keys(program.methods));
  console.log("Registering computation definitions...");
  for (const circuit of ["init_m8"]) {
    try {
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

      console.log(`Registering ${circuit}...`);
      const info = await provider.connection.getAccountInfo(compDefAccount);
      if (info) {
        console.log(`${circuit} already registered.`);
      } else {
        await (program.methods as any)[methodByCircuit[circuit]]()
          .accounts({ 
            payer: provider.wallet.publicKey, 
            mxeAccount, 
            compDefAccount, 
            addressLookupTable,
          } as any)
          .rpc({ commitment: "confirmed" });
        console.log(`Registered ${circuit}`);
      }

      // Upload bytecode if available
      const arcisPath = path.join(process.cwd(), "build", `${circuit}.arcis`);
      if (fs.existsSync(arcisPath)) {
        console.log(`Uploading bytecode for ${circuit}...`);
        const bytecode = fs.readFileSync(arcisPath);
        await uploadCircuit(provider, circuit, program.programId, new Uint8Array(bytecode));
        console.log(`Uploaded and finalized ${circuit}`);
      }
    } catch (e) {
      console.log(`Error registering ${circuit}: ${e}`);
    }
  }
}

main().catch(console.error);
