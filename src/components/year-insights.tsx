import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { yearRollup } from "@/lib/finance/selectors";
import type { Transaction } from "@/lib/finance/types";
import { useSettings } from "@/lib/ledger/use-settings";
import { monthTitle } from "@/components/home-view";
import { cn } from "@/lib/utils";

export function YearView({
  eyebrow,
  year,
  transactions,
  canGoForward,
  onPrev,
  onNext,
  onShowMonth,
  onOpenMonth,
  currentMonth,
}: {
  eyebrow: string;
  year: string;
  transactions: Transaction[];
  canGoForward: boolean;
  onPrev: () => void;
  onNext: () => void;
  onShowMonth: () => void;
  onOpenMonth: (month: string) => void;
  currentMonth: string;
}) {
  const { format: money } = useSettings();
  const rows = yearRollup(transactions, year);
  const income = rows.reduce((n, row) => n + row.income, 0);
  const expense = rows.reduce((n, row) => n + row.expense, 0);
  const max = Math.max(...rows.map((row) => Math.max(row.income, row.expense)), 1);

  return (
    <div className="flex flex-col gap-6 px-5 pt-2 pb-8">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-subtle">{eyebrow}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-fg">{year}</h1>
          <p className="mt-1 text-sm text-muted">
            {money(income)} in · {money(expense)} out
          </p>
        </div>
        <div className="flex items-center gap-1 pt-1">
          <Button variant="ghost" size="sm" className="rounded-full" onClick={onShowMonth}>
            Month
          </Button>
          <Button variant="ghost" size="icon" aria-label="Previous year" onClick={onPrev}>
            <ChevronLeft className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next year"
            disabled={!canGoForward}
            onClick={onNext}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </header>

      <ul className="flex flex-col gap-2">
        {rows.map((row) => {
          const future = row.month > currentMonth;
          return (
            <li key={row.month}>
              <button
                type="button"
                disabled={future}
                onClick={() => onOpenMonth(row.month)}
                className="flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-left shadow-card disabled:opacity-40"
              >
                <span className="w-16 shrink-0 text-sm text-fg">{monthTitle(row.month).split(" ")[0]}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex h-1.5 overflow-hidden rounded-full bg-raised">
                    <span
                      className="h-full bg-expense/80"
                      style={{ width: `${(row.expense / max) * 100}%` }}
                    />
                  </span>
                  <span className={cn("mt-1 block text-xs tabular-nums text-muted", row.count === 0 && "text-subtle")}>
                    {row.count === 0 ? "No entries" : `${money(row.expense)} out · ${money(row.income)} in`}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
