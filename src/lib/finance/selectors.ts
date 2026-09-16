import { monthKey } from "@/lib/money";
import type { CategoryId, Transaction, TxType } from "./types";

export type DayRollup = {
  date: string;
  income: number;
  expense: number;
  net: number;
  count: number;
};

export type MonthSummary = {
  income: number;
  expense: number;
  net: number;
  count: number;
  byDay: Map<string, DayRollup>;
  byCategory: Map<CategoryId, number>;
};

export function inMonth(tx: Transaction, month: string): boolean {
  return tx.date.startsWith(month);
}

export function summarize(transactions: Transaction[], month: string): MonthSummary {
  const byDay = new Map<string, DayRollup>();
  const byCategory = new Map<CategoryId, number>();
  let income = 0;
  let expense = 0;

  for (const tx of transactions) {
    if (!inMonth(tx, month)) continue;
    if (tx.type === "income") income += tx.amount;
    else expense += tx.amount;

    const day = byDay.get(tx.date) ?? {
      date: tx.date,
      income: 0,
      expense: 0,
      net: 0,
      count: 0,
    };
    if (tx.type === "income") day.income += tx.amount;
    else day.expense += tx.amount;
    day.net = day.income - day.expense;
    day.count += 1;
    byDay.set(tx.date, day);

    if (tx.type === "expense") {
      byCategory.set(tx.categoryId, (byCategory.get(tx.categoryId) ?? 0) + tx.amount);
    }
  }

  return {
    income,
    expense,
    net: income - expense,
    count: [...byDay.values()].reduce((n, d) => n + d.count, 0),
    byDay,
    byCategory,
  };
}

export function transactionsOnDate(
  transactions: Transaction[],
  date: string,
): Transaction[] {
  return transactions
    .filter((t) => t.date === date)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function monthFromDate(date: string): string {
  return monthKey(date);
}

export function filterByType(
  transactions: Transaction[],
  type: TxType | "all",
): Transaction[] {
  if (type === "all") return transactions;
  return transactions.filter((t) => t.type === type);
}
