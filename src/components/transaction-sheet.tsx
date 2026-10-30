import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryPicker } from "@/components/category-picker";
import { LocationSheet } from "@/components/location-sheet";
import {
  defaultCategory,
  PAYMENTS,
} from "@/lib/finance/categories";
import { locationTitle, readCurrentPosition, reversePlace } from "@/lib/finance/places";
import { useFinanceStore } from "@/lib/finance/store";
import type { CategoryId, PaymentMethod, Transaction, TxLocation, TxType } from "@/lib/finance/types";
import { useSettings } from "@/lib/ledger/use-settings";
import { tapScale, transition } from "@/lib/motion";
import { groupDigits, parseAmountInput } from "@/lib/money";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Transaction | null;
  defaultDate: string;
};

export function TransactionSheet({ open, onOpenChange, editing, defaultDate }: Props) {
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const updateTransaction = useFinanceStore((s) => s.updateTransaction);
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);
  const locationMode = useFinanceStore((s) => s.profile.locationMode);
  const { format: money, symbol, currency, todayIso } = useSettings();

  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<CategoryId>("food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [payment, setPayment] = useState<PaymentMethod>("upi");
  const [location, setLocation] = useState<TxLocation | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const autoTried = useRef(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setAmount(String(editing.amount));
      setCategoryId(editing.categoryId);
      setNote(editing.note);
      setDate(editing.date);
      setPayment(editing.payment);
      setLocation(editing.type === "expense" ? (editing.location ?? null) : null);
    } else {
      setType("expense");
      setAmount("");
      setCategoryId(defaultCategory("expense"));
      setNote("");
      setDate(defaultDate || todayIso);
      setPayment("upi");
      setLocation(null);
    }
    setMapOpen(false);
    autoTried.current = false;
  }, [open, editing, defaultDate, todayIso]);

  useEffect(() => {
    if (!open || editing || type !== "expense" || locationMode !== "auto" || autoTried.current) return;
    autoTried.current = true;
    let cancelled = false;
    setLocating(true);
    void readCurrentPosition()
      .then(async (pos) => {
        const label = await reversePlace(pos.lat, pos.lng).catch(() => "");
        if (cancelled) return;
        setLocation({ lat: pos.lat, lng: pos.lng, source: "gps", ...(label ? { label } : {}) });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLocating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, editing, type, locationMode]);

  const parsed = parseAmountInput(amount);

  function onTypeChange(next: TxType) {
    setType(next);
    setCategoryId(defaultCategory(next));
  }

  function save() {
    const value = parseAmountInput(amount);
    if (value <= 0) {
      toast.error("Enter an amount greater than zero.");
      return;
    }
    const draft = {
      type,
      amount: value,
      categoryId,
      note: note.trim(),
      date,
      payment,
      location: type === "expense" ? (location ?? undefined) : undefined,
    };
    if (editing) {
      updateTransaction(editing.id, draft);
      toast.success("Entry updated");
    } else {
      addTransaction(draft);
      toast.success(type === "expense" ? "Expense added" : "Income added");
    }
    onOpenChange(false);
  }

  function usePhone() {
    setLocating(true);
    void readCurrentPosition()
      .then(async (pos) => {
        const label = await reversePlace(pos.lat, pos.lng).catch(() => "");
        setLocation({ lat: pos.lat, lng: pos.lng, source: "gps", ...(label ? { label } : {}) });
      })
      .catch(() => toast.error("This phone didn’t share a location. Search the map instead."))
      .finally(() => setLocating(false));
  }

  function remove() {
    if (!editing) return;
    deleteTransaction(editing.id);
    toast.success("Entry deleted");
    onOpenChange(false);
  }

  return (
    <>
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{editing ? "Edit entry" : "New entry"}</DrawerTitle>
          <DrawerDescription>
            Amounts use {currency} ({symbol}), grouped for that locale.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-raised p-1">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onTypeChange(t)}
                className="relative h-10 rounded-lg text-sm font-medium capitalize"
              >
                {type === t ? (
                  <motion.span
                    layoutId="entry-type"
                    className="absolute inset-0 rounded-lg bg-surface shadow-card"
                    transition={transition.spring}
                  />
                ) : null}
                <span
                  className={cn(
                    "relative z-10",
                    type === t ? (t === "expense" ? "text-expense" : "text-income") : "text-muted",
                  )}
                >
                  {t}
                </span>
              </button>
            ))}
          </div>

          <Label htmlFor="amount">Amount</Label>
          <div className="relative mt-1.5 mb-5">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-display text-2xl font-semibold text-muted">
              {symbol}
            </span>
            <input
              id="amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={groupDigits(amount, currency)}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d.]/g, "");
                if (raw === "" || /^\d*\.?\d{0,2}$/.test(raw)) setAmount(raw);
              }}
              className="h-16 w-full rounded-xl bg-raised pr-4 pl-12 font-display text-3xl font-semibold tracking-tight text-fg shadow-card outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring/70"
            />
          </div>

          <Label>Category</Label>
          <CategoryPicker type={type} value={categoryId} onChange={setCategoryId} />

          <div className="mb-5 grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                className="mt-1.5"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="note">Note</Label>
              <Input
                id="note"
                className="mt-1.5"
                placeholder="Optional"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={80}
              />
            </div>
          </div>

          {type === "expense" ? (
            <div className="mb-5">
              <Label>Place</Label>
              <p className="mt-1.5 line-clamp-2 text-sm text-fg">
                {locating ? "Finding this phone…" : location ? locationTitle(location) : "None"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                    setMapOpen(true);
                  }}
                >
                  Search map
                </Button>
                <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={usePhone} disabled={locating}>
                  This phone
                </Button>
                {location ? (
                  <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={() => setLocation(null)}>
                    Clear
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          <Label>Paid with</Label>
          <div className="mt-1.5 mb-6 flex flex-wrap gap-2">
            {PAYMENTS.map((p) => (
              <motion.button
                key={p.id}
                type="button"
                whileTap={tapScale}
                transition={transition.tap}
                onClick={() => setPayment(p.id)}
                className={cn(
                  "h-9 rounded-full px-3.5 text-xs font-medium",
                  payment === p.id
                    ? "bg-accent text-accent-fg"
                    : "bg-raised text-muted shadow-card",
                )}
              >
                {p.label}
              </motion.button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button className="h-12 flex-1 rounded-xl" onClick={save}>
              {editing
                ? "Save changes"
                : parsed > 0
                  ? `Add ${money(parsed)}`
                  : "Add entry"}
            </Button>
            {editing ? (
              <Button
                variant="destructive"
                className="h-12 rounded-xl px-4"
                onClick={remove}
              >
                Delete
              </Button>
            ) : null}
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
    <LocationSheet
      open={mapOpen}
      initial={location}
      onOpenChange={setMapOpen}
      onConfirm={setLocation}
    />
    </>
  );
}
