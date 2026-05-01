import { PublicKey } from "@solana/web3.js";

const ARCIUM_PROGRAM_ID = new PublicKey("Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ");
const MY_PROGRAM_ID = new PublicKey("7R6y8MzZvWb8MuPcb6g12gnC6QLFoFs4MZzvQ3Nm2Ddt");
const TARGET = "3QEZbKq3ZJxWWQo5rcLhGS2N4NgBFREshxmiiWdhEDZz";

const commonWords = [
    "ArciumSignerAccount", "ArciumSigner", "ArciumSign", "SignerAccount", "Signer", "Sign",
    "ArciumSignerPDA", "ArciumSignerAcc", "SignerPDA", "SignerAcc",
    "arcium_signer_account", "arcium_signer", "arcium_sign", "signer_account", "signer", "sign",
    "ArciumSignSeedAccount", "arcium_sign_seed_account", "arcium_sign_seed",
    "Mxe", "mxe", "MXE", "MxeAccount", "mxe_account", "MXEAccount"
];

for (const word of commonWords) {
    const [addr1] = PublicKey.findProgramAddressSync([Buffer.from(word)], MY_PROGRAM_ID);
    if (addr1.toBase58() === TARGET) { console.log("FOUND! Seed:", word, "Owner: MY_PROGRAM_ID"); process.exit(0); }
    
    const [addr2] = PublicKey.findProgramAddressSync([Buffer.from(word)], ARCIUM_PROGRAM_ID);
    if (addr2.toBase58() === TARGET) { console.log("FOUND! Seed:", word, "Owner: ARCIUM_PROGRAM_ID"); process.exit(0); }
    
    const [addr3] = PublicKey.findProgramAddressSync([Buffer.from(word), MY_PROGRAM_ID.toBuffer()], ARCIUM_PROGRAM_ID);
    if (addr3.toBase58() === TARGET) { console.log("FOUND! Seed:", word + " + MY_PROG", "Owner: ARCIUM_PROGRAM_ID"); process.exit(0); }
}

console.log("NOT FOUND");
