import { PublicKey } from "@solana/web3.js";

const programId = new PublicKey("7R6y8MzZvWb8MuPcb6g12gnC6QLFoFs4MZzvQ3Nm2Ddt");
const TARGET = "3QEZbKq3ZJxWWQo5rcLhGS2N4NgBFREshxmiiWdhEDZz";

const commonWords = [
    "ArciumSignerAccount",
    "ArciumSigner",
    "ArciumSign",
    "SignerAccount",
    "Signer",
    "Sign",
    "ArciumSignerPDA",
    "ArciumSignerAcc",
    "SignerPDA",
    "SignerAcc"
];

for (const word of commonWords) {
    const [addr] = PublicKey.findProgramAddressSync([Buffer.from(word)], programId);
    if (addr.toBase58() === TARGET) {
        console.log("FOUND SEED:", word);
        process.exit(0);
    }
    // Also try lowercase
    const [addr2] = PublicKey.findProgramAddressSync([Buffer.from(word.toLowerCase())], programId);
    if (addr2.toBase58() === TARGET) {
        console.log("FOUND SEED:", word.toLowerCase());
        process.exit(0);
    }
}

// Try ArciumSignerAccount without "Account"
// Wait, I already did "ArciumSigner"

console.log("NOT FOUND");
