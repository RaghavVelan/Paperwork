import { PRIVACY_CONTACT, PRIVACY_SECTIONS, PRIVACY_UPDATED } from "@/lib/legal/privacy";

export function PrivacyView({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "flex flex-col gap-5" : "flex flex-col gap-6 px-5 pt-2 pb-10"}>
      {!compact ? (
        <header>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-subtle">Legal</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-fg">
            Privacy policy
          </h1>
          <p className="mt-2 text-sm text-muted">Updated {PRIVACY_UPDATED}</p>
        </header>
      ) : (
        <p className="text-sm text-muted">Updated {PRIVACY_UPDATED}</p>
      )}

      {PRIVACY_SECTIONS.map((section) => (
        <section key={section.heading}>
          <h2 className="text-sm font-medium text-fg">{section.heading}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{section.body}</p>
        </section>
      ))}

      <p className="text-sm text-muted">
        Contact{" "}
        <a className="text-fg underline decoration-border underline-offset-4" href={`mailto:${PRIVACY_CONTACT}`}>
          {PRIVACY_CONTACT}
        </a>
        .
      </p>
    </div>
  );
}
