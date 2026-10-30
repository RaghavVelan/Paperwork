import { categoryById, isInvestmentCategory, paymentLabel } from "@/lib/finance/categories";
import { locationTitle } from "@/lib/finance/places";
import { useFinanceStore } from "@/lib/finance/store";
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
  const custom = useFinanceStore((s) => s.categories);
  const cat = categoryById(tx.categoryId, custom);
  const invest = tx.type === "expense" && isInvestmentCategory(tx.categoryId);

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
          {tx.location ? <span className="text-subtle"> · {locationTitle(tx.location)}</span> : null}
        </span>
      </span>
      <span
        className={
          tx.type === "income"
            ? "shrink-0 font-medium tabular-nums text-income"
            : invest
              ? "shrink-0 font-medium tabular-nums text-invest"
              : "shrink-0 font-medium tabular-nums text-expense"
        }
      >
        {tx.type === "expense" ? "−" : "+"}
        {money(tx.amount)}
      </span>
    </button>
  );
}
