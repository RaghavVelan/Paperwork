export type TxType = "expense" | "income";

export type PaymentMethod = "upi" | "cash" | "card" | "netbanking" | "wallet";

export type CategoryId = string;

export type CustomCategory = {
  id: string;
  label: string;
  type: TxType;
};

export type Transaction = {
  id: string;
  type: TxType;
  amount: number;
  categoryId: CategoryId;
  note: string;
  date: string;
  payment: PaymentMethod;
  createdAt: string;
  autoPayId?: string;
};

export type TabId = "home" | "calendar" | "insights";
