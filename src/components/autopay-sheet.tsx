import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  AUTO_PAY_KINDS,
  kindDefaults,
  type AutoPay,
  type AutoPayKind,
} from "@/lib/finance/autopay";
import { categoriesFor, PAYMENTS } from "@/lib/finance/categories";
import { useFinanceStore } from "@/lib/finance/store";
import type { CategoryId, PaymentMethod } from "@/lib/finance/types";
import { useSettings } from "@/lib/ledger/use-settings";
import { groupDigits, parseAmountInput } from "@/lib/money";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: AutoPay | null;
};

export function AutoPaySheet({ open, onOpenChange, editing }: Props) {
  const addAutoPay = useFinanceStore((s) => s.addAutoPay);
  const updateAutoPay = useFinanceStore((s) => s.updateAutoPay);
  const deleteAutoPay = useFinanceStore((s) => s.deleteAutoPay);
  const { format: money, symbol, currency, todayIso } = useSettings();
  const panelRef = useRef<HTMLDivElement>(null);

  const [kind, setKind] = useState<AutoPayKind>("upi_mandate");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<CategoryId>("utilities");
  const [payment, setPayment] = useState<PaymentMethod>("upi");
  const [dayOfMonth, setDayOfMonth] = useState(5);
  const [startDate, setStartDate] = useState(todayIso);
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setKind(editing.kind);
      setName(editing.name);
      setAmount(String(editing.amount));
      setCategoryId(editing.categoryId);
      setPayment(editing.payment);
      setDayOfMonth(editing.dayOfMonth);
      setStartDate(editing.startDate);
      setEndDate(editing.endDate ?? "");
    } else {
      const defaults = kindDefaults("upi_mandate");
      setKind("upi_mandate");
      setName("");
      setAmount("");
      setCategoryId(defaults.categoryId);
      setPayment(defaults.payment);
      setDayOfMonth(5);
      setStartDate(todayIso);
      setEndDate("");
    }
    panelRef.current?.scrollTo({ top: 0 });
  }, [open, editing, todayIso]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  const cats = useMemo(() => categoriesFor("expense"), []);
  const parsed = parseAmountInput(amount);

  function onKindChange(next: AutoPayKind) {
    setKind(next);
    const defaults = kindDefaults(next);
    setCategoryId(defaults.categoryId);
    setPayment(defaults.payment);
  }

  function save() {
    const value = parseAmountInput(amount);
    if (!name.trim()) {
      toast.error("Give this auto pay a name.");
      return;
    }
    if (value <= 0) {
      toast.error("Enter an amount greater than zero.");
      return;
    }
    if (endDate && endDate < startDate) {
      toast.error("Last date can’t be before the start.");
      return;
    }
    const draft = {
      name: name.trim(),
      kind,
      amount: value,
      categoryId,
      payment,
      dayOfMonth,
      startDate,
      endDate: endDate || null,
    };
    if (editing) {
      updateAutoPay(editing.id, draft);
      toast.success("Auto pay updated");
    } else {
      addAutoPay(draft);
      toast.success("Auto pay added");
    }
    onOpenChange(false);
  }

  function remove() {
    if (!editing) return;
    deleteAutoPay(editing.id);
    toast.success("Auto pay removed. Posted entries stay in the ledger.");
    onOpenChange(false);
  }

  return (
    <div
      className={cn(
        "pw-sheet-root fixed inset-0 z-50 overflow-hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      data-open={open ? "true" : "false"}
      aria-hidden={!open}
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        className="pw-sheet-overlay absolute inset-0 bg-bg/70"
        aria-label="Close"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={open}
        aria-labelledby="autopay-title"
        inert={!open ? true : undefined}
        className="pw-sheet-panel absolute inset-x-0 bottom-0 mx-auto max-h-[92dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-3xl bg-surface shadow-float"
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
        <div className="px-5 pt-3 pb-2">
          <h2 id="autopay-title" className="font-display text-xl font-semibold tracking-tight text-fg">
            {editing ? "Edit auto pay" : "New auto pay"}
          </h2>
          <p className="text-sm text-muted">
            Posts itself on the debit day. Set a last date if it ends.
          </p>
        </div>

        <div className="px-5 pb-8">
          <Label>Type</Label>
          <div className="mt-1.5 mb-5 flex flex-wrap gap-2">
            {AUTO_PAY_KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => onKindChange(k.id)}
                className={cn(
                  "h-9 rounded-full px-3.5 text-xs font-medium",
                  kind === k.id
                    ? "bg-accent text-accent-fg"
                    : "bg-raised text-muted shadow-card",
                )}
              >
                {k.label}
              </button>
            ))}
          </div>

          <Label htmlFor="ap-name">Name</Label>
          <Input
            id="ap-name"
            className="mt-1.5 mb-5"
            placeholder="HDFC EMI, Nippon SIP, Netflix…"
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Label htmlFor="ap-amount">Amount</Label>
          <div className="relative mt-1.5 mb-5">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-display text-2xl font-semibold text-muted">
              {symbol}
            </span>
            <input
              id="ap-amount"
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
          <div className="mt-1.5 mb-5 grid grid-cols-4 gap-2">
            {cats.map((c) => {
              const active = categoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={cn(
                    "flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center",
                    active ? "bg-accent text-accent-fg" : "bg-raised text-muted shadow-card",
                  )}
                >
                  <CategoryIcon id={c.id} className="size-4" />
                  <span className="line-clamp-1 text-2xs font-medium leading-tight">{c.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ap-day">Debit day</Label>
              <Select
                id="ap-day"
                className="mt-1.5"
                value={dayOfMonth === 31 ? "last" : String(dayOfMonth)}
                onChange={(e) => {
                  const v = e.target.value;
                  setDayOfMonth(v === "last" ? 31 : Number(v));
                }}
              >
                {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
                <option value="last">Last day of month</option>
              </Select>
              <p className="mt-1.5 text-xs text-subtle">Short months use the last day.</p>
            </div>
            <div>
              <Label htmlFor="ap-pay">Paid with</Label>
              <Select
                id="ap-pay"
                className="mt-1.5"
                value={payment}
                onChange={(e) => setPayment(e.target.value as PaymentMethod)}
              >
                {PAYMENTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ap-start">Starts</Label>
              <Input
                id="ap-start"
                type="date"
                className="mt-1.5"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ap-end">Last date</Label>
              <Input
                id="ap-end"
                type="date"
                className="mt-1.5"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-subtle">Blank = ongoing</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="h-12 flex-1 rounded-xl" onClick={save}>
              {editing
                ? "Save changes"
                : parsed > 0
                  ? `Add ${money(parsed)} / mo`
                  : "Add auto pay"}
            </Button>
            {editing ? (
              <Button variant="destructive" className="h-12 rounded-xl px-4" onClick={remove}>
                Delete
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
