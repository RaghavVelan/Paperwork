import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion, MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import { AppLink } from "@/components/app-link";
import { NAV_ITEMS } from "@/components/nav-items";
import { AvatarMark, ProfileAvatar } from "@/components/profile-avatar";
import { ThemeController, useResolvedTheme } from "@/components/theme-controller";
import { ThemeToggle } from "@/components/theme-toggle";
import { TransactionSheet } from "@/components/transaction-sheet";
import { Button } from "@/components/ui/button";
import { useFinanceHydration, useFinanceStore } from "@/lib/finance/store";
import { useSheetStore } from "@/lib/finance/sheet";
import { useSettings } from "@/lib/ledger/use-settings";
import { cn } from "@/lib/utils";

const spring = { type: "spring" as const, duration: 0.35, bounce: 0 };

export function AppShell({ children }: { children: ReactNode }) {
  useFinanceHydration();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const openNew = useSheetStore((s) => s.openNew);
  const sheetOpen = useSheetStore((s) => s.open);
  const setSheetOpen = useSheetStore((s) => s.setOpen);
  const editingId = useSheetStore((s) => s.editingId);
  const draftDate = useSheetStore((s) => s.draftDate);
  const transactions = useFinanceStore((s) => s.transactions);
  const displayName = useFinanceStore((s) => s.profile.displayName);
  const { todayIso } = useSettings();
  const toastTheme = useResolvedTheme();
  const editing = editingId
    ? (transactions.find((t) => t.id === editingId) ?? null)
    : null;
  const profileActive = pathname.startsWith("/profile");

  return (
    <MotionConfig reducedMotion="user">
      <ThemeController />
      <div className="min-h-dvh bg-bg lg:flex">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border px-4 py-6 lg:flex">
          <AppLink href="/" className="px-2">
            <p className="font-display text-2xl font-medium tracking-tight text-fg">
              Paperwork
            </p>
            <p className="mt-1 text-xs text-subtle">A quiet personal ledger</p>
          </AppLink>
          <nav className="mt-8 flex flex-col gap-1" aria-label="Main">
            <LayoutGroup id="side-nav">
              {NAV_ITEMS.map((item) => {
                const active = item.match(pathname);
                const Icon = item.icon;
                return (
                  <AppLink
                    key={item.href}
                    href={item.href}
                    active={active}
                    className={cn(
                      "relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-150",
                      active ? "text-fg" : "text-muted hover:text-fg",
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="side-nav-pill"
                        className="absolute inset-0 rounded-xl bg-surface shadow-card"
                        transition={spring}
                      />
                    ) : null}
                    <Icon className="relative z-10 size-4" />
                    <span className="relative z-10">{item.label}</span>
                  </AppLink>
                );
              })}
            </LayoutGroup>
          </nav>
          <Button
            type="button"
            className="mt-6 w-full rounded-xl"
            onClick={() => openNew()}
          >
            <Plus className="size-4" />
            Add entry
          </Button>
          <div className="mt-auto">
            <AppLink
              href="/profile"
              active={profileActive}
              className={cn(
                "flex items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-150 hover:bg-raised",
                profileActive && "bg-surface shadow-card",
              )}
            >
              <AvatarMark name={displayName} size="sm" active={profileActive} />
              <span className="min-w-0">
                <span className="block truncate text-sm text-fg">
                  {displayName.trim() || "Profile"}
                </span>
                <span className="block truncate text-xs text-subtle">
                  Name, currency, cap
                </span>
              </span>
            </AppLink>
          </div>
        </aside>

        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-bg/85 px-4 py-3 backdrop-blur-md">
            <AppLink href="/" className="lg:hidden">
              <p className="font-display text-xl font-medium tracking-tight text-fg">
                Paperwork
              </p>
            </AppLink>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <Button
                type="button"
                size="sm"
                className="rounded-full pr-3.5 pl-3 lg:hidden"
                onClick={() => openNew()}
              >
                <Plus className="size-4" />
                Add
              </Button>
              <ProfileAvatar active={profileActive} />
            </div>
          </header>

          <main className="flex-1 pb-24 lg:pb-10">
            <div className="mx-auto w-full max-w-xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          <nav
            className={cn(
              "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/90 pb-safe backdrop-blur-md lg:hidden",
              sheetOpen && "hidden",
            )}
            aria-label="Main"
          >
            <LayoutGroup id="tab-nav">
              <div className="mx-auto grid max-w-xl grid-cols-3 px-2 pt-1">
                {NAV_ITEMS.map((item) => {
                  const active = item.match(pathname);
                  const Icon = item.icon;
                  return (
                    <AppLink
                      key={item.href}
                      href={item.href}
                      active={active}
                      className={cn(
                        "relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-2xs font-medium transition-colors duration-150",
                        active ? "text-fg" : "text-subtle",
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId="tab-nav-pill"
                          className="absolute inset-x-3 inset-y-1 rounded-xl bg-raised"
                          transition={spring}
                        />
                      ) : null}
                      <Icon className={cn("relative z-10 size-5", active ? "text-fg" : "text-muted")} />
                      <span className="relative z-10">{item.label}</span>
                    </AppLink>
                  );
                })}
              </div>
            </LayoutGroup>
          </nav>
        </div>

        <TransactionSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          editing={editing}
          defaultDate={draftDate || todayIso}
        />
        <Toaster
          theme={toastTheme}
          position="top-center"
          toastOptions={{
            className: "bg-raised text-fg shadow-float border-0",
          }}
        />
      </div>
    </MotionConfig>
  );
}
