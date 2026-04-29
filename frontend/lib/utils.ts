import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatLamports(lamports: number | bigint) {
  const value = Number(lamports) / 1_000_000_000;
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 4 })} SOL`;
}

export function formatDateTime(unixSeconds: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(unixSeconds * 1000));
}

export function truncateAddress(address: string, size = 4) {
  if (address.length <= size * 2) return address;
  return `${address.slice(0, size)}...${address.slice(-size)}`;
}

export function percent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value * 100)}%`;
}

export function asNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (value && typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function") {
    return value.toNumber();
  }
  return 0;
}
