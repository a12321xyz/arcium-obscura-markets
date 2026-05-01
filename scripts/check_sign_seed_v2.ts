import { PublicKey } from "@solana/web3.js";

const programId = new PublicKey("7R6y8MzZvWb8MuPcb6g12gnC6QLFoFs4MZzvQ3Nm2Ddt");
const [addr] = PublicKey.findProgramAddressSync([Buffer.from("arcium_sign_seed")], programId);
console.log("arcium_sign_seed:", addr.toBase58());
