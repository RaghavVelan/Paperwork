import { ArrowUpRight, Linkedin, Mail } from "lucide-react";

const EMAIL = "vraghav950@gmail.com";
const LINKEDIN = "https://www.linkedin.com/in/raghav-velan";

const CHANGELOG = [
  {
    date: "27 Sep 2026",
    items: [
      "Install as Paperwork on the home screen.",
      "Works offline after the first visit. Later pushes still show up when you’re online.",
    ],
  },
  {
    date: "26 Sep 2026",
    items: [
      "Auto pays for UPI mandates, SIPs, and loans, with an optional last date.",
      "Export and import the ledger to move between devices.",
      "About page.",
      "First public release: empty-start onboarding, calendar, insights, theme, and a local ledger.",
    ],
  },
] as const;

export function AboutView() {
  return (
    <div className="flex flex-col gap-8 px-5 pt-2 pb-10">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-subtle">About</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-fg">
          Paperwork
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
          A quiet personal ledger. Money in and out on this device, on a calendar — no account
          required. Auto pays cover the monthly stuff: UPI mandates, SIPs, loans. After the first
          visit it works offline; add it to your home screen as Paperwork.
        </p>
      </header>

      <section className="rounded-3xl bg-surface p-5 shadow-card">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">
          Developed by
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-fg">
          Raghav Velan
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Designed and built as a calm place to see what actually moved this month.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-fg">Changelog</h2>
        <ol className="flex flex-col gap-3">
          {CHANGELOG.map((entry, index) => (
            <li key={`${entry.date}-${index}`} className="rounded-2xl bg-surface px-4 py-4 shadow-card">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">
                {entry.date}
              </p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {entry.items.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-muted">
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-fg">Contact</h2>
        <ul className="flex flex-col gap-2">
          <li>
            <a
              href={`mailto:${EMAIL}`}
              className="flex min-h-14 items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card transition-colors duration-150 hover:bg-raised"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-raised text-muted">
                <Mail className="size-4" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-fg">Email</span>
                <span className="block truncate text-xs text-muted">{EMAIL}</span>
              </span>
              <ArrowUpRight className="size-4 text-subtle" />
            </a>
          </li>
          <li>
            <a
              href={LINKEDIN}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-14 items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card transition-colors duration-150 hover:bg-raised"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-raised text-muted">
                <Linkedin className="size-4" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-fg">LinkedIn</span>
                <span className="block truncate text-xs text-muted">raghav-velan</span>
              </span>
              <ArrowUpRight className="size-4 text-subtle" />
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
