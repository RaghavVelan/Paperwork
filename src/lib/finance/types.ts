export type TxType = "expense" | "income";

export type PaymentMethod = "upi" | "cash" | "card" | "netbanking" | "wallet";

export type TxLocation = {
  lat: number;
  lng: number;
  label?: string;
  source: "gps" | "map";
};

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
  /** Set only on an expense, and only when the user adds a place. */
  location?: TxLocation;
};

export type TabId = "home" | "calendar" | "insights";
