import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { monthTitle } from "@/components/home-view";
import { InsightsView } from "@/components/insights-view";
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
  const openNew = useSheetStore((s) => s.openNew);
  const { monthKey: currentMonth, todayIso } = useSettings();
  const [picked, setPicked] = useState<string | null>(null);
  const month = picked && picked <= currentMonth ? picked : currentMonth;
  const summary = useMemo(() => summarize(transactions, month), [transactions, month]);
  const autoPayTotal = useMemo(
    () => monthAutoPays(autoPays, month, todayIso).reduce((n, row) => n + row.autoPay.amount, 0),
    [autoPays, month, todayIso],
  );

  function shift(delta: number) {
    const next = monthKey(addMonths(parseISODate(`${month}-01`), delta));
    if (next > currentMonth) return;
    setPicked(next);
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
    />
  );
}