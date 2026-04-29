import { Market } from "@/lib/types";

const now = Math.floor(Date.now() / 1000);

export const demoMarkets: Market[] = [
  {
    address: "DemoPrediction1111111111111111111111111111111",
    creator: "ArciumDemoCreator111111111111111111111111111",
    marketId: "1001",
    kind: "Prediction",
    status: "Open",
    question: "Will Firedancer hit a public Solana mainnet release candidate before Breakpoint?",
    outcomes: ["Yes", "No"],
    endTime: now + 86400 * 8,
    quorum: 0,
    acceptedBetCount: 128,
    publicMaxEscrowLamports: 91_000_000_000,
    publicPoolLamports: 57_400_000_000,
    publicOutcomePools: [33_200_000_000, 24_200_000_000, 0, 0],
    nextBetId: 0n
  },
  {
    address: "DemoOpinion111111111111111111111111111111111",
    creator: "ArciumDemoCreator222222222222222222222222222",
    marketId: "2002",
    kind: "Opinion",
    status: "Open",
    question: "Which privacy primitive should most consumer Solana apps adopt first?",
    outcomes: ["MPC", "ZK proofs", "Confidential transfers", "TEEs"],
    endTime: now + 86400 * 5,
    quorum: 25,
    acceptedBetCount: 67,
    publicMaxEscrowLamports: 42_000_000_000,
    publicPoolLamports: 27_800_000_000,
    publicOutcomePools: [12_900_000_000, 7_700_000_000, 5_100_000_000, 2_100_000_000],
    nextBetId: 0n
  },
  {
    address: "DemoPrediction2222222222222222222222222222222",
    creator: "ArciumDemoCreator333333333333333333333333333",
    marketId: "3003",
    kind: "Prediction",
    status: "Resolved",
    question: "Will SOL close above $200 on the last UTC day of this quarter?",
    outcomes: ["Yes", "No"],
    endTime: now - 86400,
    quorum: 0,
    acceptedBetCount: 301,
    publicMaxEscrowLamports: 220_000_000_000,
    publicPoolLamports: 171_000_000_000,
    publicOutcomePools: [99_000_000_000, 72_000_000_000, 0, 0],
    nextBetId: 0n
  }
];
