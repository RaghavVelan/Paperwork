import { categoryById } from "@/lib/finance/categories";
import type { AutoPay } from "@/lib/finance/autopay";
import type { CustomCategory, Transaction } from "@/lib/finance/types";
import { parseLedgerJson, toSnapshot } from "@/lib/ledger/repository";
import type { LedgerSnapshot, Profile } from "@/lib/ledger/types";

export const TRANSFER_KIND = "paperwork.ledger.export";

export type LedgerExportFile = {
  kind: typeof TRANSFER_KIND;
  version: 1;
  exportedAt: string;
  snapshot: LedgerSnapshot;
};

export function buildExport(input: {
  profile: Profile;
  transactions: Transaction[];
  autoPays: AutoPay[];
  categories?: CustomCategory[];
}): string {
  const body: LedgerExportFile = {
    kind: TRANSFER_KIND,
    version: 1,
    exportedAt: new Date().toISOString(),
    snapshot: toSnapshot(input),
  };
  return `${JSON.stringify(body, null, 2)}\n`;
}

export function readExport(raw: string): LedgerSnapshot | null {
  return parseLedgerJson(raw);
}

export function transactionsToCsv(
  transactions: Transaction[],
  categories: CustomCategory[] = [],
): string {
  const header = ["date", "type", "amount", "category", "note", "payment"];
  const lines = [header.join(",")];
  const rows = [...transactions].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  for (const tx of rows) {
    lines.push(
      [
        tx.date,
        tx.type,
        String(tx.amount),
        categoryById(tx.categoryId, categories).label,
        tx.note,
        tx.payment,
      ]
        .map(csvCell)
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function exportFilename(todayIso: string): string {
  return `paperwork-${todayIso}.json`;
}

export function downloadJson(filename: string, body: string) {
  const blob = new Blob([body], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function summarizeSnapshot(snapshot: LedgerSnapshot): {
  name: string;
  entries: number;
  autoPays: number;
} {
  return {
    name: snapshot.profile.displayName.trim() || "Paperwork",
    entries: snapshot.transactions.length,
    autoPays: snapshot.autoPays.length,
  };
}
