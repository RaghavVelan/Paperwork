import { create } from "zustand";

type SheetState = {
  open: boolean;
  editingId: string | null;
  draftDate: string;
  openNew: (date?: string) => void;
  openEdit: (id: string) => void;
  setOpen: (open: boolean) => void;
};

export const useSheetStore = create<SheetState>((set) => ({
  open: false,
  editingId: null,
  draftDate: "",
  openNew: (date) =>
    set({
      open: true,
      editingId: null,
      draftDate: date ?? "",
    }),
  openEdit: (id) => set({ open: true, editingId: id }),
  setOpen: (open) =>
    set(
      open
        ? { open: true }
        : { open: false, editingId: null },
    ),
}));
