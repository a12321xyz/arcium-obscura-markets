import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getArciumProgram, getMXEAccAddress } from "@arcium-hq/client";

async function main() {
    anchor.setProvider(anchor.AnchorProvider.env());
    const provider = anchor.getProvider() as anchor.AnchorProvider;
    const programId = new PublicKey("7R6y8MzZvWb8MuPcb6g12gnC6QLFoFs4MZzvQ3Nm2Ddt");
    const arciumProgram = getArciumProgram(provider);
    
    const mxeAccount = getMXEAccAddress(programId);
    console.log("MXE Account Address:", mxeAccount.toBase58());
    
    try {
        const mxeAcc = await arciumProgram.account.mxeAccount.fetch(mxeAccount);
        console.log("MXE Account Data:", JSON.stringify(mxeAcc, null, 2));
    } catch (e) {
        console.error("Failed to fetch MXE account:", e);
    }
}

main().catch(console.error);
