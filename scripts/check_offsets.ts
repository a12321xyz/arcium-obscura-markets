import { getMempoolAccAddress } from "@arcium-hq/client";

console.log("Offset 0:", getMempoolAccAddress(0).toBase58());
console.log("Offset 1:", getMempoolAccAddress(1).toBase58());
console.log("Offset 2:", getMempoolAccAddress(2).toBase58());
console.log("Offset 3:", getMempoolAccAddress(3).toBase58());
