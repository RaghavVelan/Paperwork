import type { Transaction } from "@/lib/finance/types";

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

export type Profile = {
  displayName: string;
  currency: CurrencyCode;
  timezone: string;
  monthlyBudget: number;
};

/** The unit we persist today and will sync after login. */
export type LedgerSnapshot = {
  version: 1;
  profile: Profile;
  transactions: Transaction[];
  updatedAt: string;
};

export const DEFAULT_PROFILE: Profile = {
  displayName: "",
  currency: "INR",
  timezone: "Asia/Kolkata",
  monthlyBudget: 40000,
};
