import { create } from "zustand";

type SheetState = {
  open: boolean;
  profileOpen: boolean;
  auxOpen: boolean;
  editingId: string | null;
  draftDate: string;
  openNew: (date?: string) => void;
  openEdit: (id: string) => void;
  openProfile: () => void;
  setOpen: (open: boolean) => void;
  setProfileOpen: (open: boolean) => void;
  setAuxOpen: (open: boolean) => void;
};

export const useSheetStore = create<SheetState>((set) => ({
  open: false,
  profileOpen: false,
  auxOpen: false,
  editingId: null,
  draftDate: "",
  openNew: (date) =>
    set({
      open: true,
      editingId: null,
      draftDate: date ?? "",
    }),
  openEdit: (id) => set({ open: true, editingId: id }),
  openProfile: () => set({ profileOpen: true }),
  setOpen: (open) =>
    set(
      open
        ? { open: true }
        : { open: false, editingId: null },
    ),
  setProfileOpen: (profileOpen) => set({ profileOpen }),
  setAuxOpen: (auxOpen) => set({ auxOpen }),
}));
