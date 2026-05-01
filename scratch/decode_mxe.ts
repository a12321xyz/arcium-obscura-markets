
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";

async function main() {
    const connection = new Connection("https://api.devnet.solana.com");
    const mxeAddress = new PublicKey("G1ifpsVd4a6ypt5BBMAnmPYniRNEyrsb9ag68GyGmAAC");
    const accInfo = await connection.getAccountInfo(mxeAddress);
    if (!accInfo) throw new Error("MXE not found");
    
    const data = accInfo.data;
    console.log("Total length:", data.length);
    
    // Discriminator (8)
    const disc = data.slice(0, 8);
    console.log("Disc:", disc.toString("hex"));
    
    // Authority (32)
    const auth = new PublicKey(data.slice(8, 40));
    console.log("Authority:", auth.toBase58());
    
    // LUT offset slot (8)
    const lutOffset = new anchor.BN(data.slice(40, 48), "le");
    console.log("LUT Offset Slot:", lutOffset.toString());
    
    // Cluster (4)
    const cluster = data.readUInt32LE(48);
    console.log("Cluster (LE):", cluster);
    
    const clusterBE = data.readUInt32BE(48);
    console.log("Cluster (BE):", clusterBE);
}

main().catch(console.error);
