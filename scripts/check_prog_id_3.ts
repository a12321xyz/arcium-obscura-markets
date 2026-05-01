import { PublicKey } from "@solana/web3.js";

const TARGET = "3QEZbKq3ZJxWWQo5rcLhGS2N4NgBFREshxmiiWdhEDZz";
const PROG_ID = new PublicKey("29bVaakfeBhFm8BbqkehH3iMxHvRYwZ9QHecsi4kJ7on");

const [addr] = PublicKey.findProgramAddressSync([Buffer.from("ArciumSignerAccount")], PROG_ID);
console.log("Result:", addr.toBase58());
if (addr.toBase58() === TARGET) {
    console.log("MATCH!");
} else {
    console.log("NO MATCH");
}
