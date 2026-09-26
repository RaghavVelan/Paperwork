import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import { Toaster } from "sonner";
import { AppLink } from "@/components/app-link";
import { NAV_ITEMS } from "@/components/nav-items";
import { Onboarding } from "@/components/onboarding";
import { AvatarMark, ProfileAvatar } from "@/components/profile-avatar";
import { ThemeController, useResolvedTheme } from "@/components/theme-controller";
import { ThemeToggle } from "@/components/theme-toggle";
import { TransactionSheet } from "@/components/transaction-sheet";
import { Button } from "@/components/ui/button";
import { useFinanceHydration, useFinanceStore } from "@/lib/finance/store";
import { useSheetStore } from "@/lib/finance/sheet";
import { useSettings } from "@/lib/ledger/use-settings";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const hydrated = useFinanceHydration();
  const onboarded = useFinanceStore((s) => s.profile.onboarded);
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

  const chrome = (
    <>
      <ThemeController />
      <Toaster
        theme={toastTheme}
        position="top-center"
        toastOptions={{ className: "bg-raised text-fg shadow-float border-0" }}
      />
    </>
  );

  if (!hydrated || !onboarded) {
    return (
      <MotionConfig reducedMotion="user">
        {chrome}
        <Onboarding />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      {chrome}
      <div className="min-h-dvh bg-bg lg:flex">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border px-4 py-6 lg:flex">
          <AppLink href="/" className="px-2">
            <p className="font-display text-2xl font-semibold tracking-tight text-fg">
              Paperwork
            </p>
            <p className="mt-1 text-xs text-subtle">A quiet personal ledger</p>
          </AppLink>
          <nav className="mt-8 flex flex-col gap-1" aria-label="Main">
            {NAV_ITEMS.map((item) => {
              const active = item.match(pathname);
              const Icon = item.icon;
              return (
                <AppLink
                  key={item.href}
                  href={item.href}
                  active={active}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-150",
                    active
                      ? "bg-surface text-fg shadow-card"
                      : "text-muted hover:bg-raised hover:text-fg",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </AppLink>
              );
            })}
          </nav>
          <Button
            type="button"
            className="mt-6 w-full rounded-xl"
            onClick={() => openNew()}
          >
            <Plus className="size-4" />
            Add entry
          </Button>
          <div className="mt-auto flex flex-col gap-1">
            <AppLink
              href="/about"
              active={pathname.startsWith("/about")}
              className={cn(
                "rounded-xl px-3 py-2 text-xs text-subtle transition-colors duration-150 hover:bg-raised hover:text-fg",
                pathname.startsWith("/about") && "bg-surface text-muted shadow-card",
              )}
            >
              About
            </AppLink>
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
              <p className="font-display text-xl font-semibold tracking-tight text-fg">
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
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transition.page}
              className="mx-auto w-full max-w-xl"
            >
              {children}
            </motion.div>
          </main>

          <nav
            className={cn(
              "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/90 pb-safe backdrop-blur-md transition-opacity duration-200 lg:hidden",
              sheetOpen && "pointer-events-none opacity-0",
            )}
            aria-label="Main"
          >
            <div className="mx-auto grid max-w-xl grid-cols-4 px-1 pt-1">
              {NAV_ITEMS.map((item) => {
                const active = item.match(pathname);
                const Icon = item.icon;
                return (
                  <AppLink
                    key={item.href}
                    href={item.href}
                    active={active}
                    className={cn(
                      "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-2xs font-medium transition-colors duration-150",
                      active ? "bg-raised text-fg" : "text-subtle",
                    )}
                  >
                    <Icon className={cn("size-5", active ? "text-fg" : "text-muted")} />
                    {item.label}
                  </AppLink>
                );
              })}
            </div>
          </nav>
        </div>

        <TransactionSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          editing={editing}
          defaultDate={draftDate || todayIso}
        />
      </div>
    </MotionConfig>
  );
}
