import { format } from "date-fns";
import type { Transaction } from "@/lib/finance/types";
import { useSettings } from "@/lib/ledger/use-settings";
import { parseISODate } from "@/lib/money";
import { addDaysISO } from "@/lib/time";
import { TransactionRow } from "./transaction-row";

function headingFor(iso: string, todayIso: string): string {
  if (iso === todayIso) return "Today";
  if (iso === addDaysISO(todayIso, -1)) return "Yesterday";
  return format(parseISODate(iso), "EEE, d MMM");
}

export function GroupedList({
  items,
  onOpen,
}: {
  items: Transaction[];
  onOpen: (id: string) => void;
}) {
  const { todayIso } = useSettings();
  const groups: { date: string; rows: Transaction[] }[] = [];
  for (const tx of items) {
    const last = groups[groups.length - 1];
    if (last && last.date === tx.date) last.rows.push(tx);
    else groups.push({ date: tx.date, rows: [tx] });
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => (
        <section key={g.date}>
          <h3 className="mb-1 px-2 text-2xs font-medium uppercase tracking-[0.14em] text-subtle">
            {headingFor(g.date, todayIso)}
          </h3>
          <div className="flex flex-col">
            {g.rows.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} onOpen={onOpen} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
