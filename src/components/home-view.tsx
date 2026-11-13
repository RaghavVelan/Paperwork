import { format } from "date-fns";
import { ArrowDown, ArrowUp, Eye, EyeOff, Repeat, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Switch } from "glisse";
import { AutoPaySheet } from "@/components/autopay-sheet";
import { CategoryIcon } from "@/components/category-icon";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { GroupedList } from "@/components/grouped-list";
import { isInvestmentCategory } from "@/lib/finance/categories";
import { kindLabel, type MonthAutoPay } from "@/lib/finance/autopay";
import { useSheetStore } from "@/lib/finance/sheet";
import { useFinanceStore } from "@/lib/finance/store";
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

function weekMarks(rows: Transaction[]) {
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
    if (seen.has(tx.categoryId) || icons.length >= 1) continue;
    seen.add(tx.categoryId);
    icons.push({
      id: tx.categoryId,
      tone: investment ? "text-invest" : tx.type === "income" ? "text-income" : "text-expense",
    });
  }
  return { icons, expense, income, invest };
}

/** Trial card. Set false to show the original balance card below. */
const BALANCE_EXPERIMENT = true;

function morphAt(from: string, to: string, count: number) {
  const length = Math.max(from.length, to.length);
  let next = "";
  for (let i = 0; i < length; i++) next += i < count ? (to[i] ?? "") : (from[i] ?? "");
  return next;
}

function MorphText({
  value,
  hidden,
  className,
}: {
  value: string;
  hidden: boolean;
  className?: string;
}) {
  const target = hidden ? "•".repeat(Math.max(value.length, 1)) : value;
  const current = useRef(target);
  const [text, setText] = useState(target);

  useEffect(() => {
    const from = current.current;
    if (from === target) return;
    const steps = Math.max(from.length, target.length, 1);
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 280);
      const eased = 1 - (1 - t) ** 3;
      const next = t === 1 ? target : morphAt(from, target, Math.round(eased * steps));
      current.current = next;
      setText(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return <span className={className}>{text}</span>;
}

function QuickActions() {
  const openNew = useSheetStore((s) => s.openNew);
  const openSearch = useSheetStore((s) => s.openSearch);
  const [autopayOpen, setAutopayOpen] = useState(false);
  const actions = [
    {
      label: "Expense",
      icon: ArrowDown,
      color: "text-expense",
      onClick: () => openNew(undefined, "expense"),
    },
    {
      label: "Income",
      icon: ArrowUp,
      color: "text-income",
      onClick: () => openNew(undefined, "income"),
    },
    {
      label: "Auto pay",
      icon: Repeat,
      color: "text-invest",
      onClick: () => setAutopayOpen(true),
    },
    {
      label: "Search",
      icon: Search,
      color: "text-[#6d8cae]",
      onClick: openSearch,
    },
  ];

  return (
    <>
      <section className="rounded-3xl bg-surface px-2 py-4 shadow-card">
        <div className="grid grid-cols-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="flex flex-col items-center gap-2"
              >
                <span className="grid size-12 place-items-center rounded-full bg-raised">
                  <Icon className={cn("size-5", action.color)} strokeWidth={2.25} />
                </span>
                <span className="text-xs text-muted">{action.label}</span>
              </button>
            );
          })}
        </div>
      </section>
      <AutoPaySheet open={autopayOpen} onOpenChange={setAutopayOpen} editing={null} />
    </>
  );
}

