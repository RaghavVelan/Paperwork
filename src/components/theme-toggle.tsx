import { Monitor, Moon, Sun } from "lucide-react";
import { LayoutGroup, motion } from "motion/react";
import { useFinanceStore } from "@/lib/finance/store";
import { applyTheme, type ThemeMode } from "@/lib/theme";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";

const OPTIONS: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
  const mode = useFinanceStore((s) => s.profile.theme);
  const updateProfile = useFinanceStore((s) => s.updateProfile);

  function setMode(next: ThemeMode) {
    applyTheme(next);
    updateProfile({ theme: next });
  }

  return (
    <LayoutGroup id="theme-toggle">
      <div
        role="radiogroup"
        aria-label="Theme"
        className={cn("relative flex h-9 items-center rounded-full bg-raised p-0.5 shadow-card", className)}
      >
        {OPTIONS.map((opt) => {
          const active = mode === opt.id;
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={opt.label}
              title={opt.label}
              onClick={() => setMode(opt.id)}
              className={cn(
                "relative z-10 flex size-8 items-center justify-center rounded-full",
                active ? "text-fg" : "text-subtle hover:text-fg",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="theme-thumb"
                  className="absolute inset-0 rounded-full bg-surface shadow-card"
                  transition={transition.spring}
                />
              ) : null}
              <Icon className="relative z-10 size-3.5" strokeWidth={1.75} />
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
