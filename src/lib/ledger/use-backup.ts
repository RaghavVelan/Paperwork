import { toast } from "sonner";
import { useFinanceStore } from "@/lib/finance/store";
import { useSettings } from "@/lib/ledger/use-settings";
import { buildExport, downloadJson, exportFilename } from "@/lib/ledger/transfer";

export function useLedgerBackup() {
  const profile = useFinanceStore((s) => s.profile);
  const transactions = useFinanceStore((s) => s.transactions);
  const autoPays = useFinanceStore((s) => s.autoPays);
  const categories = useFinanceStore((s) => s.categories);
  const updateProfile = useFinanceStore((s) => s.updateProfile);
  const { todayIso } = useSettings();

  function downloadBackup() {
    const body = buildExport({ profile, transactions, autoPays, categories });
    downloadJson(exportFilename(todayIso), body);
    updateProfile({ lastBackupAt: new Date().toISOString(), backupSnoozedOn: undefined });
    toast.success("Backup downloaded");
  }

  function snoozeBackup() {
    updateProfile({ backupSnoozedOn: todayIso });
  }

  return { downloadBackup, snoozeBackup, todayIso };
}
