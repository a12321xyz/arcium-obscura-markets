import { getClusterAccAddress, getMempoolAccAddress } from "@arcium-hq/client";

const offset = 456;
console.log("Cluster(456):", getClusterAccAddress(offset).toBase58());
console.log("Mempool(456):", getMempoolAccAddress(offset).toBase58());
