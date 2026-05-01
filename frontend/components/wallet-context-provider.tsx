"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import type { Adapter } from "@solana/wallet-adapter-base";
import "@solana/wallet-adapter-react-ui/styles.css";
import { RPC_URL } from "@/lib/constants";

export function WalletContextProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [wallets, setWallets] = useState<Adapter[]>([]);

  useEffect(() => {
    setMounted(true);
    import("@solana/wallet-adapter-phantom").then((mod) => {
      import("@solana/wallet-adapter-solflare").then((solflareMod) => {
        setWallets([
          new mod.PhantomWalletAdapter(),
          new solflareMod.SolflareWalletAdapter(),
        ]);
      });
    });
  }, []);

  if (!mounted) {
    return (
      <div style={{ visibility: "hidden" }}>{children}</div>
    );
  }

  return (
    <ConnectionProvider endpoint={RPC_URL} config={{ commitment: "confirmed" }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
