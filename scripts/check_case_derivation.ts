import { PublicKey } from "@solana/web3.js";

const ARCIUM_PROGRAM_ID = new PublicKey("Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ");

function derive(seed: string, offset: number) {
    const offsetBuf = Buffer.alloc(4);
    offsetBuf.writeUInt32LE(offset);
    return PublicKey.findProgramAddressSync(
        [Buffer.from(seed), offsetBuf],
        ARCIUM_PROGRAM_ID
    )[0].toBase58();
}

console.log("Mempool (M capital):", derive("Mempool", 0));
console.log("mempool (m lowercase):", derive("mempool", 0));
