import { coerceAutoPay, type AutoPay } from "@/lib/finance/autopay";
import type { CustomCategory, Transaction } from "@/lib/finance/types";
import { isThemeMode } from "@/lib/theme";
import { isCurrencyCode } from "./currencies";
import { isBackupWeekday } from "./backup";
import { DEFAULT_PROFILE, type LedgerSnapshot, type Profile } from "./types";

/**
 * Persistence boundary.
 *
 * Today: localStorage via LocalLedgerRepository.
 * Later (login + db sync): implement LedgerRepository against an API and
 * swap the return of getLedgerRepository(). The Zustand store never talks
 * to localStorage or fetch directly — only this interface.
 */
export type LedgerRepository = {
  load(): Promise<LedgerSnapshot | null>;
  loadSync(): LedgerSnapshot | null;
  save(snapshot: LedgerSnapshot): Promise<void>;
};

export const LEDGER_KEY = "paperwork.ledger.v5";

const LEGACY_KEYS = [
  "paperwork.ledger.v4",
  "paperwork.ledger.v3",
  "paperwork.ledger.v2",
  "paperwork.ledger.v1",
  "rupiya-v1",
  "meedi-v1",
];

const noop = {
  getItem: () => null as string | null,
  setItem: () => {},
  removeItem: () => {},
};

function memory(): StorageLike {
  if (typeof window === "undefined") return noop;
  try {
    const probe = "__paperwork_ok";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return noop;
  }
}

type StorageLike = {
  getItem: (k: string) => string | null;
  setItem: (k: string, v: string) => void;
  removeItem: (k: string) => void;
};

function coerceProfile(raw: unknown): Profile {
  const p = (raw ?? {}) as Partial<Profile>;
  return {
    displayName: typeof p.displayName === "string" ? p.displayName.slice(0, 48) : "",
    currency: typeof p.currency === "string" && isCurrencyCode(p.currency) ? p.currency : "INR",
    timezone: typeof p.timezone === "string" && p.timezone.length > 0 ? p.timezone : DEFAULT_PROFILE.timezone,
    monthlyBudget:
      typeof p.monthlyBudget === "number" && Number.isFinite(p.monthlyBudget)
        ? Math.max(0, p.monthlyBudget)
        : DEFAULT_PROFILE.monthlyBudget,
    theme: isThemeMode(p.theme) ? p.theme : DEFAULT_PROFILE.theme,
    onboarded: p.onboarded === true,
    privacyAcceptedAt:
      typeof p.privacyAcceptedAt === "string" && p.privacyAcceptedAt.length > 0
        ? p.privacyAcceptedAt
        : undefined,
    backupWeekday: isBackupWeekday(p.backupWeekday) ? p.backupWeekday : 1,
    backupReminder: p.backupReminder !== false,
    lastBackupAt:
      typeof p.lastBackupAt === "string" && p.lastBackupAt.length > 0 ? p.lastBackupAt : undefined,
    backupSnoozedOn:
      typeof p.backupSnoozedOn === "string" && p.backupSnoozedOn.length > 0
        ? p.backupSnoozedOn
        : undefined,
    hideBalance: p.hideBalance !== false,
  };
}

function coerceCategories(raw: unknown): CustomCategory[] {
  if (!Array.isArray(raw)) return [];
  const out: CustomCategory[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const c = item as CustomCategory;
    const id = typeof c.id === "string" ? c.id.trim() : "";
    const label = typeof c.label === "string" ? c.label.trim().replace(/\s+/g, " ").slice(0, 24) : "";
    if (!id || id.length > 80 || !label) continue;
    if (c.type !== "expense" && c.type !== "income") continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label, type: c.type });
  }
  return out;
}

function isTx(value: unknown): value is Transaction {
  if (!value || typeof value !== "object") return false;
  const t = value as Transaction;
  return (
    typeof t.id === "string" &&
    (t.type === "expense" || t.type === "income") &&
    typeof t.amount === "number" &&
    typeof t.date === "string"
  );
}

function coerceSnapshot(root: Record<string, unknown>): LedgerSnapshot | null {
  if (root.version !== 1 || !Array.isArray(root.transactions)) return null;
  const autoPays: AutoPay[] = Array.isArray(root.autoPays)
    ? root.autoPays.map(coerceAutoPay).filter((v): v is AutoPay => v !== null)
    : [];
  return {
    version: 1,
    profile: coerceProfile(root.profile),
    transactions: root.transactions.filter(isTx).map((t) => ({
      ...t,
      autoPayId: typeof t.autoPayId === "string" ? t.autoPayId : undefined,
    })),
    autoPays,
    categories: coerceCategories(root.categories),
    updatedAt: typeof root.updatedAt === "string" ? root.updatedAt : new Date().toISOString(),
  };
}

export function parseLedgerJson(raw: string): LedgerSnapshot | null {
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return null;
    const root = data as Record<string, unknown>;
    if (root.kind === "paperwork.ledger.export" && root.snapshot && typeof root.snapshot === "object") {
      return coerceSnapshot(root.snapshot as Record<string, unknown>);
    }
    return coerceSnapshot(root);
  } catch {
    return null;
  }
}

export class LocalLedgerRepository implements LedgerRepository {
  constructor(private readonly store: StorageLike = memory()) {}

  loadSync(): LedgerSnapshot | null {
    for (const key of LEGACY_KEYS) {
      try {
        this.store.removeItem(key);
      } catch {
        /* ignore */
      }
    }
    const fresh = this.store.getItem(LEDGER_KEY);
    if (fresh) return parseLedgerJson(fresh);
    return null;
  }

  async load(): Promise<LedgerSnapshot | null> {
    return this.loadSync();
  }

  async save(snapshot: LedgerSnapshot): Promise<void> {
    const body: LedgerSnapshot = {
      version: 1,
      profile: coerceProfile(snapshot.profile),
      transactions: snapshot.transactions.filter(isTx),
      autoPays: snapshot.autoPays ?? [],
      categories: coerceCategories(snapshot.categories),
      updatedAt: snapshot.updatedAt || new Date().toISOString(),
    };
    this.store.setItem(LEDGER_KEY, JSON.stringify(body));
  }
}

let singleton: LedgerRepository | null = null;

/** Swap this factory when a remote adapter exists. */
export function getLedgerRepository(): LedgerRepository {
  if (!singleton) singleton = new LocalLedgerRepository();
  return singleton;
}

export function toSnapshot(input: {
  profile: Profile;
  transactions: Transaction[];
  autoPays: AutoPay[];
  categories?: CustomCategory[];
}): LedgerSnapshot {
  return {
    version: 1,
    profile: input.profile,
    transactions: input.transactions,
    autoPays: input.autoPays,
    categories: input.categories ?? [],
    updatedAt: new Date().toISOString(),
  };
}
