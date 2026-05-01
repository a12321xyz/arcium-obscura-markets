import { PublicKey } from "@solana/web3.js";

const programId = new PublicKey("7R6y8MzZvWb8MuPcb6g12gnC6QLFoFs4MZzvQ3Nm2Ddt");

const SEEDS = [
    "ArciumSignerAccount",
    "arcium_signer_account",
    "ArciumSigner",
    "arcium_signer",
    "SignerAccount",
    "signer_account",
    "ArciumSignSeedAccount",
    "arcium_sign_seed_account"
];

for (const seed of SEEDS) {
    const [addr] = PublicKey.findProgramAddressSync([Buffer.from(seed)], programId);
    console.log(`${seed}: ${addr.toBase58()}`);
}
