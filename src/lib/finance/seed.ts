import { toISODate } from "@/lib/money";
import type { CategoryId, PaymentMethod, Transaction } from "./types";

type Seed = {
  day: number;
  type: "expense" | "income";
  amount: number;
  categoryId: CategoryId;
  note: string;
  payment: PaymentMethod;
};

const TEMPLATE: Seed[] = [
  { day: 1, type: "income", amount: 78000, categoryId: "salary", note: "Monthly salary", payment: "netbanking" },
  { day: 1, type: "expense", amount: 16500, categoryId: "rent", note: "House rent", payment: "upi" },
  { day: 2, type: "expense", amount: 2140, categoryId: "groceries", note: "BigBasket", payment: "upi" },
  { day: 3, type: "expense", amount: 1890, categoryId: "utilities", note: "Electricity", payment: "upi" },
  { day: 3, type: "expense", amount: 420, categoryId: "food", note: "Lunch", payment: "upi" },
  { day: 4, type: "expense", amount: 180, categoryId: "transport", note: "Bus pass top-up", payment: "wallet" },
  { day: 5, type: "expense", amount: 599, categoryId: "utilities", note: "Mobile recharge", payment: "upi" },
  { day: 6, type: "expense", amount: 2450, categoryId: "fuel", note: "Petrol", payment: "card" },
  { day: 7, type: "expense", amount: 340, categoryId: "food", note: "Swiggy", payment: "upi" },
  { day: 8, type: "income", amount: 9500, categoryId: "freelance", note: "Weekend project", payment: "upi" },
  { day: 8, type: "expense", amount: 1299, categoryId: "shopping", note: "T-shirts", payment: "card" },
  { day: 9, type: "expense", amount: 270, categoryId: "health", note: "Pharmacy", payment: "cash" },
  { day: 10, type: "expense", amount: 499, categoryId: "entertainment", note: "Hotstar", payment: "card" },
  { day: 11, type: "expense", amount: 1680, categoryId: "groceries", note: "Vegetable market", payment: "cash" },
  { day: 11, type: "expense", amount: 220, categoryId: "food", note: "Filter coffee", payment: "upi" },
  { day: 12, type: "expense", amount: 5000, categoryId: "family", note: "Sent home", payment: "upi" },
  { day: 13, type: "expense", amount: 560, categoryId: "food", note: "Dinner out", payment: "upi" },
  { day: 14, type: "expense", amount: 890, categoryId: "transport", note: "Cab", payment: "upi" },
  { day: 16, type: "expense", amount: 320, categoryId: "entertainment", note: "Movie", payment: "card" },
  { day: 18, type: "expense", amount: 1450, categoryId: "shopping", note: "Home supplies", payment: "upi" },
  { day: 20, type: "expense", amount: 750, categoryId: "food", note: "Weekend biryani", payment: "upi" },
  { day: 22, type: "income", amount: 2500, categoryId: "gift", note: "Birthday gift", payment: "upi" },
  { day: 24, type: "expense", amount: 2100, categoryId: "fuel", note: "Petrol", payment: "card" },
  { day: 26, type: "expense", amount: 380, categoryId: "health", note: "Clinic", payment: "cash" },
];

export function buildSeedTransactions(now = new Date()): Transaction[] {
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const cap = Math.min(today, lastDay);

  return TEMPLATE.filter((row) => row.day <= cap).map((row, i) => {
    const date = toISODate(new Date(year, month, row.day));
    return {
      id: `seed-${year}-${month + 1}-${i}`,
      type: row.type,
      amount: row.amount,
      categoryId: row.categoryId,
      note: row.note,
      date,
      payment: row.payment,
      createdAt: new Date(year, month, row.day, 10 + (i % 8), 12).toISOString(),
    };
  });
}
