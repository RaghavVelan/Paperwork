import type { CustomCategory, PaymentMethod, TxType } from "./types";

export const INVESTMENT_CATEGORY_ID = "investments";

export type CategoryDef = {
  id: string;
  label: string;
  type: TxType;
};

export const CATEGORIES: CategoryDef[] = [
  { id: "food", label: "Food & dining", type: "expense" },
  { id: "groceries", label: "Groceries", type: "expense" },
  { id: "transport", label: "Transport", type: "expense" },
  { id: "fuel", label: "Fuel", type: "expense" },
  { id: "rent", label: "Rent", type: "expense" },
  { id: "utilities", label: "Bills", type: "expense" },
  { id: "shopping", label: "Shopping", type: "expense" },
  { id: "entertainment", label: "Fun", type: "expense" },
  { id: "health", label: "Health", type: "expense" },
  { id: "education", label: "Education", type: "expense" },
  { id: "family", label: "Family", type: "expense" },
  { id: "travel", label: "Travel", type: "expense" },
  { id: INVESTMENT_CATEGORY_ID, label: "Investments", type: "expense" },
  { id: "other-out", label: "Other", type: "expense" },
  { id: "salary", label: "Salary", type: "income" },
  { id: "freelance", label: "Freelance", type: "income" },
  { id: "investment", label: "Returns", type: "income" },
  { id: "gift", label: "Gift", type: "income" },
  { id: "other-in", label: "Other", type: "income" },
];

export const PAYMENTS: { id: PaymentMethod; label: string }[] = [
  { id: "upi", label: "UPI" },
  { id: "cash", label: "Cash" },
  { id: "card", label: "Card" },
  { id: "netbanking", label: "Net banking" },
  { id: "wallet", label: "Wallet" },
];

const builtinById = new Map(CATEGORIES.map((c) => [c.id, c]));

export function categoryById(id: string, custom: CustomCategory[] = []): CategoryDef {
  return (
    builtinById.get(id) ??
    custom.find((c) => c.id === id) ?? { id, label: "Unknown", type: "expense" }
  );
}

export function categoriesFor(type: TxType, custom: CustomCategory[] = []): CategoryDef[] {
  const extra = custom.filter((c) => c.type === type);
  const built = CATEGORIES.filter((c) => c.type === type);
  const rest = built.filter((c) => c.id !== "other-out" && c.id !== "other-in");
  const other = built.filter((c) => c.id === "other-out" || c.id === "other-in");
  return [...rest, ...extra, ...other];
}

export function defaultCategory(type: TxType): string {
  return type === "income" ? "salary" : "food";
}

export function isInvestmentCategory(id: string): boolean {
  return id === INVESTMENT_CATEGORY_ID;
}

export function paymentLabel(id: PaymentMethod): string {
  return PAYMENTS.find((p) => p.id === id)?.label ?? id;
}
