import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryIcon } from "@/components/category-icon";
import {
  categoriesFor,
  defaultCategory,
  PAYMENTS,
} from "@/lib/finance/categories";
import { useFinanceStore } from "@/lib/finance/store";
import type { CategoryId, PaymentMethod, Transaction, TxType } from "@/lib/finance/types";
import { useSettings } from "@/lib/ledger/use-settings";
import { groupDigits, parseAmountInput } from "@/lib/money";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Transaction | null;
  defaultDate: string;
};

const ease = [0.22, 1, 0.36, 1] as const;

export function TransactionSheet({ open, onOpenChange, editing, defaultDate }: Props) {
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const updateTransaction = useFinanceStore((s) => s.updateTransaction);
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);
  const { format: money, symbol, currency, todayIso } = useSettings();

  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<CategoryId>("food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [payment, setPayment] = useState<PaymentMethod>("upi");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setAmount(String(editing.amount));
      setCategoryId(editing.categoryId);
      setNote(editing.note);
      setDate(editing.date);
      setPayment(editing.payment);
    } else {
      setType("expense");
      setAmount("");
      setCategoryId(defaultCategory("expense"));
      setNote("");
      setDate(defaultDate || todayIso);
      setPayment("upi");
    }
  }, [open, editing, defaultDate, todayIso]);

  const cats = useMemo(() => categoriesFor(type), [type]);
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
    const draft = { type, amount: value, categoryId, note: note.trim(), date, payment };
    if (editing) {
      updateTransaction(editing.id, draft);
      toast.success("Entry updated");
    } else {
      addTransaction(draft);
      toast.success(type === "expense" ? "Expense added" : "Income added");
    }
    onOpenChange(false);
  }

  function remove() {
    if (!editing) return;
    deleteTransaction(editing.id);
    toast.success("Entry deleted");
    onOpenChange(false);
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.button
            type="button"
            className="absolute inset-0 bg-bg/70"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="entry-title"
            className="relative z-10 flex max-h-[92%] w-full max-w-lg flex-col rounded-t-3xl bg-surface shadow-float"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", duration: 0.42, bounce: 0 }}
          >
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
            <div className="px-5 pt-3 pb-2">
              <h2 id="entry-title" className="font-display text-xl font-medium tracking-tight text-fg">
                {editing ? "Edit entry" : "New entry"}
              </h2>
              <p className="text-sm text-muted">
                Amounts use {currency} ({symbol}), grouped for that locale.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-8">
              <LayoutGroup id="tx-type">
                <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-raised p-1">
                  {(["expense", "income"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onTypeChange(t)}
                      className={cn(
                        "relative h-10 rounded-lg text-sm font-medium capitalize",
                        type === t
                          ? t === "expense"
                            ? "text-expense"
                            : "text-income"
                          : "text-muted",
                      )}
                    >
                      {type === t ? (
                        <motion.span
                          layoutId="tx-type-pill"
                          className="absolute inset-0 rounded-lg bg-surface shadow-card"
                          transition={{ type: "spring", duration: 0.32, bounce: 0 }}
                        />
                      ) : null}
                      <span className="relative z-10">{t}</span>
                    </button>
                  ))}
                </div>
              </LayoutGroup>

              <Label htmlFor="amount">Amount</Label>
              <div className="relative mt-1.5 mb-5">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-display text-2xl text-muted">
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
                  className="h-16 w-full rounded-xl bg-raised pr-4 pl-12 font-display text-3xl tracking-tight text-fg shadow-card outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring/70"
                />
              </div>

              <Label>Category</Label>
              <motion.div
                key={type}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease }}
                className="mt-1.5 mb-5 grid grid-cols-4 gap-2"
              >
                {cats.map((c) => {
                  const active = categoryId === c.id;
                  return (
                    <motion.button
                      key={c.id}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setCategoryId(c.id)}
                      className={cn(
                        "flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center transition-colors duration-150",
                        active ? "bg-accent text-accent-fg" : "bg-raised text-muted shadow-card",
                      )}
                    >
                      <CategoryIcon id={c.id} className="size-4" />
                      <span className="line-clamp-1 text-2xs font-medium leading-tight">
                        {c.label}
                      </span>
                    </motion.button>
                  );
                })}
              </motion.div>

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

              <Label>Paid with</Label>
              <div className="mt-1.5 mb-6 flex flex-wrap gap-2">
                {PAYMENTS.map((p) => (
                  <motion.button
                    key={p.id}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setPayment(p.id)}
                    className={cn(
                      "h-9 rounded-full px-3.5 text-xs font-medium transition-colors duration-150",
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
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
