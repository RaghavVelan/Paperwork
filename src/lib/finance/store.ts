import { useLayoutEffect, useState } from "react";
import { create } from "zustand";
import { detectTimezone } from "@/lib/ledger/timezones";
import { getLedgerRepository, toSnapshot } from "@/lib/ledger/repository";
import { DEFAULT_PROFILE, type Profile } from "@/lib/ledger/types";
import type { Transaction } from "./types";

type Draft = Omit<Transaction, "id" | "createdAt"> & { id?: string };

type FinanceState = {
  transactions: Transaction[];
  profile: Profile;
  addTransaction: (draft: Draft) => void;
  updateTransaction: (id: string, draft: Draft) => void;
  deleteTransaction: (id: string) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  completeOnboarding: (patch: Partial<Profile>) => void;
};

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `tx-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function persist(state: Pick<FinanceState, "profile" | "transactions">) {
  if (typeof window === "undefined") return;
  if (!state.profile.onboarded) return;
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
  transactions: [],
  profile: { ...DEFAULT_PROFILE },
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
  completeOnboarding: (patch) => {
    const profile = { ...get().profile, ...patch, onboarded: true };
    set({ profile });
    persist({ profile, transactions: get().transactions });
  },
}));

let didHydrate = false;

function applyPersistedLedger() {
  const existing = getLedgerRepository().loadSync();
  if (existing?.profile.onboarded) {
    const transactions = existing.transactions.filter((tx) => !tx.id.startsWith("seed-"));
    const profile = existing.profile;
    useFinanceStore.setState({ transactions, profile });
    if (transactions.length !== existing.transactions.length) {
      persist({ profile, transactions });
    }
    return;
  }
  useFinanceStore.setState({
    transactions: [],
    profile: { ...DEFAULT_PROFILE, timezone: detectTimezone() },
  });
}

/** Sync localStorage into the store before paint — no onboarding flash, no blank gate. */
export function useFinanceHydration(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useLayoutEffect(() => {
    if (!didHydrate) {
      applyPersistedLedger();
      didHydrate = true;
    }
    setHydrated(true);
  }, []);

  return hydrated;
}
