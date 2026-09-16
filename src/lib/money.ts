import { currencyMeta } from "@/lib/ledger/currencies";
import type { CurrencyCode } from "@/lib/ledger/types";

const ZERO_DECIMAL = new Set<CurrencyCode>(["JPY"]);

function formatter(currency: CurrencyCode, withMinor: boolean) {
  const meta = currencyMeta(currency);
  const zero = ZERO_DECIMAL.has(currency);
  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency,
    maximumFractionDigits: zero ? 0 : withMinor ? 2 : 0,
    minimumFractionDigits: zero ? 0 : withMinor ? 2 : 0,
  });
}

export function formatMoney(
  amount: number,
  currency: CurrencyCode = "INR",
  withMinor = false,
): string {
  if (!Number.isFinite(amount)) return formatter(currency, withMinor).format(0);
  return formatter(currency, withMinor).format(withMinor ? amount : Math.round(amount));
}

/** @deprecated use formatMoney */
export function formatInr(amount: number, withPaise = false): string {
  return formatMoney(amount, "INR", withPaise);
}

export function formatCompactMoney(amount: number, currency: CurrencyCode = "INR"): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "−" : "";
  const meta = currencyMeta(currency);

  if (currency === "INR") {
    const n = Math.round(abs);
    if (abs >= 1_00_00_000) return `${sign}₹${(n / 1_00_00_000).toFixed(1)}Cr`;
    if (abs >= 1_00_000) return `${sign}₹${(n / 1_00_000).toFixed(1)}L`;
    if (abs >= 1_000) {
      return `${sign}${new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(n)}`;
    }
    return `${sign}${formatMoney(n, "INR")}`;
  }

  if (abs >= 1_000_000) return `${sign}${meta.symbol}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${meta.symbol}${(abs / 1_000).toFixed(1)}k`;
  return `${sign}${formatMoney(abs, currency)}`;
}

export function formatInrCompact(amount: number): string {
  return formatCompactMoney(amount, "INR");
}

export function formatSignedMoney(amount: number, currency: CurrencyCode): string {
  if (amount > 0) return `+${formatMoney(amount, currency)}`;
  if (amount < 0) return `−${formatMoney(Math.abs(amount), currency)}`;
  return formatMoney(0, currency);
}

export function groupDigits(raw: string, currency: CurrencyCode = "INR"): string {
  if (!raw) return "";
  const [whole = "", frac] = raw.split(".");
  const digits = whole.replace(/\D/g, "");
  if (!digits) return frac !== undefined ? `0.${frac}` : "";
  const locale = currencyMeta(currency).locale;
  const grouped = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number(digits));
  return frac !== undefined ? `${grouped}.${frac.slice(0, 2)}` : grouped;
}

export function parseAmountInput(raw: string): number {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function monthKey(d: Date | string): string {
  const date = typeof d === "string" ? parseISODate(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function isSameISODate(a: string, b: string): boolean {
  return a === b;
}
