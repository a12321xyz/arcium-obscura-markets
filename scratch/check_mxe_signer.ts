import { PublicKey } from "@solana/web3.js";

const MXE_ADDR = new PublicKey("G1ifpsVd4a6ypt5BBMAnmPYniRNEyrsb9ag68GyGmAAC");
const [addr] = PublicKey.findProgramAddressSync([Buffer.from("ArciumSignerAccount")], MXE_ADDR);
console.log("ArciumSignerAccount with MXE_ADDR:", addr.toBase58());

const [addr2] = PublicKey.findProgramAddressSync([Buffer.from("sign_pda")], MXE_ADDR);
console.log("sign_pda with MXE_ADDR:", addr2.toBase58());
