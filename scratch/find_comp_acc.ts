
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getComputationAccAddress, getClusterAccAddress } from "@arcium-hq/client";

const offsetHex = "f52cdbc720f08f48";
const offset = new anchor.BN(offsetHex, 16);
const clusterOffset = 456;
const clusterAcc = getClusterAccAddress(clusterOffset);
const compAcc = getComputationAccAddress(clusterOffset, offset);

console.log("Cluster Account:", clusterAcc.toBase58());
console.log("Computation Account:", compAcc.toBase58());
