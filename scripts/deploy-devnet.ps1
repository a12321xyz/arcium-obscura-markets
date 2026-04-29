$ErrorActionPreference = "Stop"
solana config set --url devnet
arcium build
arcium deploy --provider.cluster devnet
npm --prefix frontend run build
