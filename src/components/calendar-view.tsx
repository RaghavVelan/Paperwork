import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { CategoryIcon } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { GroupedList } from "@/components/grouped-list";
import { YearView } from "@/components/year-insights";
import { isInvestmentCategory } from "@/lib/finance/categories";
import type { DayRollup } from "@/lib/finance/selectors";
import { transactionsOnDate, yearRollup } from "@/lib/finance/selectors";
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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function dayMarks(rows: Transaction[]) {
  const icons: { id: string; tone: string }[] = [];
  const seen = new Set<string>();
  let expense = false;
  let income = false;
  let invest = false;
  for (const tx of rows) {
    const investment = tx.type === "expense" && isInvestmentCategory(tx.categoryId);
    if (investment) invest = true;
    else if (tx.type === "income") income = true;
    else expense = true;
    if (seen.has(tx.categoryId) || icons.length >= 2) continue;
    seen.add(tx.categoryId);
    icons.push({
      id: tx.categoryId,
      tone: investment ? "text-invest" : tx.type === "income" ? "text-income" : "text-expense",
    });
  }
  return { icons, expense, income, invest };
}

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
  const { format: money, todayIso } = useSettings();
  const [span, setSpan] = useState<"month" | "year">("month");
  const [mode, setMode] = useState<"calendar" | "list">("calendar");
  const monthStart = startOfMonth(cursor);
  const year = monthStart.getFullYear();
  const leading = monthStart.getDay();
  const count = daysInMonth(monthStart);
  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: count }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedTx = transactionsOnDate(transactions, selectedDate);
  const selectedRoll = byDay.get(selectedDate);
  const selectedLabel = format(parseISODate(selectedDate), "EEEE, d MMMM");
  const emptyMonth = [...byDay.values()].every((d) => d.expense === 0 && d.income === 0);
  const currentMonth = todayIso.slice(0, 7);
  const currentYear = Number(todayIso.slice(0, 4));
  const monthIso = toISODate(monthStart).slice(0, 7);
  const monthNet = [...byDay.values()].reduce((sum, day) => sum + day.net, 0);
  const yearRows = yearRollup(transactions, String(year));
  const yearNet = yearRows.reduce((sum, row) => sum + row.income - row.expense, 0);
  const shownNet = span === "year" ? yearNet : monthNet;
  const monthTx = transactions
    .filter((tx) => tx.date.startsWith(monthIso))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const byDate = new Map<string, Transaction[]>();
  for (const tx of monthTx) {
    const rows = byDate.get(tx.date);
    if (rows) rows.push(tx);
    else byDate.set(tx.date, [tx]);
  }

  function openMonth(month: string) {
    if (month > currentMonth) return;
    onCursorChange(parseISODate(`${month}-01`));
    setSpan("month");
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-2 pb-8">
      <header className="flex items-end justify-between gap-3 border-b border-border">
        <div className="flex items-end gap-5">
          {(["calendar", "list"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={cn(
                "pb-2 text-lg font-semibold tracking-tight capitalize",
                mode === item ? "border-b-2 border-fg text-fg" : "text-muted",
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Add entry"
          onClick={() => onAdd(selectedDate)}
          className="mb-2 grid size-9 place-items-center rounded-full bg-raised text-fg"
        >
          <Plus className="size-4" strokeWidth={2.25} />
        </button>
      </header>

      <div className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label={span === "year" ? "Previous year" : "Previous month"}
            onClick={() =>
              onCursorChange(
                span === "year"
                  ? new Date(year - 1, monthStart.getMonth(), 1)
                  : addMonths(monthStart, -1),
              )
            }
            className="grid size-7 place-items-center rounded-full text-muted"
          >
            <ChevronLeft className="size-4" />
          </button>
          <h1 className="font-display text-xl font-semibold tracking-tight text-fg">
            {span === "year" ? year : format(monthStart, "MMMM, yyyy")}
          </h1>
          <button
            type="button"
            aria-label={span === "year" ? "Next year" : "Next month"}
            disabled={span === "year" && year >= currentYear}
            onClick={() => {
              if (span === "year") {
                if (year < currentYear) onCursorChange(new Date(year + 1, monthStart.getMonth(), 1));
                return;
              }
              onCursorChange(addMonths(monthStart, 1));
            }}
            className="grid size-7 place-items-center rounded-full text-muted disabled:opacity-30"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <p className="pb-0.5 text-right text-xs text-muted">
          {span === "year" ? "This year" : "This month"}{" "}
          <span className={cn("font-medium tabular-nums", shownNet < 0 ? "text-expense" : "text-fg")}>
            {shownNet < 0 ? "−" : ""}
            {money(Math.abs(shownNet))}
          </span>
        </p>
      </div>

      {mode === "calendar" ? (
        <>
          <div className="flex items-center gap-4 text-sm">
            <button
              type="button"
              onClick={() => setSpan("year")}
              className={span === "year" ? "font-medium text-fg" : "text-muted"}
            >
              <span className="mr-1.5 inline-block size-1.5 rounded-full bg-invest align-middle" />
              Yearly
            </button>
            <button
              type="button"
              onClick={() => setSpan("month")}
              className={span === "month" ? "font-medium text-fg" : "text-muted"}
            >
              <span className="mr-1.5 inline-block size-1.5 rounded-full bg-income align-middle" />
              Monthly
            </button>
          </div>

          {span === "year" ? (
            <YearView
              embedded
              eyebrow="Calendar"
              year={String(year)}
              transactions={transactions}
              canGoForward={year < currentYear}
              onPrev={() => onCursorChange(new Date(year - 1, monthStart.getMonth(), 1))}
              onNext={() => {
                if (year < currentYear) onCursorChange(new Date(year + 1, monthStart.getMonth(), 1));
              }}
              onShowMonth={() => setSpan("month")}
              onOpenMonth={openMonth}
              currentMonth={currentMonth}
            />
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="flex justify-center">
                    <span className="rounded-full bg-raised px-1 py-1 text-[9px] font-medium tracking-wide text-muted uppercase">
                      {day}
                    </span>
                  </div>
                ))}
                {cells.map((day, index) => {
                  if (day === null) return <div key={`empty-${index}`} />;
                  const iso = toISODate(
                    new Date(monthStart.getFullYear(), monthStart.getMonth(), day),
                  );
                  const marks = dayMarks(byDate.get(iso) ?? []);
                  const selected = iso === selectedDate;
                  const isToday = iso === todayIso;
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => onSelectDate(iso)}
                      className={cn(
                        "flex aspect-[1/1.25] flex-col items-center rounded-lg bg-raised/70 px-0.5 pt-1.5 pb-1",
                        selected && "bg-raised ring-1 ring-fg/35",
                        isToday && !selected && "ring-1 ring-accent/60",
                      )}
                    >
                      <span
                        className={cn(
                          "text-[11px] leading-none font-medium tabular-nums",
                          selected || isToday ? "text-fg" : "text-muted",
                        )}
                      >
                        {day}
                      </span>
                      <span className="flex flex-1 items-center justify-center gap-0.5">
                        {marks.icons.map((icon) => (
                          <CategoryIcon
                            key={icon.id}
                            id={icon.id}
                            className={cn("size-3.5", icon.tone)}
                          />
                        ))}
                      </span>
                      <span className="flex h-1.5 items-center gap-0.5">
                        {marks.expense ? <span className="size-1 rounded-full bg-expense" /> : null}
                        {marks.income ? <span className="size-1 rounded-full bg-income" /> : null}
                        {marks.invest ? <span className="size-1 rounded-full bg-invest" /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>

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
                ) : emptyMonth ? (
                  <EmptyState
                    title="This month is empty"
                    body="Add an in or out and it lands on the grid."
                    action="Add entry"
                    onAction={() => onAdd(selectedDate)}
                  />
                ) : (
                  <p className="rounded-2xl bg-surface px-4 py-8 text-center text-sm text-muted shadow-card">
                    Nothing on this day.
                  </p>
                )}
              </section>
            </>
          )}
        </>
      ) : monthTx.length > 0 ? (
        <GroupedList items={monthTx} onOpen={onOpenTx} />
      ) : (
        <EmptyState
          title="This month is empty"
          body="Add an in or out and it shows up here."
          action="Add entry"
          onAction={() => onAdd(selectedDate)}
        />
      )}
    </div>
  );
}
