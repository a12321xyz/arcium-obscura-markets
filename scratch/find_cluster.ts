
import { PublicKey } from "@solana/web3.js";
import { getClusterAccAddress, getMXEAccAddress } from "@arcium-hq/client";

const programId = new PublicKey("7R6y8MzZvWb8MuPcb6g12gnC6QLFoFs4MZzvQ3Nm2Ddt");
const mxe = getMXEAccAddress(programId);
console.log("MXE Address:", mxe.toBase58());

// If cluster_offset is 456
const cluster = getClusterAccAddress(456);
console.log("Cluster 456 Address:", cluster.toBase58());

// If cluster_offset is 0?
const cluster0 = getClusterAccAddress(0);
console.log("Cluster 0 Address:", cluster0.toBase58());
