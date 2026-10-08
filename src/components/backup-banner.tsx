import { Download } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useFinanceStore } from "@/lib/finance/store";
import { backupReminderDue, weekdayLabel } from "@/lib/ledger/backup";
import { useLedgerBackup } from "@/lib/ledger/use-backup";

export function BackupBanner() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const profile = useFinanceStore((s) => s.profile);
  const { downloadBackup, snoozeBackup } = useLedgerBackup();
  if (pathname.startsWith("/guide") || pathname.startsWith("/about") || pathname.startsWith("/privacy")) {
    return null;
  }
  if (!backupReminderDue(profile)) return null;

  return (
    <aside className="mx-auto w-full max-w-xl px-5 pt-4">
      <div className="flex flex-col gap-3 rounded-3xl bg-surface px-4 py-4 shadow-card">
        <div>
          <p className="text-sm font-medium text-fg">Weekly backup</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {weekdayLabel(profile.backupWeekday)} — download a JSON copy of this device. Change the
            day in Profile.
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="h-10 flex-1 rounded-xl" onClick={downloadBackup}>
            <Download className="size-4" />
            Download
          </Button>
          <Button variant="secondary" className="h-10 rounded-xl px-4" onClick={snoozeBackup}>
            Not today
          </Button>
        </div>
      </div>
    </aside>
  );
}
