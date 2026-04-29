export type MarketKind = "Prediction" | "Opinion";
export type MarketStatus = "Open" | "Resolving" | "Resolved" | "Cancelled";

export type Market = {
  address: string;
  creator: string;
  marketId: string;
  kind: MarketKind;
  status: MarketStatus;
  question: string;
  outcomes: string[];
  endTime: number;
  quorum: number;
  acceptedBetCount: number;
  publicMaxEscrowLamports: number;
  publicPoolLamports: number;
  publicOutcomePools: number[];
  nextBetId: bigint;
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
