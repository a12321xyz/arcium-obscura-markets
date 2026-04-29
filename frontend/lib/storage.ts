import { LocalBetReceipt } from "@/lib/types";

const KEY = "arcium-obscura-market-bets";

export function getLocalBetReceipts(): LocalBetReceipt[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LocalBetReceipt[];
  } catch {
    return [];
  }
}

export function saveLocalBetReceipt(receipt: LocalBetReceipt) {
  const receipts = getLocalBetReceipts().filter(
    (item) => !(item.market === receipt.market && item.betId === receipt.betId)
  );
  receipts.unshift(receipt);
  window.localStorage.setItem(KEY, JSON.stringify(receipts.slice(0, 100)));
}

export function exportReceipts(): string {
  const receipts = getLocalBetReceipts();
  return JSON.stringify(receipts, null, 2);
}

export function importReceipts(json: string): { success: boolean; count: number; error?: string } {
  try {
    const imported = JSON.parse(json);
    if (!Array.isArray(imported)) {
      return { success: false, count: 0, error: "Invalid format: Expected an array of receipts." };
    }

    const current = getLocalBetReceipts();
    const currentKeys = new Set(current.map(r => `${r.market}-${r.betId}`));
    
    let added = 0;
    const toAdd: LocalBetReceipt[] = [];

    for (const item of imported) {
      // Basic validation of required fields
      if (item.market && item.betId && item.saltHex && item.commitmentHex) {
        const key = `${item.market}-${item.betId}`;
        if (!currentKeys.has(key)) {
          toAdd.push(item);
          added++;
        }
      }
    }

    if (toAdd.length > 0) {
      const updated = [...toAdd, ...current].slice(0, 500); // Allow more on import
      window.localStorage.setItem(KEY, JSON.stringify(updated));
    }

    return { success: true, count: added };
  } catch (e) {
    return { success: false, count: 0, error: "Failed to parse JSON file." };
  }
}
