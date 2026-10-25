import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { monthTitle } from "@/components/home-view";
import { InsightsView } from "@/components/insights-view";
import { YearView } from "@/components/year-insights";
import { monthAutoPays } from "@/lib/finance/autopay";
import { summarize } from "@/lib/finance/selectors";
import { useSheetStore } from "@/lib/finance/sheet";
import { useFinanceStore } from "@/lib/finance/store";
import { useSettings } from "@/lib/ledger/use-settings";
import { addMonths, monthKey, parseISODate } from "@/lib/money";

export const Route = createFileRoute("/insights")({ component: InsightsPage });

function InsightsPage() {
  const transactions = useFinanceStore((s) => s.transactions);
  const autoPays = useFinanceStore((s) => s.autoPays);
  const budget = useFinanceStore((s) => s.profile.monthlyBudget);
  const categoryBudgets = useFinanceStore((s) => s.profile.categoryBudgets);
  const openNew = useSheetStore((s) => s.openNew);
  const { monthKey: currentMonth, todayIso } = useSettings();
  const [picked, setPicked] = useState<string | null>(null);
  const [span, setSpan] = useState<"month" | "year">("month");
  const month = picked && picked <= currentMonth ? picked : currentMonth;
  const year = month.slice(0, 4);
  const currentYear = currentMonth.slice(0, 4);
  const summary = useMemo(() => summarize(transactions, month), [transactions, month]);
  const autoPayTotal = useMemo(
    () =>
      monthAutoPays(autoPays, month, todayIso)
        .filter((row) => row.autoPay.type !== "income")
        .reduce((n, row) => n + row.autoPay.amount, 0),
    [autoPays, month, todayIso],
  );

  function shift(delta: number) {
    const next = monthKey(addMonths(parseISODate(`${month}-01`), delta));
    if (next > currentMonth) return;
    setPicked(next);
  }

  if (span === "year") {
    return (
      <YearView
        eyebrow="Insights"
        year={year}
        transactions={transactions}
        canGoForward={year < currentYear}
        onPrev={() => setPicked(`${Number(year) - 1}-01`)}
        onNext={() => {
          const next = String(Number(year) + 1);
          if (next <= currentYear) setPicked(`${next}-01`);
        }}
        onShowMonth={() => setSpan("month")}
        onOpenMonth={(next) => {
          if (next <= currentMonth) {
            setPicked(next);
            setSpan("month");
          }
        }}
        currentMonth={currentMonth}
      />
    );
  }

  return (
    <InsightsView
      monthLabel={monthTitle(month)}
      month={month}
      summary={summary}
      budget={budget}
      onAdd={() => openNew()}
      autoPayTotal={autoPayTotal}
      canGoForward={month < currentMonth}
      onPrevMonth={() => shift(-1)}
      onNextMonth={() => shift(1)}
      onShowYear={() => setSpan("year")}
      categoryBudgets={categoryBudgets}
    />
  );
}