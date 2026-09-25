import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { useFinanceStore } from "@/lib/finance/store";
import { detectTimezone, timezoneChoices } from "@/lib/ledger/timezones";
import { easeOut } from "@/lib/motion";
import { groupDigits, parseAmountInput } from "@/lib/money";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: easeOut } },
};

export function Onboarding() {
  const profile = useFinanceStore((s) => s.profile);
  const completeOnboarding = useFinanceStore((s) => s.completeOnboarding);
  const [name, setName] = useState(profile.displayName);
  const [timezone, setTimezone] = useState(() => detectTimezone());
  const [budget, setBudget] = useState(
    profile.monthlyBudget > 0 ? String(profile.monthlyBudget) : "",
  );

  const zones = timezoneChoices();
  const ready = name.trim().length > 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    completeOnboarding({
      displayName: name.trim(),
      timezone,
      monthlyBudget: Math.max(0, Math.round(parseAmountInput(budget))),
    });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex items-center justify-between px-5 py-4">
        <p className="font-display text-lg font-semibold tracking-tight text-fg">Paperwork</p>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
        >
          <motion.p
            variants={fadeUp}
            className="text-xs font-medium uppercase tracking-[0.18em] text-subtle"
          >
            First time here
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="mt-2 font-display text-3xl font-semibold tracking-tight text-fg"
          >
            Set up your ledger
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-2 text-sm leading-relaxed text-muted">
            Name, timezone, and an optional monthly cap. Nothing is added until you do.
          </motion.p>

          <motion.form
            variants={fadeUp}
            onSubmit={submit}
            className="mt-8 flex flex-col gap-5 rounded-3xl bg-surface p-5 shadow-card"
          >
            <div>
              <Label htmlFor="onboard-name">Your name</Label>
              <Input
                id="onboard-name"
                className="mt-1.5"
                autoComplete="given-name"
                maxLength={48}
                placeholder="How should we greet you"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="onboard-tz">Timezone</Label>
              <Select
                id="onboard-tz"
                className="mt-1.5"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.label}
                  </option>
                ))}
              </Select>
              <p className="mt-1.5 text-xs text-subtle">
                Drives the greeting, “today”, and the week strip.
              </p>
            </div>

            <div>
              <Label htmlFor="onboard-budget">Monthly spend limit</Label>
              <Input
                id="onboard-budget"
                className="mt-1.5"
                inputMode="decimal"
                placeholder="Optional — e.g. 40,000"
                value={groupDigits(budget, "INR")}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d.]/g, "");
                  if (raw === "" || /^\d*\.?\d{0,2}$/.test(raw)) setBudget(raw);
                }}
              />
              <p className="mt-1.5 text-xs text-subtle">Leave blank if you don’t want a cap yet.</p>
            </div>

            <Button type="submit" className="mt-1 h-12 w-full rounded-xl" disabled={!ready}>
              Start with an empty ledger
            </Button>
          </motion.form>
        </motion.div>
      </main>
    </div>
  );
}
