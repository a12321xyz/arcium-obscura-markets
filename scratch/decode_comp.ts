
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";

async function main() {
    const connection = new Connection("https://api.devnet.solana.com");
    const compAddress = new PublicKey("2hTfrinV8YSWKCVLrGdzsVS9n8aQrts5qsa29yFf1ZNW");
    const accInfo = await connection.getAccountInfo(compAddress);
    if (!accInfo) throw new Error("Comp not found");
    
    const data = accInfo.data;
    console.log("Total length:", data.length);
    
    // ComputationAccount (Anchor)
    // 8 (disc) + 32 (payer) + 32 (mxe_program_id) + 4 (def_offset) + 8 (fee) + 8 (slot) + 2 (slot_counter) + 1 (status)
    // + ... arguments?
    
    // Status is at offset 8+32+32+4+8+8+2 = 94.
    const status = data[94];
    console.log("Status:", status);
    
    // Arguments starts at 95.
    // ArgumentList has one field: arguments: Vec<Argument>
    // Vec has 4 bytes for len.
    const argLen = data.readUInt32LE(95);
    console.log("Arg Count:", argLen);
    
    // Each Argument has:
    // pubkey: Pubkey (32)
    // sign_seed: Option<Pubkey> (1 + 32)
    // ...
    let offset = 99;
    for (let i = 0; i < argLen; i++) {
        console.log(`Arg ${i}:`);
        const pubkey = new PublicKey(data.slice(offset, offset + 32));
        console.log("  Pubkey:", pubkey.toBase58());
        offset += 32;
        const signSeedTag = data[offset];
        console.log("  Sign Seed Tag:", signSeedTag);
        if (signSeedTag === 1) {
            const signSeed = new PublicKey(data.slice(offset + 1, offset + 33));
            console.log("  Sign Seed:", signSeed.toBase58());
            offset += 33;
        } else {
            offset += 1;
        }
        // ... skip other fields of Argument if any
    }
}

main().catch(console.error);
