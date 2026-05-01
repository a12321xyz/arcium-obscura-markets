
import { PublicKey } from "@solana/web3.js";
import { getMXEAccAddress } from "@arcium-hq/client";

const programId = new PublicKey("7R6y8MzZvWb8MuPcb6g12gnC6QLFoFs4MZzvQ3Nm2Ddt");
const mxeAccount = getMXEAccAddress(programId);
console.log("MXE Account:", mxeAccount.toBase58());

const [signPdaOurProg] = PublicKey.findProgramAddressSync(
    [Buffer.from("ArciumSignerAccount")],
    programId
);
console.log("Sign PDA (Our Prog):", signPdaOurProg.toBase58());

const [signPdaMxeProg] = PublicKey.findProgramAddressSync(
    [Buffer.from("ArciumSignerAccount")],
    mxeAccount
);
console.log("Sign PDA (MXE Account):", signPdaMxeProg.toBase58());

const [signPdaArciumProg] = PublicKey.findProgramAddressSync(
    [Buffer.from("ArciumSignerAccount")],
    new PublicKey("Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ")
);
console.log("Sign PDA (Arcium Prog):", signPdaArciumProg.toBase58());
