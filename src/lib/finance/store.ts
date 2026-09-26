import { useLayoutEffect, useState } from "react";
import { create } from "zustand";
import { dueDates, type AutoPay } from "@/lib/finance/autopay";
import { detectTimezone } from "@/lib/ledger/timezones";
import { getLedgerRepository, toSnapshot } from "@/lib/ledger/repository";
import { DEFAULT_PROFILE, type LedgerSnapshot, type Profile } from "@/lib/ledger/types";
import { zonedISODate } from "@/lib/time";
import type { Transaction } from "./types";

type Draft = Omit<Transaction, "id" | "createdAt"> & { id?: string };
type AutoPayDraft = Omit<AutoPay, "id" | "createdAt" | "postedMonths"> & {
  id?: string;
  postedMonths?: string[];
};

type FinanceState = {
  transactions: Transaction[];
  autoPays: AutoPay[];
  profile: Profile;
  addTransaction: (draft: Draft) => void;
  updateTransaction: (id: string, draft: Draft) => void;
  deleteTransaction: (id: string) => void;
  addAutoPay: (draft: AutoPayDraft) => void;
  updateAutoPay: (id: string, draft: AutoPayDraft) => void;
  deleteAutoPay: (id: string) => void;
  materializeAutoPays: (todayIso: string) => void;
  replaceLedger: (snapshot: LedgerSnapshot) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  completeOnboarding: (patch: Partial<Profile>) => void;
};

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `tx-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function persist(state: Pick<FinanceState, "profile" | "transactions" | "autoPays">) {
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
    autoPayId: draft.autoPayId,
  };
}

function applyDue(autoPays: AutoPay[], transactions: Transaction[], todayIso: string) {
  let nextPays = autoPays;
  let nextTx = transactions;
  let changed = false;
  for (const ap of autoPays) {
    const dues = dueDates(ap, todayIso);
    if (dues.length === 0) continue;
    changed = true;
    const months = [...ap.postedMonths];
    for (const date of dues) {
      const month = date.slice(0, 7);
      if (!months.includes(month)) months.push(month);
      nextTx = [
        {
          id: newId(),
          createdAt: new Date().toISOString(),
          type: "expense" as const,
          amount: ap.amount,
          categoryId: ap.categoryId,
          note: ap.name,
          date,
          payment: ap.payment,
          autoPayId: ap.id,
        },
        ...nextTx,
      ];
    }
    nextPays = nextPays.map((p) => (p.id === ap.id ? { ...p, postedMonths: months } : p));
  }
  return { autoPays: nextPays, transactions: nextTx, changed };
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [],
  autoPays: [],
  profile: { ...DEFAULT_PROFILE },
  addTransaction: (draft) => {
    const transactions = [fromDraft(draft), ...get().transactions];
    set({ transactions });
    persist({ profile: get().profile, transactions, autoPays: get().autoPays });
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
            autoPayId: t.autoPayId,
          }
        : t,
    );
    set({ transactions });
    persist({ profile: get().profile, transactions, autoPays: get().autoPays });
  },
  deleteTransaction: (id) => {
    const transactions = get().transactions.filter((t) => t.id !== id);
    set({ transactions });
    persist({ profile: get().profile, transactions, autoPays: get().autoPays });
  },
  addAutoPay: (draft) => {
    const item: AutoPay = {
      id: draft.id ?? newId(),
      createdAt: new Date().toISOString(),
      name: draft.name.trim(),
      kind: draft.kind,
      amount: draft.amount,
      categoryId: draft.categoryId,
      payment: draft.payment,
      dayOfMonth: draft.dayOfMonth,
      startDate: draft.startDate,
      endDate: draft.endDate,
      postedMonths: draft.postedMonths ?? [],
    };
    const autoPays = [item, ...get().autoPays];
    const todayIso = zonedISODate(new Date(), get().profile.timezone);
    const next = applyDue(autoPays, get().transactions, todayIso);
    set({ autoPays: next.autoPays, transactions: next.transactions });
    persist({
      profile: get().profile,
      transactions: next.transactions,
      autoPays: next.autoPays,
    });
  },
  updateAutoPay: (id, draft) => {
    const autoPays = get().autoPays.map((p) =>
      p.id === id
        ? {
            ...p,
            name: draft.name.trim(),
            kind: draft.kind,
            amount: draft.amount,
            categoryId: draft.categoryId,
            payment: draft.payment,
            dayOfMonth: draft.dayOfMonth,
            startDate: draft.startDate,
            endDate: draft.endDate,
          }
        : p,
    );
    const todayIso = zonedISODate(new Date(), get().profile.timezone);
    const next = applyDue(autoPays, get().transactions, todayIso);
    set({ autoPays: next.autoPays, transactions: next.transactions });
    persist({
      profile: get().profile,
      transactions: next.transactions,
      autoPays: next.autoPays,
    });
  },
  deleteAutoPay: (id) => {
    const autoPays = get().autoPays.filter((p) => p.id !== id);
    set({ autoPays });
    persist({ profile: get().profile, transactions: get().transactions, autoPays });
  },
  materializeAutoPays: (todayIso) => {
    const next = applyDue(get().autoPays, get().transactions, todayIso);
    if (!next.changed) return;
    set({ autoPays: next.autoPays, transactions: next.transactions });
    persist({
      profile: get().profile,
      transactions: next.transactions,
      autoPays: next.autoPays,
    });
  },
  replaceLedger: (snapshot) => {
    const profile = { ...snapshot.profile, onboarded: true };
    const todayIso = zonedISODate(new Date(), profile.timezone);
    const next = applyDue(snapshot.autoPays ?? [], snapshot.transactions, todayIso);
    set({
      profile,
      transactions: next.transactions,
      autoPays: next.autoPays,
    });
    persist({
      profile,
      transactions: next.transactions,
      autoPays: next.autoPays,
    });
  },
  updateProfile: (patch) => {
    const profile = { ...get().profile, ...patch };
    set({ profile });
    persist({ profile, transactions: get().transactions, autoPays: get().autoPays });
  },
  completeOnboarding: (patch) => {
    const profile = { ...get().profile, ...patch, onboarded: true };
    set({ profile });
    persist({ profile, transactions: get().transactions, autoPays: get().autoPays });
  },
}));

let didHydrate = false;

function applyPersistedLedger() {
  const existing = getLedgerRepository().loadSync();
  if (existing?.profile.onboarded) {
    const transactions = existing.transactions.filter((tx) => !tx.id.startsWith("seed-"));
    const profile = existing.profile;
    const autoPays = existing.autoPays ?? [];
    const todayIso = zonedISODate(new Date(), profile.timezone);
    const next = applyDue(autoPays, transactions, todayIso);
    useFinanceStore.setState({
      transactions: next.transactions,
      autoPays: next.autoPays,
      profile,
    });
    if (next.changed || transactions.length !== existing.transactions.length) {
      persist({ profile, transactions: next.transactions, autoPays: next.autoPays });
    }
    return;
  }
  useFinanceStore.setState({
    transactions: [],
    autoPays: [],
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
