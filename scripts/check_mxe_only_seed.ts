import { PublicKey } from "@solana/web3.js";

const MY_PROGRAM_ID = new PublicKey("7R6y8MzZvWb8MuPcb6g12gnC6QLFoFs4MZzvQ3Nm2Ddt");
const MXE_ACCOUNT = new PublicKey("G1ifpsVd4a6ypt5BBMAnmPYniRNEyrsb9ag68GyGmAAC");
const TARGET = "3QEZbKq3ZJxWWQo5rcLhGS2N4NgBFREshxmiiWdhEDZz";

const [addr] = PublicKey.findProgramAddressSync([MXE_ACCOUNT.toBuffer()], MY_PROGRAM_ID);
console.log("Result:", addr.toBase58());
if (addr.toBase58() === TARGET) {
    console.log("MATCH!");
} else {
    console.log("NO MATCH");
}
