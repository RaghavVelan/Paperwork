import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { LedgerTransfer } from "@/components/ledger-transfer";
import { CURRENCIES } from "@/lib/ledger/currencies";
import { timezoneChoices } from "@/lib/ledger/timezones";
import type { CurrencyCode, Profile } from "@/lib/ledger/types";
import { useFinanceStore } from "@/lib/finance/store";
import { formatMoney, groupDigits, parseAmountInput } from "@/lib/money";

type Props = {
  onOpenPrivacy?: () => void;
  onNavigate?: () => void;
};

export function ProfileView({ onOpenPrivacy, onNavigate }: Props) {
  const router = useRouter();
  const profile = useFinanceStore((s) => s.profile);
  const updateProfile = useFinanceStore((s) => s.updateProfile);
  const [name, setName] = useState(profile.displayName);
  const [currency, setCurrency] = useState<CurrencyCode>(profile.currency);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [budget, setBudget] = useState(
    profile.monthlyBudget > 0 ? String(profile.monthlyBudget) : "",
  );

  useEffect(() => {
    setName(profile.displayName);
    setCurrency(profile.currency);
    setTimezone(profile.timezone);
    setBudget(profile.monthlyBudget > 0 ? String(profile.monthlyBudget) : "");
  }, [profile]);

  const zones = timezoneChoices();
  const preview = formatMoney(profile.monthlyBudget || 0, currency);

  function save(patch: Partial<Profile>, silent = false) {
    updateProfile(patch);
    if (!silent) toast.success("Saved on this device");
  }

  function saveAll() {
    save({
      displayName: name.trim(),
      currency,
      timezone,
      monthlyBudget: Math.max(0, Math.round(parseAmountInput(budget))),
    });
  }

  function go(href: string) {
    onNavigate?.();
    void router.navigate({ to: href });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <div>
          <Label htmlFor="display-name">Name</Label>
          <Input
            id="display-name"
            className="mt-1.5"
            value={name}
            maxLength={48}
            placeholder="How should we greet you"
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name.trim() !== profile.displayName) save({ displayName: name.trim() }, true);
            }}
          />
        </div>

        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select
            id="currency"
            className="mt-1.5"
            value={currency}
            onChange={(e) => {
              const next = e.target.value as CurrencyCode;
              setCurrency(next);
              save({ currency: next }, true);
            }}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} · {c.label}
              </option>
            ))}
          </Select>
          <p className="mt-1.5 text-xs text-muted">
            Existing amounts stay the same number — only the symbol changes.
          </p>
        </div>

        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <Select
            id="timezone"
            className="mt-1.5"
            value={timezone}
            onChange={(e) => {
              setTimezone(e.target.value);
              save({ timezone: e.target.value }, true);
            }}
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </Select>
          <p className="mt-1.5 text-xs text-muted">
            Drives “today”, the week strip, and the greeting.
          </p>
        </div>

        <div>
          <Label htmlFor="budget">Monthly spend limit</Label>
          <Input
            id="budget"
            className="mt-1.5"
            inputMode="numeric"
            placeholder="0 hides the cap"
            value={groupDigits(budget, currency)}
            onChange={(e) => setBudget(e.target.value.replace(/[^\d]/g, ""))}
            onBlur={() => {
              const n = Math.max(0, Math.round(parseAmountInput(budget)));
              if (n !== profile.monthlyBudget) save({ monthlyBudget: n }, true);
            }}
          />
          <p className="mt-1.5 text-xs text-muted">
            {profile.monthlyBudget > 0 ? `Current cap ${preview}` : "No cap set"}
          </p>
        </div>
      </div>

      <Button className="h-11 w-full rounded-xl" onClick={saveAll}>
        Save profile
      </Button>

      <LedgerTransfer />

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => (onOpenPrivacy ? onOpenPrivacy() : go("/privacy"))}
          className="flex min-h-12 items-center rounded-2xl bg-raised px-4 text-left text-sm text-fg"
        >
          Privacy policy
        </button>
        <button
          type="button"
          onClick={() => go("/about")}
          className="flex min-h-12 items-center rounded-2xl bg-raised px-4 text-left text-sm text-fg"
        >
          About Paperwork
        </button>
      </div>
    </div>
  );
}
