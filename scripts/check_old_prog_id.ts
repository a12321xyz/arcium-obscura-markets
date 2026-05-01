import { PublicKey } from "@solana/web3.js";

const TARGET = "3QEZbKq3ZJxWWQo5rcLhGS2N4NgBFREshxmiiWdhEDZz";
const PROG_ID = new PublicKey("5ReKPSDBcvh8M5nyhVBJsNxdAzC6LfJ5R6wjuApjgLhQ");

const [addr] = PublicKey.findProgramAddressSync([Buffer.from("ArciumSignerAccount")], PROG_ID);
console.log("Result:", addr.toBase58());
if (addr.toBase58() === TARGET) {
    console.log("MATCH!");
} else {
    console.log("NO MATCH");
}
