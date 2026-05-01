import { PublicKey } from "@solana/web3.js";

const MY_PROG = new PublicKey("7R6y8MzZvWb8MuPcb6g12gnC6QLFoFs4MZzvQ3Nm2Ddt");
const [addr] = PublicKey.findProgramAddressSync([Buffer.from("ArciumSignerAccount")], MY_PROG);
console.log("ArciumSignerAccount with 7R6y8...:", addr.toBase58());

const [addr2] = PublicKey.findProgramAddressSync([Buffer.from("sign_pda")], MY_PROG);
console.log("sign_pda with 7R6y8...:", addr2.toBase58());
