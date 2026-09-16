export type TxType = "expense" | "income";

export type PaymentMethod = "upi" | "cash" | "card" | "netbanking" | "wallet";

export type CategoryId =
  | "food"
  | "groceries"
  | "transport"
  | "fuel"
  | "rent"
  | "utilities"
  | "shopping"
  | "entertainment"
  | "health"
  | "education"
  | "family"
  | "travel"
  | "other-out"
  | "salary"
  | "freelance"
  | "investment"
  | "gift"
  | "other-in";

export type Transaction = {
  id: string;
  type: TxType;
  amount: number;
  categoryId: CategoryId;
  note: string;
  date: string;
  payment: PaymentMethod;
  createdAt: string;
};

export type TabId = "home" | "calendar" | "insights";
