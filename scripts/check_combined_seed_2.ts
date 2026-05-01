import { PublicKey } from "@solana/web3.js";

const ARCIUM_PROGRAM_ID = new PublicKey("Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ");
const MXE_ACCOUNT = new PublicKey("G1ifpsVd4a6ypt5BBMAnmPYniRNEyrsb9ag68GyGmAAC");
const TARGET = "3QEZbKq3ZJxWWQo5rcLhGS2N4NgBFREshxmiiWdhEDZz";

const [addr] = PublicKey.findProgramAddressSync([Buffer.from("ArciumSignerAccount"), MXE_ACCOUNT.toBuffer()], ARCIUM_PROGRAM_ID);
console.log("Result:", addr.toBase58());
if (addr.toBase58() === TARGET) {
    console.log("MATCH!");
} else {
    console.log("NO MATCH");
}
