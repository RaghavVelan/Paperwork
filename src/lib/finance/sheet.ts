import { create } from "zustand";
import type { TxType } from "@/lib/finance/types";

type SheetState = {
  open: boolean;
  profileOpen: boolean;
  auxOpen: boolean;
  editingId: string | null;
  draftDate: string;
  draftType: TxType;
  searchOpen: boolean;
  openNew: (date?: string, type?: TxType) => void;
  openEdit: (id: string) => void;
  openProfile: () => void;
  openSearch: () => void;
  setOpen: (open: boolean) => void;
  setProfileOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setAuxOpen: (open: boolean) => void;
};

export const useSheetStore = create<SheetState>((set) => ({
  open: false,
  profileOpen: false,
  auxOpen: false,
  editingId: null,
  draftDate: "",
  draftType: "expense",
  searchOpen: false,
  openNew: (date, type = "expense") =>
    set({
      open: true,
      editingId: null,
      draftDate: date ?? "",
      draftType: type,
    }),
  openEdit: (id) => set({ open: true, editingId: id }),
  openProfile: () => set({ profileOpen: true }),
  openSearch: () => set({ searchOpen: true }),
  setOpen: (open) =>
    set(
      open
        ? { open: true }
        : { open: false, editingId: null, draftType: "expense" },
    ),
  setProfileOpen: (profileOpen) => set({ profileOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setAuxOpen: (auxOpen) => set({ auxOpen }),
}));