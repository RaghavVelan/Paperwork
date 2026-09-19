import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CategoryIcon } from "@/components/category-icon";
import { categoryById } from "@/lib/finance/categories";
import type { MonthSummary } from "@/lib/finance/selectors";
import type { CategoryId } from "@/lib/finance/types";
import { useSettings } from "@/lib/ledger/use-settings";
import { daysInMonth, parseISODate, startOfMonth, toISODate } from "@/lib/money";
import { cn } from "@/lib/utils";

export function InsightsView({
  monthLabel,
  month,
  summary,
  budget,
}: {
  monthLabel: string;
  month: string;
  summary: MonthSummary;
  budget: number;
}) {
  const { format: money } = useSettings();
  const monthDate = parseISODate(`${month}-01`);
  const start = startOfMonth(monthDate);
  const dim = daysInMonth(start);

  const daily = useMemo(() => {
    return Array.from({ length: dim }, (_, i) => {
      const iso = toISODate(new Date(start.getFullYear(), start.getMonth(), i + 1));
      const roll = summary.byDay.get(iso);
      return { day: String(i + 1), expense: roll?.expense ?? 0, income: roll?.income ?? 0 };
    });
  }, [dim, start, summary.byDay]);

  const cats = useMemo(() => {
    return [...summary.byCategory.entries()]
      .map(([id, amount]) => ({ id, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [summary.byCategory]);

  const maxCat = cats[0]?.amount ?? 1;
  const rate =
    summary.income > 0
      ? Math.round(((summary.income - summary.expense) / summary.income) * 100)
      : null;
  const spentPct = budget > 0 ? Math.min(summary.expense / budget, 1.4) : 0;
  const over = budget > 0 && summary.expense > budget;

  return (
    <div className="flex flex-col gap-6 px-5 pt-2 pb-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-subtle">
          Insights
        </p>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-tight text-fg">
          {monthLabel}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {rate === null
            ? "Add income to see a save rate."
            : rate >= 0
              ? `${rate}% of income kept`
              : `${Math.abs(rate)}% over income`}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <Stat label="In" value={money(summary.income)} tone="income" />
        <Stat label="Out" value={money(summary.expense)} tone="expense" />
      </section>

      <section className="rounded-3xl bg-surface p-4 shadow-card">
        <h2 className="mb-3 text-sm font-medium text-fg">Daily spend</h2>
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
              <Bar dataKey="expense" fill="var(--color-expense)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-3xl bg-surface p-4 shadow-card">
        <h2 className="mb-3 text-sm font-medium text-fg">Where it went</h2>
        {cats.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No expenses this month.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {cats.map((row) => (
              <CategoryBar
                key={row.id}
                id={row.id}
                amount={row.amount}
                max={maxCat}
                total={summary.expense}
                money={money}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl bg-surface p-4 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-fg">Monthly spend limit</h2>
            <p className="mt-1 text-xs text-muted">
              {budget > 0 ? money(budget) : "No cap — set one in profile"}
            </p>
          </div>
          <Link
            to="/profile"
            className="text-xs font-medium text-muted hover:text-fg"
          >
            Edit
          </Link>
        </div>
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
                  "h-full rounded-full transition-[width] duration-300",
                  over ? "bg-expense" : "bg-accent",
                )}
                style={{ width: `${Math.min(spentPct, 1) * 100}%` }}
              />
            </div>
          </div>
        ) : null}
      </section>
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
          "mt-1 font-display text-2xl tracking-tight tabular-nums",
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
}: {
  id: CategoryId;
  amount: number;
  max: number;
  total: number;
  money: (n: number) => string;
}) {
  const cat = categoryById(id);
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
  const width = max > 0 ? Math.max((amount / max) * 100, 4) : 0;
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-raised text-muted">
        <CategoryIcon id={id} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm text-fg">{cat.label}</span>
          <span className="shrink-0 text-xs tabular-nums text-muted">
            {money(amount)} · {pct}%
          </span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-raised">
          <motion.div
            className="h-full origin-left rounded-full bg-expense/80"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: width / 100 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </li>
  );
}
