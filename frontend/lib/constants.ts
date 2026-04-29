import { PublicKey } from "@solana/web3.js";

export const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_ARCIUM_OBSCURA_PROGRAM_ID ?? "29bVaakfeBhFm8BbqkehH3iMxHvRYwZ9QHecsi4kJ7on"
);
export const PAYOUT_SCALE = 1_000_000;
export const MARKET_SEED = "market";
export const BET_SEED = "bet";
export const RESOLUTION_SEED = "resolution";
export const VAULT_SEED = "vault";
export const COMMITMENT_DOMAIN = "arcium-obscura-markets-v1";
