import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  getArciumEnv,
  getClusterAccAddress,
  getCompDefAccAddress,
  getCompDefAccOffset,
  getMempoolAccAddress,
  getExecutingPoolAccAddress,
  getMXEAccAddress,
} from "@arcium-hq/client";

async function checkAccount(connection: Connection, name: string, address: string) {
    try {
        const info = await connection.getAccountInfo(new PublicKey(address));
        if (!info) {
            console.log(`${name} (${address}): NOT FOUND`);
            return;
        }
        console.log(`${name} (${address}):`);
        console.log(`  Owner: ${info.owner.toBase58()}`);
        console.log(`  Data Length: ${info.data.length}`);
    } catch (e) {
        console.log(`${name} (${address}): ERROR ${e}`);
    }
}

async function main() {
    const connection = new Connection("https://api.devnet.solana.com");
    const programId = new PublicKey("7R6y8MzZvWb8MuPcb6g12gnC6QLFoFs4MZzvQ3Nm2Ddt");
    const arciumEnv = getArciumEnv();
    
    console.log("Checking project accounts...");
    await checkAccount(connection, "Program", programId.toBase58());
    await checkAccount(connection, "MXE Account", getMXEAccAddress(programId).toBase58());
    const [signPda] = PublicKey.findProgramAddressSync([Buffer.from("ArciumSignerAccount")], programId);
    await checkAccount(connection, "Sign PDA (from JS)", signPda.toBase58());
    
    console.log("\nChecking Arcium Cluster accounts...");
    const clusterOffset = arciumEnv.arciumClusterOffset;
    await checkAccount(connection, "Cluster Account", getClusterAccAddress(clusterOffset).toBase58());
    await checkAccount(connection, "Mempool Account", getMempoolAccAddress(clusterOffset).toBase58());
    await checkAccount(connection, "Executing Pool", getExecutingPoolAccAddress(clusterOffset).toBase58());
    
    console.log("\nChecking Circuit Definition accounts...");
    for (const circuit of ["init_market_state", "place_bet", "resolve_prediction_market", "resolve_opinion_market"]) {
        const offset = Buffer.from(getCompDefAccOffset(circuit)).readUInt32LE();
        const address = getCompDefAccAddress(programId, offset);
        await checkAccount(connection, `Circuit ${circuit}`, address.toBase58());
    }

    console.log("\nChecking hardcoded accounts...");
    await checkAccount(connection, "FeePool", "G2sRWJvi3xoyh5k2gY49eG9L8YhAEWQPtNb1zb1GXTtC");
    await checkAccount(connection, "Clock", "7EbMUTLo5DjdzbN7s8BXeZwXzEwNQb1hScfRvWg8a6ot");
    await checkAccount(connection, "Arcium Program", "Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ");
}

main().catch(console.error);
