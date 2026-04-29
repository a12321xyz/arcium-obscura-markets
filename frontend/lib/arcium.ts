import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { betCommitment, randomBytes } from "@/lib/commitment";
import { PROGRAM_ID } from "@/lib/constants";
import { EncryptedBetPayload } from "@/lib/types";

function deserializeLittleEndian(bytes: Uint8Array) {
  let value = 0n;
  for (let i = bytes.length - 1; i >= 0; i -= 1) {
    value = (value << 8n) + BigInt(bytes[i]);
  }
  return value;
}

export async function getMxePublicKey(provider: AnchorProvider, programId = PROGRAM_ID) {
  const arcium = (await import("@arcium-hq/client")) as any;
  return arcium.getMXEPublicKey(provider, programId);
}

export async function encryptBetPayload(input: {
  provider: AnchorProvider;
  market: PublicKey;
  bettor: PublicKey;
  betId: bigint;
  amountLamports: bigint;
  outcome: number;
}): Promise<EncryptedBetPayload> {
  const arcium = (await import("@arcium-hq/client")) as any;
  const mxePublicKey = await arcium.getMXEPublicKey(input.provider, PROGRAM_ID);
  const privateKey = arcium.x25519.utils.randomSecretKey();
  const publicKey = arcium.x25519.getPublicKey(privateKey);
  const sharedSecret = arcium.x25519.getSharedSecret(privateKey, mxePublicKey);
  const cipher = new arcium.RescueCipher(sharedSecret);
  const nonce = randomBytes(16);
  const ciphertext = cipher.encrypt([input.amountLamports, BigInt(input.outcome)], nonce);
  const salt = randomBytes(32);
  const commitment = betCommitment({ ...input, salt });

  return {
    encryptedAmount: Array.from(ciphertext[0]),
    encryptedOutcome: Array.from(ciphertext[1]),
    encryptionPubkey: Array.from(publicKey),
    nonce: deserializeLittleEndian(nonce).toString(),
    salt,
    commitment
  };
}

export function randomComputationOffset() {
  return new BN(randomBytes(8), "le");
}
