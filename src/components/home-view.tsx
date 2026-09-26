import { format } from "date-fns";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { GroupedList } from "@/components/grouped-list";
import { kindLabel, type MonthAutoPay } from "@/lib/finance/autopay";
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
  autoPays,
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
  autoPays: MonthAutoPay[];
}) {
  const { format: money, todayIso, hour, profile } = useSettings();
  const spentPct = budget > 0 ? Math.min(summary.expense / budget, 1.4) : 0;
  const over = budget > 0 && summary.expense > budget;
  const week = weekDays(todayIso);
  const empty = summary.count === 0;

  return (
    <div className="flex flex-col gap-6 px-5 pt-4 pb-10">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-fg">
          {greeting(hour, profile.displayName)}
        </h1>
        <p className="mt-1 text-sm text-muted">{monthLabel}</p>
      </header>

      {empty ? (
        <EmptyState
          title="Your ledger is empty"
          body="Add money in or out. It lands on this month and on the calendar."
          action="Add entry"
          onAction={onAdd}
        />
      ) : (
        <section className="rounded-3xl bg-surface p-5 shadow-card">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">
            Balance this month
          </p>
          <p
            className={cn(
              "mt-2 font-display text-4xl leading-none font-semibold tracking-tight tabular-nums",
              summary.net < 0 ? "text-expense" : "text-fg",
            )}
          >
            {summary.net < 0 ? "−" : ""}
            {money(Math.abs(summary.net))}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-raised px-3.5 py-3">
              <p className="text-xs text-muted">In</p>
              <p className="mt-0.5 font-display text-xl font-semibold tabular-nums text-income">
                {money(summary.income)}
              </p>
            </div>
            <div className="rounded-2xl bg-raised px-3.5 py-3">
              <p className="text-xs text-muted">Out</p>
              <p className="mt-0.5 font-display text-xl font-semibold tabular-nums text-expense">
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
                    "h-full rounded-full transition-[width] duration-200 ease-out",
                    over ? "bg-expense" : "bg-accent",
                  )}
                  style={{ width: `${Math.min(spentPct, 1) * 100}%` }}
                />
              </div>
            </div>
          ) : null}
        </section>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between px-0.5">
          <h2 className="text-sm font-medium text-fg">This week</h2>
          <Link to="/calendar" className="text-xs font-medium text-muted hover:text-fg">
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
        <div className="mb-2 flex items-center justify-between px-0.5">
          <h2 className="text-sm font-medium text-fg">Auto pays</h2>
          <Link to="/autopay" className="text-xs font-medium text-muted hover:text-fg">
            Manage
          </Link>
        </div>
        {autoPays.length === 0 ? (
          <Link
            to="/autopay"
            className="block rounded-2xl bg-surface px-4 py-4 text-sm text-muted shadow-card"
          >
            Set UPI mandates, SIPs, and loans. They post on the debit day.
          </Link>
        ) : (
          <ul className="flex flex-col gap-1 rounded-2xl bg-surface px-2 py-2 shadow-card">
            {autoPays.slice(0, 4).map((row) => (
              <li
                key={row.autoPay.id}
                className="flex items-center gap-3 rounded-xl px-2 py-2"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-fg">{row.autoPay.name}</span>
                  <span className="block truncate text-xs text-subtle">
                    {kindLabel(row.autoPay.kind)} · {format(parseISODate(row.date), "d MMM")}
                  </span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-expense">
                  −{money(row.autoPay.amount)}
                </span>
                <Badge
                  variant={
                    row.status === "posted" ? "default" : row.status === "due" ? "expense" : "accent"
                  }
                >
                  {row.status === "posted" ? "Posted" : row.status === "due" ? "Due" : "Soon"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      {empty ? null : (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-fg">Recent</h2>
            <Badge>{summary.count} this month</Badge>
          </div>
          <GroupedList items={recent} onOpen={onOpenTx} />
        </section>
      )}
    </div>
  );
}

export function monthTitle(isoMonth: string): string {
  const d = parseISODate(`${isoMonth}-01`);
  return format(d, "MMMM yyyy");
}
