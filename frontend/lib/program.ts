import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { ARCIUM_OBSCURA_MARKETS_IDL } from "@/lib/idl";
import { BET_SEED, MARKET_SEED, PROGRAM_ID, RESOLUTION_SEED, VAULT_SEED } from "@/lib/constants";
import { demoMarkets } from "@/lib/demo-data";
import { asNumber } from "@/lib/utils";
import { Market, MarketKind, MarketStatus } from "@/lib/types";

export function getAnchorProvider(connection: Connection, wallet: WalletContextState) {
  if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
    throw new Error("Connect a wallet first.");
  }

  return new AnchorProvider(
    connection,
    {
      publicKey: wallet.publicKey,
      signTransaction: wallet.signTransaction,
      signAllTransactions: wallet.signAllTransactions
    },
    { commitment: "confirmed", preflightCommitment: "confirmed" }
  );
}

export function getProgram(provider: AnchorProvider) {
  return new Program(ARCIUM_OBSCURA_MARKETS_IDL, provider) as any;
}

export function deriveMarketPda(creator: PublicKey, marketId: bigint) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(MARKET_SEED), creator.toBuffer(), leU64(marketId)],
    PROGRAM_ID
  );
}

export function deriveBetPda(market: PublicKey, betId: bigint) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(BET_SEED), market.toBuffer(), leU64(betId)],
    PROGRAM_ID
  );
}

export function deriveVaultPda(market: PublicKey) {
  return PublicKey.findProgramAddressSync([Buffer.from(VAULT_SEED), market.toBuffer()], PROGRAM_ID);
}

export function deriveResolutionPda(market: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(RESOLUTION_SEED), market.toBuffer()],
    PROGRAM_ID
  );
}

function leU64(value: bigint) {
  const bytes = new Uint8Array(8);
  let v = value;
  for (let i = 0; i < 8; i += 1) {
    bytes[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return bytes;
}

function readU32Le(bytesLike: Uint8Array | number[]) {
  const bytes = bytesLike instanceof Uint8Array ? bytesLike : new Uint8Array(bytesLike);
  return bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24);
}

function enumName(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const key = Object.keys(value as Record<string, unknown>)[0];
    return key ? key.charAt(0).toUpperCase() + key.slice(1) : "Open";
  }
  return "Open";
}

function normalizeMarket(address: PublicKey, account: any): Market {
  return {
    address: address.toBase58(),
    creator: account.creator?.toBase58?.() ?? "",
    marketId: String(asNumber(account.marketId)),
    kind: enumName(account.kind) as MarketKind,
    status: enumName(account.status) as MarketStatus,
    question: account.question ?? "Untitled market",
    outcomes: account.outcomes ?? ["Yes", "No"],
    endTime: asNumber(account.endTime),
    quorum: asNumber(account.quorum),
    acceptedBetCount: asNumber(account.acceptedBetCount),
    publicMaxEscrowLamports: asNumber(account.publicMaxEscrowLamports),
    publicPoolLamports: asNumber(account.publicPoolLamports),
    publicOutcomePools: (account.publicOutcomePools ?? [0, 0, 0, 0]).map(asNumber),
    nextBetId: account.nextBetId ? BigInt(account.nextBetId.toString()) : 0n
  };
}

export async function fetchMarkets(connection: Connection, wallet: WalletContextState): Promise<Market[]> {
  try {
    if (!wallet.publicKey) return demoMarkets;
    const provider = getAnchorProvider(connection, wallet);
    const program = getProgram(provider);
    const accounts = await program.account.market.all();
    if (!accounts.length) return demoMarkets;
    return accounts.map((item: any) => normalizeMarket(item.publicKey, item.account));
  } catch {
    return demoMarkets;
  }
}

export async function fetchMarketByAddress(
  connection: Connection,
  wallet: WalletContextState,
  address: string
): Promise<Market | null> {
  const demo = demoMarkets.find((market) => market.address === address || market.marketId === address);
  try {
    if (!wallet.publicKey || demo) return demo ?? null;
    const provider = getAnchorProvider(connection, wallet);
    const program = getProgram(provider);
    const publicKey = new PublicKey(address);
    const account = await program.account.market.fetch(publicKey);
    return normalizeMarket(publicKey, account);
  } catch {
    return demo ?? null;
  }
}

