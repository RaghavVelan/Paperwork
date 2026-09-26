import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useFinanceStore } from "@/lib/finance/store";
import {
  buildExport,
  downloadJson,
  exportFilename,
  readExport,
  summarizeSnapshot,
} from "@/lib/ledger/transfer";
import type { LedgerSnapshot } from "@/lib/ledger/types";
import { useSettings } from "@/lib/ledger/use-settings";

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export function LedgerTransfer() {
  const profile = useFinanceStore((s) => s.profile);
  const transactions = useFinanceStore((s) => s.transactions);
  const autoPays = useFinanceStore((s) => s.autoPays);
  const replaceLedger = useFinanceStore((s) => s.replaceLedger);
  const { todayIso } = useSettings();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<LedgerSnapshot | null>(null);

  function exportFile() {
    const body = buildExport({ profile, transactions, autoPays });
    downloadJson(exportFilename(todayIso), body);
    toast.success("Ledger file downloaded");
  }

  async function copyFile() {
    const body = buildExport({ profile, transactions, autoPays });
    try {
      await navigator.clipboard.writeText(body);
      toast.success("Copied. Paste into a file on the other device if you like.");
    } catch {
      toast.error("Couldn’t copy. Download the file instead.");
    }
  }

  async function onPick(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      toast.error("That file is too large.");
      return;
    }
    try {
      const raw = await file.text();
      const snapshot = readExport(raw);
      if (!snapshot) {
        toast.error("Not a Paperwork ledger file.");
        return;
      }
      setPending(snapshot);
    } catch {
      toast.error("Couldn’t read that file.");
    }
  }

  function confirmImport() {
    if (!pending) return;
    replaceLedger(pending);
    const summary = summarizeSnapshot(pending);
    setPending(null);
    toast.success(`Imported ${summary.name} · ${summary.entries} entries`);
  }

  const summary = pending ? summarizeSnapshot(pending) : null;

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-card">
      <h2 className="text-sm font-medium text-fg">Move to another device</h2>
      <p className="mt-1 text-sm text-muted">
        Everything lives in this browser. Export a file here, then import it on the new phone
        or laptop.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          void onPick(file);
        }}
      />

      {pending && summary ? (
        <div className="mt-4 rounded-2xl bg-raised p-4">
          <p className="text-sm text-fg">
            Replace this device with <span className="font-medium">{summary.name}</span>?
          </p>
          <p className="mt-1 text-xs text-muted">
            {summary.entries} entries · {summary.autoPays} auto pays. Current data on this
            device is overwritten.
          </p>
          <div className="mt-3 flex gap-2">
            <Button className="h-10 flex-1 rounded-xl" onClick={confirmImport}>
              Replace
            </Button>
            <Button
              variant="secondary"
              className="h-10 rounded-xl"
              onClick={() => setPending(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="secondary" className="h-11 rounded-xl" onClick={exportFile}>
            Export
          </Button>
          <Button
            variant="secondary"
            className="h-11 rounded-xl"
            onClick={() => inputRef.current?.click()}
          >
            Import
          </Button>
          <Button variant="ghost" className="col-span-2 h-10 rounded-xl" onClick={() => void copyFile()}>
            Copy JSON
          </Button>
        </div>
      )}
    </section>
  );
}
