import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { GroupedList } from "@/components/grouped-list";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { categoryById } from "@/lib/finance/categories";
import { useSheetStore } from "@/lib/finance/sheet";
import { useFinanceStore } from "@/lib/finance/store";

export function SearchSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const transactions = useFinanceStore((s) => s.transactions);
  const categories = useFinanceStore((s) => s.categories);
  const openEdit = useSheetStore((s) => s.openEdit);
  const setAuxOpen = useSheetStore((s) => s.setAuxOpen);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setAuxOpen(open);
    return () => setAuxOpen(false);
  }, [open, setAuxOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const digits = q.replace(/[^\d.]/g, "");
    return transactions
      .filter((tx) => {
        const label = categoryById(tx.categoryId, categories).label.toLowerCase();
        const note = tx.note.toLowerCase();
        const amount = String(tx.amount);
        const place = tx.location?.label?.toLowerCase() ?? "";
        return (
          note.includes(q) ||
          label.includes(q) ||
          place.includes(q) ||
          (digits.length > 0 && amount.includes(digits))
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [categories, query, transactions]);

  return (
    <Drawer
      repositionInputs={false}
      open={open}
      onOpenChange={(next) => {
        if (!next) setQuery("");
        onOpenChange(next);
      }}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Search</DrawerTitle>
          <DrawerDescription>Notes, categories, and amounts on this device.</DrawerDescription>
        </DrawerHeader>
        <div className="shrink-0 px-5 pt-2 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
            <input
              autoFocus
              value={query}
              placeholder="Lunch, rent, 500"
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-raised pr-3 pl-9 text-sm text-fg outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring/70"
            />
          </div>
        </div>
        <DrawerBody className="pt-1">
          {!query.trim() ? (
            <p className="py-8 text-center text-sm text-muted">Type a note, a category, or an amount.</p>
          ) : results.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Nothing matches.</p>
          ) : (
            <GroupedList
              items={results}
              onOpen={(id) => {
                onOpenChange(false);
                openEdit(id);
              }}
            />
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
