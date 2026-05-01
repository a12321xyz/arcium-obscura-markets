import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { randomBytes } from "crypto";
import { expect } from "chai";
import { keccak_256 } from "@noble/hashes/sha3";
import {
  awaitComputationFinalization,
  deserializeLE,
  getArciumAccountBaseSeed,
  getArciumEnv,
  getArciumProgram,
  getArciumProgramId,
  getClusterAccAddress,
  getCompDefAccAddress,
  getCompDefAccOffset,
  getComputationAccAddress,
  getExecutingPoolAccAddress,
  getLookupTableAddress,
  getMempoolAccAddress,
  getMXEAccAddress,
  getMXEPublicKey,
  RescueCipher,
  uploadCircuit,
  x25519,
} from "@arcium-hq/client";
import * as fs from "fs";
import * as os from "os";

describe("Arcium Obscura Markets", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.ArciumObscuraMarkets as Program<any>;
  const arciumEnv = getArciumEnv();
  const clusterAccount = getClusterAccAddress(arciumEnv.arciumClusterOffset);

  let payer: anchor.web3.Keypair;
  let mxePublicKey: Uint8Array;

  before(async () => {
    payer = readKpJson(`${os.homedir()}/.config/solana/id.json`);
    mxePublicKey = await getMXEPublicKeyWithRetry(provider, program.programId);
    for (const circuit of [
      "init_m8",
      "place_bet",
      "resolve_prediction_market",
      "resolve_opinion_market",
    ]) {
      await initCompDef(circuit);
    }
  });

  it("creates a prediction market, accepts encrypted bets, resolves, and claims", async () => {
    const marketId = new anchor.BN(Date.now());
    const [market] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), payer.publicKey.toBuffer(), marketId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [vault] = PublicKey.findProgramAddressSync([Buffer.from("vault"), market.toBuffer()], program.programId);
    const createOffset = randomOffset();

    await program.methods
      .initializeMarket(
        createOffset,
        marketId,
        { prediction: {} },
        "Will this private market resolve to YES?",
        ["Yes", "No"],
        new anchor.BN(Math.floor(Date.now() / 1000) + 2),
        0
      )
      .accountsPartial({
        creator: payer.publicKey,
        market,
        vault,
        systemProgram: SystemProgram.programId,
        ...arciumAccounts(createOffset, "init_m8"),
      })
      .signers([payer])
      .rpc({ skipPreflight: true, commitment: "confirmed" });
    await awaitComputationFinalization(provider, createOffset, program.programId, "confirmed");

    const betId = new anchor.BN(0);
    const [bet] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), market.toBuffer(), betId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const amount = 100_000_000n;
    const outcome = 0;
    const maxStake = 150_000_000n;
    const encrypted = encryptBet(amount, outcome);
    const salt = randomBytes(32);
    const commitment = betCommitment(market, payer.publicKey, 0n, amount, outcome, salt);
    const betOffset = randomOffset();

    await program.methods
      .placeEncryptedBet(
        betOffset,
        betId,
        Array.from(encrypted.ciphertext[0]),
        Array.from(encrypted.ciphertext[1]),
        Array.from(encrypted.publicKey),
        new anchor.BN(deserializeLE(encrypted.nonce).toString()),
        Array.from(commitment),
        new anchor.BN(maxStake.toString())
      )
      .accountsPartial({
        bettor: payer.publicKey,
        market,
        bet,
        vault,
        systemProgram: SystemProgram.programId,
        ...arciumAccounts(betOffset, "place_bet"),
      })
      .signers([payer])
      .rpc({ skipPreflight: true, commitment: "confirmed" });
    await awaitComputationFinalization(provider, betOffset, program.programId, "confirmed");

    const marketAccount = await program.account.market.fetch(market);
    expect(marketAccount.acceptedBetCount).to.equal(1);

    await waitUntilEnded(market);
    const [resolution] = PublicKey.findProgramAddressSync([Buffer.from("resolution"), market.toBuffer()], program.programId);
    const resolveOffset = randomOffset();
    await program.methods
      .resolveMarket(resolveOffset, outcome)
      .accountsPartial({
        resolver: payer.publicKey,
        market,
        resolution,
        systemProgram: SystemProgram.programId,
        ...arciumAccounts(resolveOffset, "resolve_prediction_market"),
      })
      .signers([payer])
      .rpc({ skipPreflight: true, commitment: "confirmed" });
    await awaitComputationFinalization(provider, resolveOffset, program.programId, "confirmed");

    const sig = await program.methods
      .claimWinnings(betId, new anchor.BN(amount.toString()), outcome, Array.from(salt))
      .accountsPartial({
        bettor: payer.publicKey,
        market,
        bet,
        resolution,
        vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([payer])
      .rpc({ commitment: "confirmed" });
    expect(sig).to.be.a("string");
  });

  function randomOffset() {
    return new anchor.BN(randomBytes(8), "le");
  }

  function arciumAccounts(computationOffset: anchor.BN, circuit: string) {
    return {
      computationAccount: getComputationAccAddress(arciumEnv.arciumClusterOffset, computationOffset),
      clusterAccount,
      mxeAccount: getMXEAccAddress(program.programId),
      mempoolAccount: getMempoolAccAddress(arciumEnv.arciumClusterOffset),
      executingPool: getExecutingPoolAccAddress(arciumEnv.arciumClusterOffset),
      compDefAccount: getCompDefAccAddress(
        program.programId,
        Buffer.from(getCompDefAccOffset(circuit)).readUInt32LE()
      ),
    };
  }

  function encryptBet(amount: bigint, outcome: number) {
    const privateKey = x25519.utils.randomSecretKey();
    const publicKey = x25519.getPublicKey(privateKey);
    const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);
    const nonce = randomBytes(16);
    const ciphertext = cipher.encrypt([amount, BigInt(outcome)], nonce);
    return { publicKey, nonce, ciphertext };
  }

  async function waitUntilEnded(market: PublicKey) {
    while (true) {
      const account = await program.account.market.fetch(market);
      const now = await validatorTimestamp();
      if (now >= account.endTime.toNumber()) return;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  async function validatorTimestamp() {
    const slot = await provider.connection.getSlot("confirmed");
    const blockTime = await provider.connection.getBlockTime(slot);
    if (blockTime === null) throw new Error("Missing validator block time");
    return blockTime;
  }

  async function initCompDef(circuitName: string) {
    const baseSeed = getArciumAccountBaseSeed("ComputationDefinitionAccount");
    const offset = getCompDefAccOffset(circuitName);
    const compDefAccount = PublicKey.findProgramAddressSync(
      [baseSeed, program.programId.toBuffer(), offset],
      getArciumProgramId()
    )[0];
    const arciumProgram = getArciumProgram(provider);
    const mxeAccount = getMXEAccAddress(program.programId);
    const mxeAcc = await arciumProgram.account.mxeAccount.fetch(mxeAccount);
    const addressLookupTable = getLookupTableAddress(program.programId, mxeAcc.lutOffsetSlot);

    const methodByCircuit: Record<string, string> = {
      init_m8: "initM8CompDef",
      place_bet: "initPlaceBetCompDef",
      resolve_prediction_market: "initResolvePredictionMarketCompDef",
      resolve_opinion_market: "initResolveOpinionMarketCompDef",
    };
    await (program.methods as any)[methodByCircuit[circuitName]]()
      .accounts({ payer: payer.publicKey, mxeAccount, compDefAccount, addressLookupTable })
      .signers([payer])
      .rpc({ commitment: "confirmed" });

    const rawCircuit = fs.readFileSync(`build/${circuitName}.arcis`);
    await uploadCircuit(provider, circuitName, program.programId, rawCircuit, true);
  }
});

async function getMXEPublicKeyWithRetry(provider: anchor.AnchorProvider, programId: PublicKey) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const key = await getMXEPublicKey(provider, programId);
      if (key) return key;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error("Unable to fetch MXE public key");
}

function readKpJson(path: string) {
  const file = fs.readFileSync(path);
  return anchor.web3.Keypair.fromSecretKey(new Uint8Array(JSON.parse(file.toString())));
}

function leU64(value: bigint) {
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64LE(value);
  return bytes;
}

function betCommitment(
  market: PublicKey,
  bettor: PublicKey,
  betId: bigint,
  amount: bigint,
  outcome: number,
  salt: Uint8Array
) {
  return keccak_256(
    Buffer.concat([
      Buffer.from("arcium-obscura-markets-v1"),
      market.toBuffer(),
      bettor.toBuffer(),
      leU64(betId),
      leU64(amount),
      Buffer.from([outcome]),
      Buffer.from(salt),
    ])
  );
}
