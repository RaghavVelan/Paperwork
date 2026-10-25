import { Download, FolderOpen, RotateCcw } from "lucide-react";

const BACKUP_STEPS = [
  {
    n: "1",
    title: "Open Profile",
    body: "Tap the avatar at the top right. That’s where export lives — same place as name, currency, and the backup day.",
  },
  {
    n: "2",
    title: "Download the JSON",
    body: "Under “Move to another device”, tap Export for the full ledger. The file is paperwork-YYYY-MM-DD.json. Download CSV is only the entries, for a spreadsheet — it cannot restore the ledger.",
  },
  {
    n: "3",
    title: "Keep it somewhere safe",
    body: "Copy it to Drive, Files, AirDrop, or a USB stick. Paperwork never uploads the ledger — the file is the copy.",
  },
];

const RESTORE_STEPS = [
  {
    n: "1",
    title: "Open Profile on the new device",
    body: "Install Paperwork, finish the short setup, then open Profile again.",
  },
  {
    n: "2",
    title: "Import the file",
    body: "Tap Import and pick the paperwork-….json you saved. CSV files are not imported. You can also paste the JSON if you copied it.",
  },
  {
    n: "3",
    title: "Replace this device",
    body: "Confirm Replace. That overwrites what’s on this browser with the file — entries, auto pays, and settings.",
  },
];

function Steps({
  icon: Icon,
  heading,
  steps,
}: {
  icon: typeof Download;
  heading: string;
  steps: { n: string; title: string; body: string }[];
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-surface text-muted shadow-card">
          <Icon className="size-4" strokeWidth={1.75} />
        </span>
        <h2 className="text-sm font-medium text-fg">{heading}</h2>
      </div>
      <ol className="flex flex-col gap-2">
        {steps.map((step) => (
          <li key={step.n} className="flex gap-3 rounded-2xl bg-surface px-4 py-4 shadow-card">
            <span className="font-display text-lg font-semibold text-subtle">{step.n}</span>
            <div>
              <p className="text-sm font-medium text-fg">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function GuideView() {
  return (
    <div className="flex flex-col gap-8 px-5 pt-2 pb-10">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-subtle">Guide</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-fg">
          Backup and restore
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
          The ledger lives in this browser. Export JSON to move everything, or download CSV if you
          only want the entries in a spreadsheet. CSV is not a backup.
        </p>
      </header>

      <Steps icon={Download} heading="Save a backup" steps={BACKUP_STEPS} />
      <Steps icon={FolderOpen} heading="Restore from a file" steps={RESTORE_STEPS} />

      <p className="flex items-start gap-2 text-sm leading-relaxed text-muted">
        <RotateCcw className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
        Import replaces everything on the destination. Export first if you might still need what’s
        here.
      </p>
    </div>
  );
}