async function arciumAccounts(programId: PublicKey, computationOffset: BN, circuit: string) {
  const arcium = (await import("@arcium-hq/client")) as any;
  const env = arcium.getArciumEnv();
  const offset = readU32Le(arcium.getCompDefAccOffset(circuit));
  return {
    computationAccount: arcium.getComputationAccAddress(env.arciumClusterOffset, computationOffset),
    clusterAccount: arcium.getClusterAccAddress(env.arciumClusterOffset),
    mxeAccount: arcium.getMXEAccAddress(programId),
    mempoolAccount: arcium.getMempoolAccAddress(env.arciumClusterOffset),
    executingPool: arcium.getExecutingPoolAccAddress(env.arciumClusterOffset),
    compDefAccount: arcium.getCompDefAccAddress(programId, offset)
  };
}

export async function createMarketTx(input: {
  provider: AnchorProvider;
  marketId: bigint;
  kind: MarketKind;
  question: string;
  outcomes: string[];
  endTime: number;
  quorum: number;
  computationOffset: BN;
}) {
  const program = getProgram(input.provider);
  const creator = input.provider.wallet.publicKey;
  const [market] = deriveMarketPda(creator, input.marketId);
  const [vault] = deriveVaultPda(market);
  const accounts = await arciumAccounts(PROGRAM_ID, input.computationOffset, "init_market_state");
  const kind = input.kind === "Prediction" ? { prediction: {} } : { opinion: {} };

  return program.methods
    .initializeMarket(
      input.computationOffset,
      new BN(input.marketId.toString()),
      kind,
      input.question,
      input.outcomes,
      new BN(input.endTime),
      input.quorum
    )
    .accountsPartial({
      creator,
      market,
      vault,
      systemProgram: SystemProgram.programId,
      ...accounts
    })
    .rpc({ skipPreflight: true, commitment: "confirmed" });
}

export async function placeBetTx(input: {
  provider: AnchorProvider;
  market: PublicKey;
  betId: bigint;
  encryptedAmount: number[];
  encryptedOutcome: number[];
  encryptionPubkey: number[];
  nonce: string;
  commitment: Uint8Array;
  maxStakeLamports: bigint;
  computationOffset: BN;
}) {
  const program = getProgram(input.provider);
  const bettor = input.provider.wallet.publicKey;
  const [bet] = deriveBetPda(input.market, input.betId);
  const [vault] = deriveVaultPda(input.market);
  const accounts = await arciumAccounts(PROGRAM_ID, input.computationOffset, "place_bet");

  return program.methods
    .placeEncryptedBet(
      input.computationOffset,
      new BN(input.betId.toString()),
      input.encryptedAmount,
      input.encryptedOutcome,
      input.encryptionPubkey,
      new BN(input.nonce),
      Array.from(input.commitment),
      new BN(input.maxStakeLamports.toString())
    )
    .accountsPartial({
      bettor,
      market: input.market,
      bet,
      vault,
      systemProgram: SystemProgram.programId,
      ...accounts
    })
    .rpc({ skipPreflight: true, commitment: "confirmed" });
}

export async function claimWinningsTx(input: {
  provider: AnchorProvider;
  market: PublicKey;
  betId: bigint;
  amountLamports: bigint;
  outcome: number;
  salt: Uint8Array;
}) {
  const program = getProgram(input.provider);
  const [bet] = deriveBetPda(input.market, input.betId);
  const [resolution] = deriveResolutionPda(input.market);
  const [vault] = deriveVaultPda(input.market);
  return program.methods
    .claimWinnings(
      new BN(input.betId.toString()),
      new BN(input.amountLamports.toString()),
      input.outcome,
      Array.from(input.salt)
    )
    .accountsPartial({
      bettor: input.provider.wallet.publicKey,
      market: input.market,
      bet,
      resolution,
      vault,
      systemProgram: SystemProgram.programId
    })
    .rpc({ commitment: "confirmed" });
}
