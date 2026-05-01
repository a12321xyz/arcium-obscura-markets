import { PublicKey } from "@solana/web3.js";

const ARCIUM_PROGRAM_ID = new PublicKey("Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ");
const TARGET = "Ex7BD8o8PK1y2eXDd38Jgujj93uHygrZeWXDeGAHmHtN";

const SEEDS = ["Mempool", "mempool", "MempoolAccount", "mempool_account", "MempoolAcc", "mempool_acc"];

for (const seed of SEEDS) {
    for (let i = 0; i < 1000; i++) {
        const offsetBuf = Buffer.alloc(4);
        offsetBuf.writeUInt32LE(i);
        const addr = PublicKey.findProgramAddressSync(
            [Buffer.from(seed), offsetBuf],
            ARCIUM_PROGRAM_ID
        )[0].toBase58();
        
        if (addr === TARGET) {
            console.log(`FOUND! Seed: ${seed}, Offset: ${i}`);
            process.exit(0);
        }
    }
}
console.log("NOT FOUND");
