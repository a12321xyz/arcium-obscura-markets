import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  getArciumProgram,
  getCompDefAccOffset,
  getMXEAccAddress,
} from "@arcium-hq/client";

async function main() {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.ArciumObscuraMarkets as any;
  const arciumProgram = getArciumProgram(provider);

  const mxeAccount = getMXEAccAddress(program.programId);
  try {
    const mxe = await arciumProgram.account.mxeAccount.fetch(mxeAccount);
    console.log(`MXE Account: ${mxeAccount.toBase58()}`);
    console.log(`  Authority: ${mxe.authority?.toBase58() || "NONE"}`);
    console.log(`  LUT Offset Slot: ${mxe.lutOffsetSlot.toString()}`);
  } catch (e) {
    console.log(`MXE Account: ${mxeAccount.toBase58()} NOT FOUND`);
  }

  const circuits = ["init_m8", "place_bet", "resolve_prediction_market", "resolve_opinion_market"];

  for (const circuit of circuits) {
    const offset = getCompDefAccOffset(circuit);
    const [compDefAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("ComputationDefinitionAccount"), program.programId.toBuffer(), offset],
      new PublicKey("Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ")
    );

    try {
      const acc = await arciumProgram.account.computationDefinitionAccount.fetch(compDefAccount);
      console.log(`Circuit: ${circuit}`);
      console.log(`  Account: ${compDefAccount.toBase58()}`);
      console.log(`  Is Completed: ${(acc.circuitSource as any).onChain[0].isCompleted}`);
      console.log(`  Bytecode Hash: ${Buffer.from((acc.circuitSource as any).onChain[0].bytecodeHash).toString("hex")}`);
    } catch (e) {
      console.log(`Circuit: ${circuit} NOT FOUND`);
    }
  }
}

main();
