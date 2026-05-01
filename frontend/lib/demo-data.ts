import { Market } from "@/lib/types";

const now = Math.floor(Date.now() / 1000);

export const demoMarkets: Market[] = [
  {
    address: "DemoPrediction1111111111111111111111111111111",
    bump: 255,
    vaultBump: 255,
    creator: "ArciumDemoCreator111111111111111111111111111",
    marketId: "1001",
    kind: "Prediction",
    status: "Open",
    outcomeCount: 2,
    question: "Will Firedancer hit a public Solana mainnet release candidate before Breakpoint?",
    outcomes: ["Yes", "No"],
    endTime: now + 86400 * 8,
    quorum: 0,
    nextBetId: 0n,
    acceptedBetCount: 128,
    publicMaxEscrowLamports: 91_000_000_000n,
    publicPoolLamports: 57_400_000_000n,
    stateNonce: 0n,
    encryptedState: [],
    publicOutcomePools: [33_200_000_000n, 24_200_000_000n, 0n, 0n]
  },
  {
    address: "DemoOpinion111111111111111111111111111111111",
    bump: 255,
    vaultBump: 255,
    creator: "ArciumDemoCreator222222222222222222222222222",
    marketId: "2002",
    kind: "Opinion",
    status: "Open",
    outcomeCount: 4,
    question: "Which privacy primitive should most consumer Solana apps adopt first?",
    outcomes: ["MPC", "ZK proofs", "Confidential transfers", "TEEs"],
    endTime: now + 86400 * 5,
    quorum: 25,
    nextBetId: 0n,
    acceptedBetCount: 67,
    publicMaxEscrowLamports: 42_000_000_000n,
    publicPoolLamports: 27_800_000_000n,
    stateNonce: 0n,
    encryptedState: [],
    publicOutcomePools: [12_900_000_000n, 7_700_000_000n, 5_100_000_000n, 2_100_000_000n]
  },
  {
    address: "DemoPrediction2222222222222222222222222222222",
    bump: 255,
    vaultBump: 255,
    creator: "ArciumDemoCreator333333333333333333333333333",
    marketId: "3003",
    kind: "Prediction",
    status: "Resolved",
    outcomeCount: 2,
    question: "Will SOL close above $200 on the last UTC day of this quarter?",
    outcomes: ["Yes", "No"],
    endTime: now - 86400,
    quorum: 0,
    nextBetId: 0n,
    acceptedBetCount: 301,
    publicMaxEscrowLamports: 220_000_000_000n,
    publicPoolLamports: 171_000_000_000n,
    stateNonce: 0n,
    encryptedState: [],
    publicOutcomePools: [99_000_000_000n, 72_000_000_000n, 0n, 0n]
  }
];
