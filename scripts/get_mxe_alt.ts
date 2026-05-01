import { PublicKey } from "@solana/web3.js";
import { getMXEAccAddress } from "@arcium-hq/client";

const programId = new PublicKey("5ReKPSDBcvh8M5nyhVBJsNxdAzC6LfJ5R6wjuApjgLhQ");
console.log(getMXEAccAddress(programId).toBase58());
