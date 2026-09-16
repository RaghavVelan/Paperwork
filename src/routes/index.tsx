import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { HomeView, monthTitle } from "@/components/home-view";
import { monthFromDate, summarize } from "@/lib/finance/selectors";
import { useSheetStore } from "@/lib/finance/sheet";
import { useFinanceStore } from "@/lib/finance/store";
import { useSettings } from "@/lib/ledger/use-settings";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
  const transactions = useFinanceStore((s) => s.transactions);
  const budget = useFinanceStore((s) => s.profile.monthlyBudget);
  const openNew = useSheetStore((s) => s.openNew);
  const openEdit = useSheetStore((s) => s.openEdit);
  const { todayIso, monthKey: month } = useSettings();
  const [selectedDate, setSelectedDate] = useState(todayIso);

  const summary = useMemo(() => summarize(transactions, month), [transactions, month]);

  const recent = useMemo(() => {
    return [...transactions]
      .filter((t) => monthFromDate(t.date) === month)
      .sort((a, b) => {
        if (a.date === b.date) return b.createdAt.localeCompare(a.createdAt);
        return b.date.localeCompare(a.date);
      })
      .slice(0, 18);
  }, [transactions, month]);

  return (
    <HomeView
      monthLabel={monthTitle(month)}
      summary={summary}
      budget={budget}
      recent={recent}
      byDay={summary.byDay}
      selectedDate={selectedDate}
      onSelectDate={setSelectedDate}
      onOpenTx={openEdit}
      onAdd={() => openNew()}
    />
  );
}
