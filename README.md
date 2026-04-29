# Arcium Obscura Markets

Arcium Obscura Markets is a privacy-preserving Prediction & Opinion Markets dApp for the Arcium RTG Developer OFFCHAIN category.

Users create markets, connect Phantom or Solflare, and place encrypted private bets. The selected outcome and amount are encrypted in the browser with `@arcium-hq/client`, processed by Arcium MPC, and settled on Solana through an Anchor program.

## Why Arcium

Public prediction markets leak user intent. A visible bet can be copied, front-run, socially pressured, or used to bias the market before the event resolves. Arcium Obscura Markets changes that flow:

```text
User browser
  encrypt(amount, outcome) with Arcium SDK
        |
        v
Solana Anchor program
  queues encrypted instruction
        |
        v
Arcium MXE / MPC cluster
  updates encrypted pools and resolves privately
        |
        v
On-chain callback
  stores aggregate odds and final payout ratio only
```

Privacy benefits:

- Individual bet amount and chosen outcome stay hidden during the decision window.
- Arcium MPC updates market state without exposing plaintext bets to validators, RPCs, or other users.
- Only aggregate pool data is revealed publicly, so the UI can display market-level odds without doxxing individual behavior.
- Opinion markets resolve from encrypted collective voting, which reduces conformity pressure and public-bandwagon bias.
- Over-collateralized escrow hides the exact stake until post-resolution claim; unused escrow is refunded.

## Features

- Prediction markets resolved by creator/oracle after an external event.
- Opinion markets resolved by encrypted quorum voting without an external truth source.
- Two to four outcomes per market.
- Wallet connection with Phantom and Solflare.
- Encrypted bet placement with Arcium SDK and MXE computation queue.
- Public aggregate odds and volume, private individual bets.
- PDA vault escrow and post-resolution claim flow.
- Local browser receipts for claim reveals. No backend database.
- Mobile-first dark UI with Arcium-style cyan/violet visual language.

## Architecture

```text
arcium-obscura-markets/
  Anchor.toml
  Arcium.toml
  Cargo.toml
  package.json
  programs/arcium-obscura-markets/
    Cargo.toml
    src/lib.rs
  encrypted-ixs/
    Cargo.toml
    src/lib.rs
    src/place_bet.rs
    src/resolve_market.rs
  frontend/
    app/
    components/
    lib/
  tests/obscura_markets.ts
```

## Important Compatibility Note

The prompt requested Anchor `0.30.1` and latest Arcium. Current published Arcium crates (`arcium-anchor`/`arcium-client` `0.9.7`) require `anchor-lang` `0.32.1`. This repository uses the current Arcium-compatible stack so the program follows the deployable `queue_computation`, `#[arcium_callback]`, and `SignedComputationOutputs` patterns used by official Arcium examples.

## Local Setup

Install free tooling:

```bash
curl --proto '=https' --tlsv1.2 -sSfL https://install.arcium.com/ | bash
avm install 0.32.1
avm use 0.32.1
solana config set --url devnet
```

Install dependencies:

```bash
npm install
npm --prefix frontend install
```

Build Arcium circuits and Anchor program:

```bash
arcium build
```

Run local Arcium tests:

```bash
arcium test
```

Run the frontend locally:

```bash
npm --prefix frontend run dev
```

Open `http://localhost:3000`.

## Devnet Deploy

Configure a funded devnet wallet:

```bash
solana config set --url devnet
solana airdrop 2
```

Deploy program and circuits:

```bash
arcium deploy --provider.cluster devnet
```

Initialize computation definitions on devnet by running the test bootstrap or by invoking:

```bash
arcium test --provider.cluster devnet --skip-local-validator
```

Set frontend env:

```bash
cd frontend
cp ../.env.example .env.local
```

Update `NEXT_PUBLIC_ARCIUM_OBSCURA_PROGRAM_ID` if you redeploy with a new program id.

## Vercel Deploy

The frontend is static/Next.js only and uses Solana devnet plus Arcium client helpers. No backend or paid service is required.

```bash
cd frontend
npm install -g vercel
vercel
vercel env add NEXT_PUBLIC_SOLANA_RPC_URL
vercel env add NEXT_PUBLIC_ARCIUM_OBSCURA_PROGRAM_ID
vercel --prod
```

Use `https://api.devnet.solana.com` and your deployed program id for the env values.

## 🎬 Demo & Proof of Work

- **Live Submission URL**: [Link to your Vercel deployment]
- **Devnet Program ID**: `29bVaakfeBhFm8BbqkehH3iMxHvRYwZ9QHecsi4kJ7on`
- **Video Demo**: [Link to Loom/YouTube]
- **Screenshots**:
  ![Landing Page](https://via.placeholder.com/800x450?text=Arcium+Obscura+Markets+Hero)
  ![Encrypted Bet](https://via.placeholder.com/800x450?text=Encrypted+Betting+Flow)

## 🛡️ Detailed Security Model

Arcium Obscura Markets is built on a **Commit-Reveal-MPC** architecture designed to maximize fairness in prediction environments.

1.  **Intent Privacy**: Individual bets are encrypted client-side using `X25519` key exchange and the `Rescue` cipher. Neither the Solana validator nor the RPC provider can see your chosen outcome or amount.
2.  **Anti-Herding**: Since only aggregate pool data is revealed, "whales" cannot trigger panic or FOMO by flashing large bets. The market moves purely on collective conviction.
3.  **MPC-Signed Payouts**: The final payout ratio is calculated inside the Arcium MPC cluster. The Solana program only accepts results signed by the cluster, preventing the program creator from manipulating resolution.
4.  **Local Receipt Model**: Your "Salt" never leaves your browser until you claim. This means that even if the entire MPC cluster was compromised *after* the market resolved, your original bet outcome remains secret until you reveal it to claim.
5.  **Future Scalability**: In production, the "Public Escrow" can be replaced by **Token-2022 Confidential Transfers** or Arcium-native tokens for 100% amount privacy during the settlement phase.

## 🏆 RTG Submission category

**Track**: Developer OFFCHAIN
**Category**: Privacy-Preserving Computation
**Integration**: Arcium MXE, signed-callbacks, encrypted state management.
