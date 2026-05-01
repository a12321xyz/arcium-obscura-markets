
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";
import { getCompDefAccAddress, getClusterAccAddress } from "@arcium-hq/client";

async function main() {
    const programId = new PublicKey("7R6y8MzZvWb8MuPcb6g12gnC6QLFoFs4MZzvQ3Nm2Ddt");
    // "init_market_state" offset.
    // comp_def_offset macro uses keccak256(name)[..4] as u32 LE.
    const name = "init_market_state";
    const hash = anchor.utils.sha256.hash(name); // Wait, Arcium uses Keccak256
    const keccakHash = anchor.crypto.keccak256(Buffer.from(name));
    const h = keccakHash;
    const offsetLE = h.readUInt32LE(0);
    
    console.log(`Name: ${name}`);
    console.log(`Hash: ${hash}`);
    console.log(`Offset (LE): ${offsetLE}`);
    
    const compDefAcc = getCompDefAccAddress(programId, offsetLE);
    console.log(`Comp Def Acc: ${compDefAcc.toBase58()}`);
    
    const connection = new Connection("https://api.devnet.solana.com");
    const accInfo = await connection.getAccountInfo(compDefAcc);
    if (accInfo) {
        console.log("Account exists!");
    } else {
        console.log("Account DOES NOT exist!");
    }
}

main().catch(console.error);
