import type { Idl } from "@coral-xyz/anchor";
import { PROGRAM_ID } from "@/lib/constants";

export const ARCIUM_OBSCURA_MARKETS_IDL: Idl = {
  address: PROGRAM_ID.toBase58(),
  metadata: {
    name: "arcium_obscura_markets",
    version: "0.1.0",
    spec: "0.1.0",
    description: "Arcium Private Prediction and Opinion Markets"
  },
  instructions: [],
  accounts: [
    { name: "market", discriminator: [] },
    { name: "bet", discriminator: [] }
  ],
  events: [],
  errors: [],
  types: []
} as unknown as Idl;
