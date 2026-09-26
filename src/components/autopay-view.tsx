import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Repeat } from "lucide-react";
import { AutoPaySheet } from "@/components/autopay-sheet";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { kindLabel, monthAutoPays, type AutoPay } from "@/lib/finance/autopay";
import { useFinanceStore } from "@/lib/finance/store";
import { useSettings } from "@/lib/ledger/use-settings";
import { parseISODate } from "@/lib/money";
import { cn } from "@/lib/utils";

function statusLabel(status: "posted" | "due" | "upcoming") {
  if (status === "posted") return "Posted";
  if (status === "due") return "Due";
  return "Upcoming";
}

export function AutoPayView() {
  const autoPays = useFinanceStore((s) => s.autoPays);
  const { format: money, todayIso, monthKey: month } = useSettings();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AutoPay | null>(null);

  const thisMonth = useMemo(
    () => monthAutoPays(autoPays, month, todayIso),
    [autoPays, month, todayIso],
  );
  const committed = thisMonth.reduce((n, row) => n + row.autoPay.amount, 0);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(ap: AutoPay) {
    setEditing(ap);
    setOpen(true);
  }

  const active = autoPays.filter((ap) => !ap.endDate || ap.endDate >= todayIso);
  const ended = autoPays.filter((ap) => ap.endDate && ap.endDate < todayIso);

  return (
    <div className="flex flex-col gap-6 px-5 pt-2 pb-8">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-subtle">
            Auto pays
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-fg">
            Monthly
          </h1>
          <p className="mt-1 text-sm text-muted">
            UPI mandates, SIPs, EMIs. Posted on the debit day.
          </p>
        </div>
        {autoPays.length > 0 ? (
          <Button size="sm" className="rounded-full" onClick={openNew}>
            Add
          </Button>
        ) : null}
      </header>

      {autoPays.length === 0 ? (
        <EmptyState
          title="No auto pays yet"
          body="Add a UPI mandate, mutual-fund SIP, or loan. We’ll post it each month until the last date."
          action="Add auto pay"
          onAction={openNew}
        />
      ) : (
        <>
          <section className="rounded-3xl bg-surface p-5 shadow-card">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">
              This month
            </p>
            <p className="mt-2 font-display text-3xl font-semibold tracking-tight tabular-nums text-fg">
              {money(committed)}
            </p>
            <p className="mt-1 text-sm text-muted">
              {thisMonth.length === 0
                ? "Nothing scheduled this month."
                : `${thisMonth.length} scheduled · ${thisMonth.filter((r) => r.status === "posted").length} posted`}
            </p>
          </section>

          {thisMonth.length > 0 || active.length > 0 ? (
            <section>
              <h2 className="mb-2 text-sm font-medium text-fg">Auto pays</h2>
              <ul className="flex flex-col gap-1">
                {active.map((ap) => {
                  const row = thisMonth.find((r) => r.autoPay.id === ap.id);
                  const day =
                    ap.dayOfMonth === 31 ? "Last day" : `Day ${ap.dayOfMonth}`;
                  const until = ap.endDate
                    ? ` · until ${format(parseISODate(ap.endDate), "d MMM yyyy")}`
                    : "";
                  const when = row
                    ? format(parseISODate(row.date), "d MMM")
                    : day;
                  return (
                    <AutoPayRow
                      key={ap.id}
                      name={ap.name}
                      kind={kindLabel(ap.kind)}
                      amount={money(ap.amount)}
                      meta={`${when}${row ? ` · ${day}` : until}`}
                      status={row?.status}
                      onClick={() => openEdit(ap)}
                    />
                  );
                })}
              </ul>
            </section>
          ) : null}

          {ended.length > 0 ? (
            <section>
              <h2 className="mb-2 text-sm font-medium text-fg">Ended</h2>
              <ul className="flex flex-col gap-1">
                {ended.map((ap) => (
                  <AutoPayRow
                    key={ap.id}
                    name={ap.name}
                    kind={kindLabel(ap.kind)}
                    amount={money(ap.amount)}
                    meta={`Ended ${format(parseISODate(ap.endDate!), "d MMM yyyy")}`}
                    muted
                    onClick={() => openEdit(ap)}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}

      <AutoPaySheet open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}

function AutoPayRow({
  name,
  kind,
  amount,
  meta,
  status,
  muted,
  onClick,
}: {
  name: string;
  kind: string;
  amount: string;
  meta: string;
  status?: "posted" | "due" | "upcoming";
  muted?: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex min-h-14 w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors duration-150 hover:bg-raised",
          muted && "opacity-60",
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-raised text-muted">
          <Repeat className="size-4" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-fg">{name}</span>
          <span className="block truncate text-xs text-muted">
            {kind}
            <span className="text-subtle"> · {meta}</span>
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="text-sm font-medium tabular-nums text-expense">−{amount}</span>
          {status ? (
            <Badge variant={status === "posted" ? "default" : status === "due" ? "expense" : "accent"}>
              {statusLabel(status)}
            </Badge>
          ) : null}
        </span>
      </button>
    </li>
  );
}
