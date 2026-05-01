
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getMXEAccAddress } from "@arcium-hq/client";

const programId = new PublicKey("7R6y8MzZvWb8MuPcb6g12gnC6QLFoFs4MZzvQ3Nm2Ddt");
const mxeAccount = getMXEAccAddress(programId);
console.log("MXE Account:", mxeAccount.toBase58());
