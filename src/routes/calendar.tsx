import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarView } from "@/components/calendar-view";
import { summarize } from "@/lib/finance/selectors";
import { useSheetStore } from "@/lib/finance/sheet";
import { useFinanceStore } from "@/lib/finance/store";
import { useSettings } from "@/lib/ledger/use-settings";
import { monthKey, parseISODate, startOfMonth, toISODate } from "@/lib/money";

export const Route = createFileRoute("/calendar")({
  validateSearch: (raw: Record<string, unknown>): { date?: string } => ({
    date:
      typeof raw.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.date)
        ? raw.date
        : undefined,
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const { date } = Route.useSearch();
  const transactions = useFinanceStore((s) => s.transactions);
  const openNew = useSheetStore((s) => s.openNew);
  const openEdit = useSheetStore((s) => s.openEdit);
  const { todayIso } = useSettings();

  const initial = date ?? todayIso;
  const [selectedDate, setSelectedDate] = useState(initial);
  const [cursor, setCursor] = useState(() => startOfMonth(parseISODate(initial)));

  useEffect(() => {
    if (!date) return;
    setSelectedDate(date);
    setCursor(startOfMonth(parseISODate(date)));
  }, [date]);

  const month = monthKey(cursor);
  const summary = useMemo(() => summarize(transactions, month), [transactions, month]);

  function onCursorChange(d: Date) {
    setCursor(d);
    if (!selectedDate.startsWith(monthKey(d))) setSelectedDate(toISODate(d));
  }

  return (
    <CalendarView
      cursor={cursor}
      onCursorChange={onCursorChange}
      selectedDate={selectedDate}
      onSelectDate={setSelectedDate}
      byDay={summary.byDay}
      transactions={transactions}
      onOpenTx={openEdit}
      onAdd={(iso) => openNew(iso)}
    />
  );
}
