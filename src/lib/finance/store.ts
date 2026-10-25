import { useLayoutEffect, useState } from "react";
import { create } from "zustand";
import { categoriesFor } from "@/lib/finance/categories";
import { dueDates, type AutoPay } from "@/lib/finance/autopay";
import { detectTimezone } from "@/lib/ledger/timezones";
import { getLedgerRepository, toSnapshot } from "@/lib/ledger/repository";
import { DEFAULT_PROFILE, type LedgerSnapshot, type Profile } from "@/lib/ledger/types";
import { zonedISODate } from "@/lib/time";
import type { CustomCategory, Transaction } from "./types";

type Draft = Omit<Transaction, "id" | "createdAt"> & { id?: string };
type AutoPayDraft = Omit<AutoPay, "id" | "createdAt" | "postedMonths" | "postedDates"> & {
  id?: string;
  postedMonths?: string[];
  postedDates?: string[];
};

type FinanceState = {
  transactions: Transaction[];
  autoPays: AutoPay[];
  categories: CustomCategory[];
  profile: Profile;
  addTransaction: (draft: Draft) => void;
  updateTransaction: (id: string, draft: Draft) => void;
  deleteTransaction: (id: string) => void;
  addAutoPay: (draft: AutoPayDraft) => void;
  updateAutoPay: (id: string, draft: AutoPayDraft) => void;
  deleteAutoPay: (id: string) => void;
  materializeAutoPays: (todayIso: string) => void;
  replaceLedger: (snapshot: LedgerSnapshot) => void;
  addCategory: (label: string, type: Transaction["type"]) => CustomCategory | null;
  renameCategory: (id: string, label: string) => boolean;
  deleteCategory: (id: string) => void;
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
  const categories = useFinanceStore.getState().categories;
  void getLedgerRepository().save(toSnapshot({ ...state, categories }));
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
    const postedDates = [...ap.postedDates];
    for (const date of dues) {
      const month = date.slice(0, 7);
      if (ap.frequency === "monthly" && !months.includes(month)) months.push(month);
      if (!postedDates.includes(date)) postedDates.push(date);
      nextTx = [
        {
          id: newId(),
          createdAt: new Date().toISOString(),
          type: ap.type,
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
    nextPays = nextPays.map((p) =>
      p.id === ap.id ? { ...p, postedMonths: months, postedDates } : p,
    );
  }
  return { autoPays: nextPays, transactions: nextTx, changed };
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [],
  autoPays: [],
  categories: [],
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
      type: draft.type,
      amount: draft.amount,
      categoryId: draft.categoryId,
      payment: draft.payment,
      frequency: draft.frequency,
      dayOfMonth: draft.dayOfMonth,
      weekday: draft.weekday,
      monthOfYear: draft.monthOfYear,
      startDate: draft.startDate,
      endDate: draft.endDate,
      postedMonths: draft.postedMonths ?? [],
      postedDates: draft.postedDates ?? [],
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
            type: draft.type,
            amount: draft.amount,
            categoryId: draft.categoryId,
            payment: draft.payment,
            frequency: draft.frequency,
            dayOfMonth: draft.dayOfMonth,
            weekday: draft.weekday,
            monthOfYear: draft.monthOfYear,
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
    const categories = snapshot.categories ?? [];
    const todayIso = zonedISODate(new Date(), profile.timezone);
    const next = applyDue(snapshot.autoPays ?? [], snapshot.transactions, todayIso);
    set({
      profile,
      categories,
      transactions: next.transactions,
      autoPays: next.autoPays,
    });
    persist({
      profile,
      transactions: next.transactions,
      autoPays: next.autoPays,
    });
  },
  addCategory: (label, type) => {
    const name = label.trim().replace(/\s+/g, " ").slice(0, 24);
    if (!name) return null;
    const existing = categoriesFor(type, get().categories);
    if (existing.some((c) => c.label.toLowerCase() === name.toLowerCase())) return null;
    const item: CustomCategory = { id: `c-${newId()}`, label: name, type };
    const categories = [...get().categories, item];
    set({ categories });
    persist({
      profile: get().profile,
      transactions: get().transactions,
      autoPays: get().autoPays,
    });
    return item;
  },
  renameCategory: (id, label) => {
    const name = label.trim().replace(/\s+/g, " ").slice(0, 24);
    const current = get().categories.find((c) => c.id === id);
    if (!current || !name) return false;
    const existing = categoriesFor(current.type, get().categories);
    if (existing.some((c) => c.id !== id && c.label.toLowerCase() === name.toLowerCase())) return false;
    const categories = get().categories.map((c) => (c.id === id ? { ...c, label: name } : c));
    set({ categories });
    persist({
      profile: get().profile,
      transactions: get().transactions,
      autoPays: get().autoPays,
    });
    return true;
  },
  deleteCategory: (id) => {
    const current = get().categories.find((c) => c.id === id);
    if (!current) return;
    const fallback = current.type === "income" ? "other-in" : "other-out";
    const transactions = get().transactions.map((tx) =>
      tx.categoryId === id ? { ...tx, categoryId: fallback } : tx,
    );
    const autoPays = get().autoPays.map((ap) =>
      ap.categoryId === id ? { ...ap, categoryId: fallback } : ap,
    );
    const categories = get().categories.filter((c) => c.id !== id);
    const categoryBudgets = { ...get().profile.categoryBudgets };
    delete categoryBudgets[id];
    const profile = { ...get().profile, categoryBudgets };
    set({ transactions, autoPays, categories, profile });
    persist({ profile, transactions, autoPays });
  },
  updateProfile: (patch) => {
    const profile = { ...get().profile, ...patch };
    set({ profile });
    persist({ profile, transactions: get().transactions, autoPays: get().autoPays });
  },
  completeOnboarding: (patch) => {
    const profile = {
      ...get().profile,
      ...patch,
      onboarded: true,
      privacyAcceptedAt: patch.privacyAcceptedAt ?? new Date().toISOString(),
    };
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
    const categories = existing.categories ?? [];
    const todayIso = zonedISODate(new Date(), profile.timezone);
    const next = applyDue(autoPays, transactions, todayIso);
    useFinanceStore.setState({
      transactions: next.transactions,
      autoPays: next.autoPays,
      categories,
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
    categories: [],
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
