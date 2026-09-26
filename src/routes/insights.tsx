import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { monthTitle } from "@/components/home-view";
import { InsightsView } from "@/components/insights-view";
import { monthAutoPays } from "@/lib/finance/autopay";
import { summarize } from "@/lib/finance/selectors";
import { useSheetStore } from "@/lib/finance/sheet";
import { useFinanceStore } from "@/lib/finance/store";
import { useSettings } from "@/lib/ledger/use-settings";

export const Route = createFileRoute("/insights")({ component: InsightsPage });

function InsightsPage() {
  const transactions = useFinanceStore((s) => s.transactions);
  const autoPays = useFinanceStore((s) => s.autoPays);
  const budget = useFinanceStore((s) => s.profile.monthlyBudget);
  const openNew = useSheetStore((s) => s.openNew);
  const { monthKey: month, todayIso } = useSettings();
  const summary = useMemo(() => summarize(transactions, month), [transactions, month]);
  const autoPayTotal = useMemo(
    () => monthAutoPays(autoPays, month, todayIso).reduce((n, row) => n + row.autoPay.amount, 0),
    [autoPays, month, todayIso],
  );

  return (
    <InsightsView
      monthLabel={monthTitle(month)}
      month={month}
      summary={summary}
      budget={budget}
      onAdd={() => openNew()}
      autoPayTotal={autoPayTotal}
    />
  );
}
