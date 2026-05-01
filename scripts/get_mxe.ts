import { PublicKey } from "@solana/web3.js";
import { getMXEAccAddress } from "@arcium-hq/client";

const programId = new PublicKey("29bVaakfeBhFm8BbqkehH3iMxHvRYwZ9QHecsi4kJ7on");
console.log(getMXEAccAddress(programId).toBase58());
