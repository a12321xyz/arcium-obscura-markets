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
    bump: account.bump,
    vaultBump: account.vaultBump,
    creator: account.creator?.toBase58?.() ?? "",
    marketId: String(asNumber(account.marketId)),
    kind: enumName(account.kind) as MarketKind,
    status: enumName(account.status) as MarketStatus,
    outcomeCount: account.outcomeCount,
    question: account.question ?? "Untitled market",
    outcomes: account.outcomes ?? ["Yes", "No"],
    endTime: asNumber(account.endTime),
    quorum: asNumber(account.quorum),
    nextBetId: account.nextBetId ? BigInt(account.nextBetId.toString()) : 0n,
    acceptedBetCount: asNumber(account.acceptedBetCount),
    publicMaxEscrowLamports: account.publicMaxEscrowLamports ? BigInt(account.publicMaxEscrowLamports.toString()) : 0n,
    publicPoolLamports: account.publicPoolLamports ? BigInt(account.publicPoolLamports.toString()) : 0n,
    stateNonce: account.stateNonce ? BigInt(account.stateNonce.toString()) : 0n,
    encryptedState: account.encryptedState ?? [],
    publicOutcomePools: (account.publicOutcomePools ?? []).map((v: any) => BigInt(v.toString()))
  };
}

export async function fetchMarkets(connection: Connection, wallet: WalletContextState): Promise<Market[]> {
  try {
    // Create a read-only provider if wallet is not connected
    const provider = new AnchorProvider(
      connection,
      wallet.publicKey ? (wallet as any) : { publicKey: PublicKey.default },
      { commitment: "confirmed" }
    );
    const program = getProgram(provider);
    console.log(`[Diagnostic] Fetching markets for Program ID: ${PROGRAM_ID.toBase58()} on RPC: ${connection.rpcEndpoint}`);
    const accounts = await program.account.market.all();
    console.log(`Fetched ${accounts.length} raw market accounts`);
    
    const realMarkets = accounts.map((item: any) => {
      try {
        return normalizeMarket(item.publicKey, item.account);
      } catch (err) {
        console.error("Failed to normalize market:", item.publicKey.toBase58(), err);
        return null;
      }
    }).filter(Boolean) as Market[];

    console.log(`Successfully normalized ${realMarkets.length} markets`);
    return realMarkets.length > 0 ? realMarkets : demoMarkets;
  } catch (e) {
    console.error("Error fetching markets:", e);
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
  console.log("arciumAccounts entry", { programId: programId.toBase58(), circuit });
  const arcium = (await import("@arcium-hq/client")) as any;
  console.log("arcium client imported");
  const clusterOffset = 456;
  const offsetRaw = arcium.getCompDefAccOffset(circuit);
  console.log("offsetRaw:", offsetRaw);
  const offset = readU32Le(offsetRaw);
  console.log(`Arcium debug: circuit=${circuit}, offset=${offset}, cluster=${clusterOffset}`);
  const mxeAccount = arcium.getMXEAccAddress(programId);
  console.log("mxeAccount:", mxeAccount.toBase58());
  const [signPda] = PublicKey.findProgramAddressSync([Buffer.from("ArciumSignerAccount")], programId);
  console.log("signPda:", signPda.toBase58());
  
  return {
    computationAccount: arcium.getComputationAccAddress(clusterOffset, computationOffset),
    clusterAccount: arcium.getClusterAccAddress(clusterOffset),
    mxeAccount,
    mempoolAccount: arcium.getMempoolAccAddress(clusterOffset),
    executingPool: arcium.getExecutingPoolAccAddress(clusterOffset),
    compDefAccount: arcium.getCompDefAccAddress(programId, offset),
    signPdaAccount: signPda,
    poolAccount: arcium.getFeePoolAccAddress(),
    clockAccount: arcium.getClockAccAddress(),
    arciumProgram: arcium.getArciumProgramId()
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
  console.log("createMarketTx entry", { 
    marketId: input.marketId.toString(),
    idlVersion: (ARCIUM_OBSCURA_MARKETS_IDL as any).metadata?.version
  });
  let program;
  try {
    program = getProgram(input.provider);
    console.log("Program initialized successfully");
  } catch (e) {
    console.error("Failed to initialize Anchor Program:", e);
    throw e;
  }
  const creator = input.provider.wallet.publicKey;
  console.log("Creator:", creator?.toBase58());
  const [market] = deriveMarketPda(creator, input.marketId);
  console.log("Market PDA:", market.toBase58());
  const [vault] = deriveVaultPda(market);
  console.log("Vault PDA:", vault.toBase58());
  console.log("Calling arciumAccounts...");
  const accounts = await arciumAccounts(PROGRAM_ID, input.computationOffset, "init_m8");
  console.log("Arcium accounts resolved");
  const kind = input.kind === "Prediction" ? { prediction: {} } : { opinion: {} };

  console.log("Creating market with accounts:", {
    creator: creator.toBase58(),
    market: market.toBase58(),
    vault: vault.toBase58(),
    ...Object.fromEntries(Object.entries(accounts).map(([k, v]) => [k, (v as any).toBase58?.() ?? v]))
  });

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
