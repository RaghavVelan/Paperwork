import type { AutoPay } from "@/lib/finance/autopay";
import type { CustomCategory, Transaction } from "@/lib/finance/types";
import type { ThemeMode } from "@/lib/theme";

export type CurrencyCode =
  | "INR"
  | "USD"
  | "EUR"
  | "GBP"
  | "AED"
  | "SGD"
  | "AUD"
  | "CAD"
  | "JPY"
  | "MYR";

export type LocationMode = "off" | "ask" | "auto";

export type Profile = {
  displayName: string;
  currency: CurrencyCode;
  timezone: string;
  monthlyBudget: number;
  theme: ThemeMode;
  onboarded: boolean;
  /** Set when a new user agrees on onboarding. Older ledgers may omit it. */
  privacyAcceptedAt?: string;
  /** 0 Sunday … 6 Saturday. Default Monday. */
  backupWeekday: number;
  /** Weekly reminder on the chosen day. Default on. */
  backupReminder: boolean;
  lastBackupAt?: string;
  /** ISO date the reminder was dismissed for. */
  backupSnoozedOn?: string;
  /** Hide amounts on the home balance card. Missing in older ledgers → true. */
  hideBalance: boolean;
  /** Optional per-category monthly caps. Missing → none. */
  categoryBudgets: Record<string, number>;
  /** Where a new expense should look for a place. Missing → off. */
  locationMode: LocationMode;
};

/** The unit we persist today and will sync after login. */
export type LedgerSnapshot = {
  version: 1;
  profile: Profile;
  transactions: Transaction[];
  autoPays: AutoPay[];
  /** User-made categories. Missing on older ledgers. */
  categories: CustomCategory[];
  updatedAt: string;
};

export const DEFAULT_PROFILE: Profile = {
  displayName: "",
  currency: "INR",
  timezone: "Asia/Kolkata",
  monthlyBudget: 0,
  theme: "system",
  onboarded: false,
  backupWeekday: 1,
  backupReminder: true,
  hideBalance: true,
  categoryBudgets: {},
  locationMode: "off",
};
