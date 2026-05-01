import { PublicKey } from "@solana/web3.js";

const ARCIUM_PROGRAM_ID = new PublicKey("Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ");
const MY_PROGRAM_ID = new PublicKey("7R6y8MzZvWb8MuPcb6g12gnC6QLFoFs4MZzvQ3Nm2Ddt");
const TARGET = "3QEZbKq3ZJxWWQo5rcLhGS2N4NgBFREshxmiiWdhEDZz";

const SEEDS = ["ArciumSignerAccount", "ArciumSigner", "SignerAccount", "arcium_sign_seed"];

for (const seed of SEEDS) {
    const [addr] = PublicKey.findProgramAddressSync([Buffer.from(seed), MY_PROGRAM_ID.toBuffer()], ARCIUM_PROGRAM_ID);
    if (addr.toBase58() === TARGET) {
        console.log("FOUND! Seed:", seed, "Base: MY_PROGRAM_ID, Owner: ARCIUM_PROGRAM_ID");
    }
}
