"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { BarChart3, LockKeyhole, PlusCircle, TicketCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const WalletMultiButtonDynamic = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

const nav = [
  { href: "/", label: "Markets", icon: BarChart3 },
  { href: "/create", label: "Create", icon: PlusCircle },
  { href: "/my-bets", label: "My Bets", icon: TicketCheck }
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/75 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 ring-1 ring-primary/30 shadow-glow">
            <LockKeyhole className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-base font-black tracking-tight sm:text-lg">Arcium Obscura Markets</p>
            <p className="hidden text-xs text-muted-foreground sm:block">Prediction and opinion markets, privately settled</p>
          </div>
        </Link>

        <nav className="hidden items-center rounded-full border border-white/10 bg-white/5 p-1 md:flex">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground",
                  active && "bg-white/10 text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <WalletMultiButtonDynamic />
        </div>
      </div>

      <nav className="grid grid-cols-3 border-t border-white/10 md:hidden">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-center gap-2 px-2 py-3 text-xs font-semibold text-muted-foreground",
                active && "text-primary"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
