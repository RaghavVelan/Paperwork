import { useEffect, useState } from "react";
import { create } from "zustand";
import { detectTimezone } from "@/lib/ledger/timezones";
import { getLedgerRepository, toSnapshot } from "@/lib/ledger/repository";
import { DEFAULT_PROFILE, type Profile } from "@/lib/ledger/types";
import { buildSeedTransactions } from "./seed";
import type { Transaction } from "./types";

type Draft = Omit<Transaction, "id" | "createdAt"> & { id?: string };

type FinanceState = {
  transactions: Transaction[];
  profile: Profile;
  hasSeeded: boolean;
  addTransaction: (draft: Draft) => void;
  updateTransaction: (id: string, draft: Draft) => void;
  deleteTransaction: (id: string) => void;
  updateProfile: (patch: Partial<Profile>) => void;
};

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `tx-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function persist(state: Pick<FinanceState, "profile" | "transactions">) {
  if (typeof window === "undefined") return;
  void getLedgerRepository().save(toSnapshot(state));
}

function fromDraft(draft: Draft): Transaction {
  return {
    id: draft.id ?? newId(),
    createdAt: new Date().toISOString(),
    type: draft.type,
    amount: draft.amount,
    categoryId: draft.categoryId,
    note: draft.note,
    date: draft.date,
    payment: draft.payment,
  };
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: buildSeedTransactions(),
  profile: { ...DEFAULT_PROFILE },
  hasSeeded: true,
  addTransaction: (draft) => {
    const transactions = [fromDraft(draft), ...get().transactions];
    set({ transactions });
    persist({ profile: get().profile, transactions });
  },
  updateTransaction: (id, draft) => {
    const transactions = get().transactions.map((t) =>
      t.id === id
        ? {
            ...t,
            type: draft.type,
            amount: draft.amount,
            categoryId: draft.categoryId,
            note: draft.note,
            date: draft.date,
            payment: draft.payment,
          }
        : t,
    );
    set({ transactions });
    persist({ profile: get().profile, transactions });
  },
  deleteTransaction: (id) => {
    const transactions = get().transactions.filter((t) => t.id !== id);
    set({ transactions });
    persist({ profile: get().profile, transactions });
  },
  updateProfile: (patch) => {
    const profile = { ...get().profile, ...patch };
    set({ profile });
    persist({ profile, transactions: get().transactions });
  },
}));

export function useFinanceHydration(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const existing = await getLedgerRepository().load();
        if (!alive) return;
        if (existing) {
          useFinanceStore.setState({
            transactions: existing.transactions,
            profile: existing.profile,
            hasSeeded: true,
          });
        } else {
          const state = useFinanceStore.getState();
          const profile = { ...state.profile, timezone: detectTimezone() };
          useFinanceStore.setState({ profile });
          persist({ profile, transactions: state.transactions });
        }
      } finally {
        if (alive) setHydrated(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return hydrated;
}
