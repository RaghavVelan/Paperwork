import { useFinanceStore } from "@/lib/finance/store";
import { currencyMeta } from "./currencies";
import { formatCompactMoney, formatMoney } from "@/lib/money";
import { zonedHour, zonedISODate, zonedMonthKey } from "@/lib/time";

export function useSettings() {
  const profile = useFinanceStore((s) => s.profile);
  const meta = currencyMeta(profile.currency);
  const now = new Date();
  return {
    profile,
    currency: profile.currency,
    timezone: profile.timezone,
    symbol: meta.symbol,
    format: (n: number, withMinor = false) => formatMoney(n, profile.currency, withMinor),
    formatCompact: (n: number) => formatCompactMoney(n, profile.currency),
    todayIso: zonedISODate(now, profile.timezone),
    monthKey: zonedMonthKey(now, profile.timezone),
    hour: zonedHour(now, profile.timezone),
  };
}
