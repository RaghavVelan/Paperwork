import { DEFAULT_PROFILE, type LedgerSnapshot, type Profile } from "./types";
import { isCurrencyCode } from "./currencies";
import type { Transaction } from "@/lib/finance/types";
import { isThemeMode } from "@/lib/theme";

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
  save(snapshot: LedgerSnapshot): Promise<void>;
};

const KEY = "paperwork.ledger.v1";
const LEGACY_KEYS = ["rupiya-v1"];

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
  };
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

function parseSnapshot(raw: string): LedgerSnapshot | null {
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return null;
    const root = data as Record<string, unknown>;

    if (root.version === 1 && Array.isArray(root.transactions)) {
      return {
        version: 1,
        profile: coerceProfile(root.profile),
        transactions: root.transactions.filter(isTx),
        updatedAt: typeof root.updatedAt === "string" ? root.updatedAt : new Date().toISOString(),
      };
    }

    // Zustand persist envelope from Rupiya.
    const state = (root.state ?? root) as Record<string, unknown>;
    if (Array.isArray(state.transactions)) {
      const budget =
        typeof state.monthlyBudget === "number" ? state.monthlyBudget : DEFAULT_PROFILE.monthlyBudget;
        const inherited =
          state.profile && typeof state.profile === "object" ? (state.profile as object) : {};
        return {
          version: 1,
          profile: coerceProfile({ ...inherited, monthlyBudget: budget }),
          transactions: state.transactions.filter(isTx),
          updatedAt: new Date().toISOString(),
        };
    }
  } catch {
    return null;
  }
  return null;
}

export class LocalLedgerRepository implements LedgerRepository {
  constructor(private readonly store: StorageLike = memory()) {}

  async load(): Promise<LedgerSnapshot | null> {
    const fresh = this.store.getItem(KEY);
    if (fresh) return parseSnapshot(fresh);
    for (const legacy of LEGACY_KEYS) {
      const raw = this.store.getItem(legacy);
      if (!raw) continue;
      const snap = parseSnapshot(raw);
      if (snap) {
        await this.save(snap);
        this.store.removeItem(legacy);
        return snap;
      }
    }
    return null;
  }

  async save(snapshot: LedgerSnapshot): Promise<void> {
    const body: LedgerSnapshot = {
      version: 1,
      profile: coerceProfile(snapshot.profile),
      transactions: snapshot.transactions.filter(isTx),
      updatedAt: snapshot.updatedAt || new Date().toISOString(),
    };
    this.store.setItem(KEY, JSON.stringify(body));
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
}): LedgerSnapshot {
  return {
    version: 1,
    profile: input.profile,
    transactions: input.transactions,
    updatedAt: new Date().toISOString(),
  };
}