function BalanceExperiment({
  summary,
  budget,
  hidden,
  onToggle,
}: {
  summary: MonthSummary;
  budget: number;
  hidden: boolean;
  onToggle: (show: boolean) => void;
}) {
  const { format: money } = useSettings();
  const spentPct = budget > 0 ? Math.min(summary.expense / budget, 1) : 0;
  const over = budget > 0 && summary.expense > budget;
  const net = `${summary.net < 0 ? "−" : ""}${money(Math.abs(summary.net))}`;

  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-3xl bg-surface px-4 pt-3.5 pb-3.5 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">
            Balance this month
          </p>
          <Switch
            checked={!hidden}
            aria-label={hidden ? "Show balance" : "Hide balance"}
            onCheckedChange={onToggle}
          />
        </div>
        <div className="mt-1.5" aria-hidden={hidden}>
          <p
            className={cn(
              "font-display text-3xl leading-none font-semibold tracking-tight tabular-nums",
              !hidden && summary.net < 0 ? "text-expense" : "text-fg",
            )}
          >
            <MorphText value={net} hidden={hidden} />
          </p>
          <p className="mt-2 text-sm tabular-nums">
            <span className="text-muted">In </span>
            <MorphText
              value={money(summary.income)}
              hidden={hidden}
              className="font-medium text-income"
            />
            <span className="mx-1.5 text-subtle">·</span>
            <span className="text-muted">Out </span>
            <MorphText
              value={money(summary.expense)}
              hidden={hidden}
              className="font-medium text-expense"
            />
          </p>
          {budget > 0 ? (
            <div className="mt-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">
                  Limit <MorphText value={money(budget)} hidden={hidden} />
                </span>
                <span className={over && !hidden ? "text-expense" : "text-muted"}>
                  <MorphText
                    value={`${Math.round((summary.expense / budget) * 100)}%`}
                    hidden={hidden}
                  />
                </span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-raised">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-300 ease-out",
                    over ? "bg-expense" : "bg-accent",
                  )}
                  style={{ width: hidden ? "0%" : `${spentPct * 100}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>
      <QuickActions />
    </div>
  );
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
  const updateProfile = useFinanceStore((s) => s.updateProfile);
  const transactions = useFinanceStore((s) => s.transactions);
  const hidden = profile.hideBalance !== false;
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

      {BALANCE_EXPERIMENT ? (
        <BalanceExperiment
          summary={summary}
          budget={budget}
          hidden={hidden}
          onToggle={(show) => updateProfile({ hideBalance: !show })}
        />
      ) : empty ? (
        <EmptyState
          title="Your ledger is empty"
          body="Add money in or out. It lands on this month and on the calendar."
          action="Add entry"
          onAction={onAdd}
        />
      ) : (
        <section className="rounded-3xl bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">
              Balance this month
            </p>
            <button
              type="button"
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-raised hover:text-fg"
              aria-pressed={!hidden}
              aria-label={hidden ? "Show balance" : "Hide balance"}
              onClick={() => updateProfile({ hideBalance: !hidden })}
            >
              {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <div
            className={cn(
              "transition-[filter] duration-200 ease-out",
              hidden && "pointer-events-none select-none blur-[12px]",
            )}
            aria-hidden={hidden}
          >
            <p
              className={cn(
                "mt-1 font-display text-4xl leading-none font-semibold tracking-tight tabular-nums",
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
          </div>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between px-0.5">
          <h2 className="text-sm font-medium text-fg">This week</h2>
          <Link to="/calendar" className="text-xs font-medium text-muted hover:text-fg">
            Open calendar
          </Link>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {week.map((iso) => {
            const d = parseISODate(iso);
            const marks = weekMarks(transactions.filter((tx) => tx.date === iso));
            const selected = iso === selectedDate;
            const future = iso > todayIso;
            const cls = cn(
              "flex aspect-[1/1.25] flex-col items-center rounded-lg px-0.5 pt-1.5 pb-1 transition-colors duration-150",
              selected ? "bg-accent text-accent-fg" : "bg-surface text-fg shadow-card",
              future && "pointer-events-none opacity-40",
            );
            const inner = (
              <>
                <span
                  className={cn(
                    "text-[9px] leading-none font-medium uppercase",
                    selected ? "text-accent-fg/70" : "text-subtle",
                  )}
                >
                  {format(d, "EEEEE")}
                </span>
                <span className="mt-1 text-[11px] leading-none font-medium tabular-nums">
                  {d.getDate()}
                </span>
                <span className="flex flex-1 items-center justify-center">
                  {marks.icons.map((icon) => (
                    <CategoryIcon
                      key={icon.id}
                      id={icon.id}
                      className={cn("size-3.5", selected ? "text-accent-fg" : icon.tone)}
                    />
                  ))}
                </span>
                <span className="flex h-1.5 items-center gap-0.5">
                  {marks.expense ? (
                    <span className={cn("size-1 rounded-full", selected ? "bg-accent-fg" : "bg-expense")} />
                  ) : null}
                  {marks.income ? (
                    <span className={cn("size-1 rounded-full", selected ? "bg-accent-fg" : "bg-income")} />
                  ) : null}
                  {marks.invest ? (
                    <span className={cn("size-1 rounded-full", selected ? "bg-accent-fg" : "bg-invest")} />
                  ) : null}
                </span>
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
                key={`${row.autoPay.id}-${row.date}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-fg">{row.autoPay.name}</span>
                  <span className="block truncate text-xs text-subtle">
                    {kindLabel(row.autoPay.kind)} · {format(parseISODate(row.date), "d MMM")}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 text-sm tabular-nums",
                    row.autoPay.type === "income"
                      ? "text-income"
                      : isInvestmentCategory(row.autoPay.categoryId)
                        ? "text-invest"
                        : "text-expense",
                  )}
                >
                  {row.autoPay.type === "income" ? "+" : "−"}
                  {money(row.autoPay.amount)}
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
