
import { PublicKey } from "@solana/web3.js";

const programId = new PublicKey("7R6y8MzZvWb8MuPcb6g12gnC6QLFoFs4MZzvQ3Nm2Ddt");
const [signPda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("ArciumSignerAccount")],
    programId
);

console.log("Sign PDA:", signPda.toBase58());
console.log("Bump:", bump);
