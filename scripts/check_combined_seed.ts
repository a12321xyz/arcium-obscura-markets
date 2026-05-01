import { PublicKey } from "@solana/web3.js";

const ARCIUM_PROGRAM_ID = new PublicKey("Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ");
const MY_PROGRAM_ID = new PublicKey("7R6y8MzZvWb8MuPcb6g12gnC6QLFoFs4MZzvQ3Nm2Ddt");
const TARGET = "3QEZbKq3ZJxWWQo5rcLhGS2N4NgBFREshxmiiWdhEDZz";

const [addr] = PublicKey.findProgramAddressSync([Buffer.from("ArciumSignerAccount"), MY_PROGRAM_ID.toBuffer()], ARCIUM_PROGRAM_ID);
console.log("Result:", addr.toBase58());
if (addr.toBase58() === TARGET) {
    console.log("MATCH!");
} else {
    console.log("NO MATCH");
}
