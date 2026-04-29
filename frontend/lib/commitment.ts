import { keccak_256 } from "@noble/hashes/sha3";
import { PublicKey } from "@solana/web3.js";
import { COMMITMENT_DOMAIN } from "@/lib/constants";

export function randomBytes(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBytes(hex: string) {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex string");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
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

export function betCommitment(input: {
  market: PublicKey;
  bettor: PublicKey;
  betId: bigint;
  amountLamports: bigint;
  outcome: number;
  salt: Uint8Array;
}) {
  const domain = new TextEncoder().encode(COMMITMENT_DOMAIN);
  const data = new Uint8Array(
    domain.length + 32 + 32 + 8 + 8 + 1 + input.salt.length
  );
  let offset = 0;
  data.set(domain, offset);
  offset += domain.length;
  data.set(input.market.toBytes(), offset);
  offset += 32;
  data.set(input.bettor.toBytes(), offset);
  offset += 32;
  data.set(leU64(input.betId), offset);
  offset += 8;
  data.set(leU64(input.amountLamports), offset);
  offset += 8;
  data[offset] = input.outcome;
  offset += 1;
  data.set(input.salt, offset);
  return keccak_256(data);
}
