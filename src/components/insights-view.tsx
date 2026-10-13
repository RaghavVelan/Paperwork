import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/components/empty-state";
import { GroupedList } from "@/components/grouped-list";
import { CategoryIcon } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { categoryById, isInvestmentCategory } from "@/lib/finance/categories";
import type { MonthSummary } from "@/lib/finance/selectors";
import { useSheetStore } from "@/lib/finance/sheet";
import { useFinanceStore } from "@/lib/finance/store";
import type { CategoryId } from "@/lib/finance/types";
import { useSettings } from "@/lib/ledger/use-settings";
import { daysInMonth, parseISODate, startOfMonth, toISODate } from "@/lib/money";
import { cn } from "@/lib/utils";

export function InsightsView({
  monthLabel,
  month,
  summary,
  budget,
  onAdd,
  autoPayTotal,
  canGoForward,
  onPrevMonth,
  onNextMonth,
}: {
  monthLabel: string;
  month: string;
  summary: MonthSummary;
  budget: number;
  onAdd: () => void;
  autoPayTotal: number;
  canGoForward: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const { format: money } = useSettings();
  const transactions = useFinanceStore((s) => s.transactions);
  const custom = useFinanceStore((s) => s.categories);
  const openEdit = useSheetStore((s) => s.openEdit);
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null);
  useEffect(() => {
    setCategoryId(null);
  }, [month]);
  const monthDate = parseISODate(`${month}-01`);
  const start = startOfMonth(monthDate);
  const dim = daysInMonth(start);

  const daily = useMemo(() => {
    return Array.from({ length: dim }, (_, i) => {
      const iso = toISODate(new Date(start.getFullYear(), start.getMonth(), i + 1));
      const roll = summary.byDay.get(iso);
      const expense = roll?.expense ?? 0;
      const invested = transactions
        .filter(
          (tx) =>
            tx.date === iso &&
            tx.type === "expense" &&
            isInvestmentCategory(tx.categoryId),
        )
        .reduce((sum, tx) => sum + tx.amount, 0);
      return {
        day: String(i + 1),
        spend: Math.max(0, expense - invested),
        invest: invested,
      };
    });
  }, [dim, start, summary.byDay, transactions]);

  const cats = useMemo(() => {
    return [...summary.byCategory.entries()]
      .map(([id, amount]) => ({ id, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [summary.byCategory]);

  const categoryRows = useMemo(() => {
    if (!categoryId) return [];
    return transactions
      .filter(
        (tx) =>
          tx.type === "expense" &&
          tx.categoryId === categoryId &&
          tx.date.startsWith(month),
      )
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [categoryId, month, transactions]);
  const categoryTotal = categoryRows.reduce((sum, tx) => sum + tx.amount, 0);
  const categoryLabel = categoryId ? categoryById(categoryId, custom).label : "";
  const rate =
    summary.income > 0
      ? Math.round(((summary.income - summary.expense) / summary.income) * 100)
      : null;
  const spentPct = budget > 0 ? Math.min(summary.expense / budget, 1.4) : 0;
  const over = budget > 0 && summary.expense > budget;
  const empty = summary.count === 0;

  return (
    <div className="flex flex-col gap-6 px-5 pt-2 pb-8">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-subtle">
            Insights
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-fg">
            {monthLabel}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {empty
              ? "Nothing this month yet."
              : rate === null
                ? "Add income to see a save rate."
                : rate >= 0
                  ? `${rate}% of income kept`
                  : `${Math.abs(rate)}% over income`}
          </p>
        </div>
        <div className="flex items-center gap-1 pt-1">
          <Button variant="ghost" size="icon" aria-label="Previous month" onClick={onPrevMonth}>
            <ChevronLeft className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next month"
            disabled={!canGoForward}
            onClick={onNextMonth}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </header>

      {empty ? (
        <EmptyState
          title="No picture yet"
          body="Add an expense or some income this month and the bars will fill in."
          action="Add entry"
          onAction={onAdd}
        />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3">
            <Stat label="In" value={money(summary.income)} tone="income" />
            <Stat label="Out" value={money(summary.expense)} tone="expense" />
          </section>

          <section className="rounded-3xl bg-surface p-4 shadow-card">
            <h2 className="mb-3 text-sm font-medium text-fg">Daily spend</h2>
            {summary.expense === 0 ? (
              <p className="py-10 text-center text-sm text-muted">
                Daily bars show up once you add an expense.
              </p>
            ) : (
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={daily} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <XAxis
                      dataKey="day"
                      tick={{ fill: "var(--color-subtle)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval={4}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: "color-mix(in oklab, var(--color-fg) 4%, transparent)" }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.[0]) return null;
                        const v = Number(payload[0].value ?? 0);
                        return (
                          <div className="rounded-lg bg-raised px-2.5 py-1.5 text-xs shadow-float">
                            <span className="text-muted">Day {label}</span>
                            <span className="ml-2 tabular-nums text-fg">{money(v)}</span>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="spend"
                      name="Spend"
                      fill="var(--color-expense)"
                      radius={[3, 3, 0, 0]}
                      isAnimationActive={false}
                    />
                    <Bar
                      dataKey="invest"
                      name="Invested"
                      fill="var(--color-invest)"
                      radius={[3, 3, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-surface p-4 shadow-card">
            <h2 className="mb-3 text-sm font-medium text-fg">Where it went</h2>
            {cats.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                Categories fill in as you spend.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {cats.map((row) => (
                  <CategoryBar
                    key={row.id}
                    id={row.id}
                    amount={row.amount}
                    max={cats[0]?.amount ?? 1}
                    total={summary.expense}
                    money={money}
                    onOpen={() => setCategoryId(row.id)}
                    custom={custom}
                  />
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <section className="rounded-3xl bg-surface p-4 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-fg">Monthly spend limit</h2>
            <p className="mt-1 text-xs text-muted">
              {budget > 0 ? money(budget) : "No cap — set one in profile"}
            </p>
          </div>
          <Link to="/profile" className="text-xs font-medium text-muted hover:text-fg">
            Edit
          </Link>
        </div>
        {autoPayTotal > 0 ? (
          <p className="mt-2 text-xs text-muted">
            {money(autoPayTotal)} of this month is auto pays.
          </p>
        ) : null}
        {budget > 0 ? (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">
                {money(summary.expense)} of {money(budget)}
              </span>
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

      <Drawer open={categoryId !== null} onOpenChange={(next) => { if (!next) setCategoryId(null); }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{categoryLabel}</DrawerTitle>
            <DrawerDescription>
              {categoryRows.length === 0
                ? "Nothing in this category this month."
                : `${money(categoryTotal)} · ${categoryRows.length} ${categoryRows.length === 1 ? "entry" : "entries"}`}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            {categoryRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">No entries this month.</p>
            ) : (
              <GroupedList items={categoryRows} onOpen={openEdit} />
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "income" | "expense";
}) {
  return (
    <div className="rounded-3xl bg-surface px-4 py-4 shadow-card">
      <p className="text-xs text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-2xl font-semibold tracking-tight tabular-nums",
          tone === "income" ? "text-income" : "text-expense",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function CategoryBar({
  id,
  amount,
  max,
  total,
  money,
  onOpen,
  custom,
}: {
  id: CategoryId;
  amount: number;
  max: number;
  total: number;
  money: (n: number) => string;
  onOpen: () => void;
  custom: { id: string; label: string; type: "expense" | "income" }[];
}) {
  const cat = categoryById(id, custom);
  const invest = isInvestmentCategory(id);
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
  const width = max > 0 ? Math.max((amount / max) * 100, 4) : 0;
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-xl py-1 text-left transition-colors duration-150 hover:bg-raised"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-raised text-muted">
          <CategoryIcon id={id} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm text-fg">{cat.label}</span>
            <span className={cn("shrink-0 text-xs tabular-nums", invest ? "text-invest" : "text-muted")}>
              {money(amount)} · {pct}%
            </span>
          </span>
          <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-raised">
            <span
              className={cn(
                "block h-full rounded-full transition-[width] duration-200 ease-out",
                invest ? "bg-invest" : "bg-expense/80",
              )}
              style={{ width: `${width}%` }}
            />
          </span>
        </span>
      </button>
    </li>
  );
}
