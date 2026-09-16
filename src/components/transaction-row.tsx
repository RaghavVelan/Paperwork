import { categoryById, paymentLabel } from "@/lib/finance/categories";
import type { Transaction } from "@/lib/finance/types";
import { useSettings } from "@/lib/ledger/use-settings";
import { CategoryIcon } from "./category-icon";

export function TransactionRow({
  tx,
  onOpen,
}: {
  tx: Transaction;
  onOpen: (id: string) => void;
}) {
  const { format: money } = useSettings();
  const cat = categoryById(tx.categoryId);
  const negative = tx.type === "expense";

  return (
    <button
      type="button"
      onClick={() => onOpen(tx.id)}
      className="flex min-h-14 w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors duration-150 hover:bg-raised active:scale-[0.99]"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-raised text-muted">
        <CategoryIcon id={tx.categoryId} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-fg">
          {tx.note || cat.label}
        </span>
        <span className="block truncate text-xs text-muted">
          {cat.label}
          <span className="text-subtle"> · {paymentLabel(tx.payment)}</span>
        </span>
      </span>
      <span
        className={
          negative
            ? "shrink-0 font-medium tabular-nums text-expense"
            : "shrink-0 font-medium tabular-nums text-income"
        }
      >
        {negative ? "−" : "+"}
        {money(tx.amount)}
      </span>
    </button>
  );
}
