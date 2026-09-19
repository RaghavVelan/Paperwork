import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { LayoutGroup, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { GroupedList } from "@/components/grouped-list";
import type { DayRollup } from "@/lib/finance/selectors";
import { transactionsOnDate } from "@/lib/finance/selectors";
import type { Transaction } from "@/lib/finance/types";
import { useSettings } from "@/lib/ledger/use-settings";
import {
  addMonths,
  daysInMonth,
  parseISODate,
  startOfMonth,
  toISODate,
} from "@/lib/money";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;

export function CalendarView({
  cursor,
  onCursorChange,
  selectedDate,
  onSelectDate,
  byDay,
  transactions,
  onOpenTx,
  onAdd,
}: {
  cursor: Date;
  onCursorChange: (d: Date) => void;
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  byDay: Map<string, DayRollup>;
  transactions: Transaction[];
  onOpenTx: (id: string) => void;
  onAdd: (date: string) => void;
}) {
  const { formatCompact, todayIso } = useSettings();
  const monthStart = startOfMonth(cursor);
  const leading = monthStart.getDay();
  const count = daysInMonth(monthStart);
  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: count }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const maxExpense = Math.max(1, ...[...byDay.values()].map((d) => d.expense));
  const selectedTx = transactionsOnDate(transactions, selectedDate);
  const selectedRoll = byDay.get(selectedDate);
  const selectedLabel = format(parseISODate(selectedDate), "EEEE, d MMMM");
  const monthKey = `${monthStart.getFullYear()}-${monthStart.getMonth()}`;

  return (
    <div className="flex flex-col gap-5 px-5 pt-2 pb-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-subtle">
            Calendar
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium tracking-tight text-fg">
            {format(monthStart, "MMMM yyyy")}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous month"
            onClick={() => onCursorChange(addMonths(monthStart, -1))}
          >
            <ChevronLeft className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next month"
            onClick={() => onCursorChange(addMonths(monthStart, 1))}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </header>

      <section className="rounded-3xl bg-surface p-3 shadow-card sm:p-4">
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((w, i) => (
            <div
              key={`${w}-${i}`}
              className="pb-2 text-center text-2xs font-medium uppercase tracking-[0.14em] text-subtle"
            >
              {w}
            </div>
          ))}
          <LayoutGroup id={`cal-${monthKey}`}>
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`e-${i}`} className="min-h-14" />;
              }
              const iso = toISODate(
                new Date(monthStart.getFullYear(), monthStart.getMonth(), day),
              );
              const roll = byDay.get(iso);
              const selected = iso === selectedDate;
              const isToday = iso === todayIso;
              const heat = roll ? Math.min(roll.expense / maxExpense, 1) : 0;
              return (
                <motion.button
                  key={iso}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onSelectDate(iso)}
                  className={cn(
                    "relative m-0.5 flex min-h-14 flex-col items-center justify-start rounded-xl px-0.5 pt-1.5 pb-1",
                    selected
                      ? "text-accent-fg"
                      : isToday
                        ? "text-fg"
                        : "text-fg hover:bg-raised",
                  )}
                  style={
                    !selected && heat > 0
                      ? {
                          backgroundColor: `color-mix(in oklab, var(--color-expense) ${Math.round(heat * 22)}%, transparent)`,
                        }
                      : undefined
                  }
                >
                  {selected ? (
                    <motion.span
                      layoutId="cal-day-pill"
                      className="absolute inset-0 rounded-xl bg-accent"
                      transition={{ type: "spring", duration: 0.32, bounce: 0 }}
                    />
                  ) : isToday ? (
                    <span className="absolute inset-0 rounded-xl bg-raised" />
                  ) : null}
                  <span
                    className={cn(
                      "relative z-10 text-xs font-medium tabular-nums",
                      selected ? "text-accent-fg" : isToday ? "text-accent" : "text-fg",
                    )}
                  >
                    {day}
                  </span>
                  {roll ? (
                    <span
                      className={cn(
                        "relative z-10 mt-0.5 max-w-full truncate text-2xs font-medium leading-tight tabular-nums",
                        selected
                          ? "text-accent-fg/80"
                          : roll.net >= 0
                            ? "text-income"
                            : "text-expense",
                      )}
                    >
                      {roll.expense > 0 && roll.income === 0
                        ? formatCompact(roll.expense)
                        : formatCompact(Math.abs(roll.net))}
                    </span>
                  ) : null}
                </motion.button>
              );
            })}
          </LayoutGroup>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between px-0.5">
          <div>
            <h2 className="text-sm font-medium text-fg">{selectedLabel}</h2>
            <p className="text-xs text-muted">
              {selectedRoll
                ? `${selectedTx.length} ${selectedTx.length === 1 ? "entry" : "entries"}`
                : "Nothing yet"}
            </p>
          </div>
          <Button size="sm" className="rounded-full" onClick={() => onAdd(selectedDate)}>
            Add
          </Button>
        </div>
        {selectedTx.length > 0 ? (
          <GroupedList items={selectedTx} onOpen={onOpenTx} />
        ) : (
          <p className="rounded-2xl bg-surface px-4 py-8 text-center text-sm text-muted shadow-card">
            Tap a day, then add an entry.
          </p>
        )}
      </section>
    </div>
  );
}
