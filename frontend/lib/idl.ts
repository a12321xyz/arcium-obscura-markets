import type { Idl } from "@coral-xyz/anchor";
import { PROGRAM_ID } from "@/lib/constants";

export const ARCIUM_OBSCURA_MARKETS_IDL: Idl = {
  "address": PROGRAM_ID.toBase58(),
  "metadata": {
    "name": "arcium_obscura_markets",
    "version": "0.1.1-debug-v2",
    "spec": "0.1.0",
    "description": "Arcium Private Prediction and Opinion Markets"
  },
  "instructions": [
    {
      "name": "initialize_market",
      "discriminator": [35, 35, 189, 193, 155, 48, 170, 203],
      "accounts": [
        { "name": "creator", "writable": true, "signer": true },
        { "name": "market", "writable": true },
        { "name": "vault" },
        { "name": "sign_pda_account", "writable": true },
        { "name": "mxe_account" },
        { "name": "mempool_account", "writable": true },
        { "name": "executing_pool", "writable": true },
        { "name": "computation_account", "writable": true },
        { "name": "comp_def_account" },
        { "name": "cluster_account", "writable": true },
        { "name": "pool_account", "writable": true },
        { "name": "clock_account", "writable": true },
        { "name": "system_program" },
        { "name": "arcium_program" }
      ],
      "args": [
        { "name": "computation_offset", "type": "u64" },
        { "name": "market_id", "type": "u64" },
        { "name": "kind", "type": { "defined": { "name": "MarketKind" } } },
        { "name": "question", "type": "string" },
        { "name": "outcomes", "type": { "vec": "string" } },
        { "name": "end_time", "type": "i64" },
        { "name": "quorum", "type": "u32" }
      ]
    },
    {
      "name": "force_open_market",
      "discriminator": [20, 109, 242, 112, 142, 161, 36, 190],
      "accounts": [
        { "name": "creator", "writable": false, "signer": true },
        { "name": "market", "writable": true }
      ],
      "args": []
    },
    {
      "name": "place_encrypted_bet",
      "discriminator": [31, 225, 208, 210, 139, 191, 29, 247],
      "accounts": [
        { "name": "bettor", "writable": true, "signer": true },
        { "name": "market", "writable": true },
        { "name": "bet", "writable": true },
        { "name": "vault", "writable": true },
        { "name": "sign_pda_account", "writable": true },
        { "name": "mxe_account" },
        { "name": "mempool_account", "writable": true },
        { "name": "executing_pool", "writable": true },
        { "name": "computation_account", "writable": true },
        { "name": "comp_def_account" },
        { "name": "cluster_account", "writable": true },
        { "name": "pool_account", "writable": true },
        { "name": "clock_account", "writable": true },
        { "name": "system_program" },
        { "name": "arcium_program" }
      ],
      "args": [
        { "name": "computation_offset", "type": "u64" },
        { "name": "bet_id", "type": "u64" },
        { "name": "encrypted_amount", "type": { "array": ["u8", 32] } },
        { "name": "encrypted_outcome", "type": { "array": ["u8", 32] } },
        { "name": "encryption_pubkey", "type": { "array": ["u8", 32] } },
        { "name": "nonce", "type": "u128" },
        { "name": "commitment", "type": { "array": ["u8", 32] } },
        { "name": "max_stake_lamports", "type": "u64" }
      ]
    },
    {
      "name": "claim_winnings",
      "discriminator": [161, 215, 24, 59, 14, 236, 242, 221],
      "accounts": [
        { "name": "bettor", "writable": true, "signer": true },
        { "name": "market", "writable": true },
        { "name": "bet", "writable": true },
        { "name": "resolution", "writable": true },
        { "name": "vault", "writable": true },
        { "name": "system_program" }
      ],
      "args": [
        { "name": "bet_id", "type": "u64" },
        { "name": "amount", "type": "u64" },
        { "name": "outcome", "type": "u8" },
        { "name": "salt", "type": { "array": ["u8", 32] } }
      ]
    }
  ],
  "accounts": [
    {
      "name": "Market",
      "discriminator": [219, 190, 213, 55, 0, 227, 198, 154]
    },
    {
      "name": "Bet",
      "discriminator": [147, 23, 35, 59, 123, 67, 129, 0]
    },
    {
      "name": "Resolution",
      "discriminator": [41, 57, 122, 105, 56, 126, 172, 184]
    }
  ],
  "types": [
    {
      "name": "Market",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "bump", "type": "u8" },
          { "name": "vaultBump", "type": "u8" },
          { "name": "creator", "type": "pubkey" },
          { "name": "marketId", "type": "u64" },
          { "name": "kind", "type": { "defined": { "name": "MarketKind" } } },
          { "name": "status", "type": { "defined": { "name": "MarketStatus" } } },
          { "name": "outcomeCount", "type": "u8" },
          { "name": "endTime", "type": "i64" },
          { "name": "quorum", "type": "u32" },
          { "name": "nextBetId", "type": "u64" },
          { "name": "acceptedBetCount", "type": "u32" },
          { "name": "publicMaxEscrowLamports", "type": "u64" },
          { "name": "publicPoolLamports", "type": "u64" },
          { "name": "stateNonce", "type": "u128" },
          { "name": "encryptedState", "type": { "array": [{ "array": ["u8", 32] }, 6] } },
          { "name": "publicOutcomePools", "type": { "array": ["u64", 4] } },
          { "name": "question", "type": "string" },
          { "name": "outcomes", "type": { "vec": "string" } }
        ]
      }
    },
    {
      "name": "Bet",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "market", "type": "pubkey" },
          { "name": "bettor", "type": "pubkey" },
          { "name": "betId", "type": "u64" },
          { "name": "commitment", "type": { "array": ["u8", 32] } },
          { "name": "stakedAmount", "type": "u64" },
          { "name": "isClaimed", "type": "bool" }
        ]
      }
    },
    {
      "name": "Resolution",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "market", "type": "pubkey" },
          { "name": "outcome", "type": "u8" }
        ]
      }
    },
    {
      "name": "MarketKind",
      "type": {
        "kind": "enum",
        "variants": [{ "name": "Prediction" }, { "name": "Opinion" }]
      }
    },
    {
      "name": "MarketStatus",
      "type": {
        "kind": "enum",
        "variants": [
          { "name": "Initializing" },
          { "name": "Open" },
          { "name": "Closed" },
          { "name": "Resolved" }
        ]
      }
    }
  ],
  "errors": [
    { "code": 6000, "name": "AbortedComputation", "msg": "The Arcium computation was aborted" },
    { "code": 6001, "name": "ClusterNotSet", "msg": "Arcium cluster is not set" },
    { "code": 6002, "name": "MarketEnded", "msg": "Market has already ended" },
    { "code": 6003, "name": "MarketNotEnded", "msg": "Market has not ended" },
    { "code": 6004, "name": "MarketNotOpen", "msg": "Market is not open" },
    { "code": 6005, "name": "MarketNotResolved", "msg": "Market is not resolved" }
  ]
} as unknown as Idl;
