import * as Popover from "@radix-ui/react-popover";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useFinanceStore } from "@/lib/finance/store";
import { applyTheme, type ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

const OPTIONS: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
  const mode = useFinanceStore((s) => s.profile.theme);
  const updateProfile = useFinanceStore((s) => s.updateProfile);
  const current = OPTIONS.find((opt) => opt.id === mode) ?? OPTIONS[2];
  const CurrentIcon = current.icon;

  function setMode(next: ThemeMode) {
    applyTheme(next);
    updateProfile({ theme: next });
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`Theme, ${current.label}`}
          className={cn(
            "flex size-9 items-center justify-center rounded-full text-fg hover:bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
            className,
          )}
        >
          <CurrentIcon className="size-4" strokeWidth={1.75} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-40 rounded-2xl bg-surface p-1 shadow-card outline-none"
        >
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = mode === opt.id;
            return (
              <Popover.Close asChild key={opt.id}>
                <button
                  type="button"
                  onClick={() => setMode(opt.id)}
                  className={cn(
                    "flex h-10 w-full items-center gap-2.5 rounded-xl px-2.5 text-sm",
                    active ? "bg-raised text-fg" : "text-muted hover:bg-raised hover:text-fg",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                  <span className="flex-1 text-left">{opt.label}</span>
                  {active ? <Check className="size-3.5 text-fg" /> : null}
                </button>
              </Popover.Close>
            );
          })}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
