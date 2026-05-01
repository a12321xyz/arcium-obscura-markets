export type MarketKind = "Prediction" | "Opinion";
export type MarketStatus = "Initializing" | "Open" | "Resolving" | "Resolved" | "Cancelled";

export type Market = {
  address: string;
  bump: number;
  vaultBump: number;
  creator: string;
  marketId: string;
  kind: MarketKind;
  status: MarketStatus;
  outcomeCount: number;
  endTime: number;
  quorum: number;
  nextBetId: bigint;
  acceptedBetCount: number;
  publicMaxEscrowLamports: bigint;
  publicPoolLamports: bigint;
  stateNonce: bigint;
  encryptedState: number[][];
  publicOutcomePools: bigint[];
  question: string;
  outcomes: string[];
};

export type LocalBetReceipt = {
  market: string;
  bet: string;
  bettor: string;
  betId: string;
  amountLamports: string;
  maxStakeLamports: string;
  outcome: number;
  saltHex: string;
  commitmentHex: string;
  createdAt: number;
  signature?: string;
};

export type EncryptedBetPayload = {
  encryptedAmount: number[];
  encryptedOutcome: number[];
  encryptionPubkey: number[];
  nonce: string;
  salt: Uint8Array;
  commitment: Uint8Array;
};
