import { PublicKey } from "@solana/web3.js";

const programId = new PublicKey("7R6y8MzZvWb8MuPcb6g12gnC6QLFoFs4MZzvQ3Nm2Ddt");
const TARGET = "3QEZbKq3ZJxWWQo5rcLhGS2N4NgBFREshxmiiWdhEDZz";

for (let bump = 255; bump >= 0; bump--) {
    try {
        const addr = PublicKey.createProgramAddressSync(
            [Buffer.from("ArciumSignerAccount"), Buffer.from([bump])],
            programId
        ).toBase58();
        
        if (addr === TARGET) {
            console.log("FOUND BUMP:", bump);
            process.exit(0);
        }
    } catch (e) {}
}
console.log("NOT FOUND");
