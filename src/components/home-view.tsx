import { format } from "date-fns";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GroupedList } from "@/components/grouped-list";
import type { DayRollup, MonthSummary } from "@/lib/finance/selectors";
import type { Transaction } from "@/lib/finance/types";
import { useSettings } from "@/lib/ledger/use-settings";
import { parseISODate } from "@/lib/money";
import { addDaysISO } from "@/lib/time";
import { cn } from "@/lib/utils";

function greeting(hour: number, name: string): string {
  const who = name.trim();
  const base =
    hour < 5 ? "Late night" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return who ? `${base}, ${who.split(" ")[0]}` : base;
}

function weekDays(todayIso: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysISO(todayIso, i - 6));
}

export function HomeView({
  monthLabel,
  summary,
  budget,
  recent,
  byDay,
  selectedDate,
  onSelectDate,
  onOpenTx,
  onAdd,
}: {
  monthLabel: string;
  summary: MonthSummary;
  budget: number;
  recent: Transaction[];
  byDay: Map<string, DayRollup>;
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  onOpenTx: (id: string) => void;
  onAdd: () => void;
}) {
  const { format: money, todayIso, hour, profile } = useSettings();
  const spentPct = budget > 0 ? Math.min(summary.expense / budget, 1.4) : 0;
  const over = budget > 0 && summary.expense > budget;
  const week = weekDays(todayIso);

  return (
    <div className="flex flex-col gap-6 px-5 pt-4 pb-10">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight text-fg">
          {greeting(hour, profile.displayName)}
        </h1>
        <p className="mt-1 text-sm text-muted">{monthLabel}</p>
      </header>

      <section className="rounded-3xl bg-surface p-5 shadow-card">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">
          Balance this month
        </p>
        <p
          className={cn(
            "mt-2 font-display text-4xl leading-none tracking-tight tabular-nums",
            summary.net < 0 ? "text-expense" : "text-fg",
          )}
        >
          {summary.net < 0 ? "−" : ""}
          {money(Math.abs(summary.net))}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-raised px-3.5 py-3">
            <p className="text-xs text-muted">In</p>
            <p className="mt-0.5 font-display text-xl tabular-nums text-income">
              {money(summary.income)}
            </p>
          </div>
          <div className="rounded-2xl bg-raised px-3.5 py-3">
            <p className="text-xs text-muted">Out</p>
            <p className="mt-0.5 font-display text-xl tabular-nums text-expense">
              {money(summary.expense)}
            </p>
          </div>
        </div>
        {budget > 0 ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Spend limit {money(budget)}</span>
              <span className={over ? "text-expense" : "text-muted"}>
                {Math.round((summary.expense / budget) * 100)}%
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-raised">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-300",
                  over ? "bg-expense" : "bg-accent",
                )}
                style={{ width: `${Math.min(spentPct, 1) * 100}%` }}
              />
            </div>
          </div>
        ) : null}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between px-0.5">
          <h2 className="text-sm font-medium text-fg">This week</h2>
          <Link
            to="/calendar"
            className="text-xs font-medium text-muted hover:text-fg"
          >
            Open calendar
          </Link>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {week.map((iso) => {
            const d = parseISODate(iso);
            const roll = byDay.get(iso);
            const isToday = iso === todayIso;
            const selected = iso === selectedDate;
            const future = iso > todayIso;
            const cls = cn(
              "flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl py-2 transition-colors duration-150",
              selected ? "bg-accent text-accent-fg" : "bg-surface text-fg shadow-card",
              future && "pointer-events-none opacity-40",
            );
            const inner = (
              <>
                <span
                  className={cn(
                    "text-2xs font-medium uppercase",
                    selected ? "text-accent-fg/70" : "text-subtle",
                  )}
                >
                  {format(d, "EEEEE")}
                </span>
                <span className="text-sm font-medium tabular-nums">{d.getDate()}</span>
                {roll && roll.expense > 0 ? (
                  <span
                    className={cn(
                      "size-1 rounded-full",
                      selected ? "bg-accent-fg" : isToday ? "bg-accent" : "bg-expense",
                    )}
                  />
                ) : (
                  <span className="size-1" />
                )}
              </>
            );
            if (future) {
              return (
                <span key={iso} className={cls}>
                  {inner}
                </span>
              );
            }
            return (
              <Link
                key={iso}
                to="/calendar"
                search={{ date: iso }}
                className={cls}
                onClick={() => onSelectDate(iso)}
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-fg">Recent</h2>
          <Badge>{summary.count} this month</Badge>
        </div>
        {recent.length === 0 ? (
          <EmptyRecent onAdd={onAdd} />
        ) : (
          <GroupedList items={recent} onOpen={onOpenTx} />
        )}
      </section>
    </div>
  );
}

function EmptyRecent({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl bg-surface px-5 py-8 text-center shadow-card">
      <p className="font-display text-lg text-fg">No entries yet</p>
      <p className="mt-1 text-sm text-muted">
        Add your first in or out. Dates land on the calendar.
      </p>
      <Button className="mt-4" onClick={onAdd}>
        Add entry
      </Button>
    </div>
  );
}

export function monthTitle(isoMonth: string): string {
  const d = parseISODate(`${isoMonth}-01`);
  return format(d, "MMMM yyyy");
}
