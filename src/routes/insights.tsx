import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { monthTitle } from "@/components/home-view";
import { InsightsView } from "@/components/insights-view";
import { summarize } from "@/lib/finance/selectors";
import { useFinanceStore } from "@/lib/finance/store";
import { useSettings } from "@/lib/ledger/use-settings";

export const Route = createFileRoute("/insights")({ component: InsightsPage });

function InsightsPage() {
  const transactions = useFinanceStore((s) => s.transactions);
  const budget = useFinanceStore((s) => s.profile.monthlyBudget);
  const { monthKey: month } = useSettings();
  const summary = useMemo(() => summarize(transactions, month), [transactions, month]);

  return (
    <InsightsView
      monthLabel={monthTitle(month)}
      month={month}
      summary={summary}
      budget={budget}
    />
  );
}
