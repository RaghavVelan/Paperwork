import { daysInMonth, monthKey, parseISODate } from "@/lib/money";
import type { CategoryId, PaymentMethod } from "./types";

export type AutoPayKind =
  | "upi_mandate"
  | "mutual_fund"
  | "loan"
  | "subscription"
  | "other";

export type AutoPay = {
  id: string;
  name: string;
  kind: AutoPayKind;
  amount: number;
  categoryId: CategoryId;
  payment: PaymentMethod;
  /** 1–31. 31 always clamps to the last civil day of that month. */
  dayOfMonth: number;
  startDate: string;
  /** Inclusive last date. Null = ongoing. */
  endDate: string | null;
  postedMonths: string[];
  createdAt: string;
};

export const AUTO_PAY_KINDS: { id: AutoPayKind; label: string }[] = [
  { id: "upi_mandate", label: "UPI mandate" },
  { id: "mutual_fund", label: "Mutual fund" },
  { id: "loan", label: "Loan" },
  { id: "subscription", label: "Subscription" },
  { id: "other", label: "Other" },
];

export function kindLabel(kind: AutoPayKind): string {
  return AUTO_PAY_KINDS.find((k) => k.id === kind)?.label ?? "Auto pay";
}

export function kindDefaults(kind: AutoPayKind): {
  categoryId: CategoryId;
  payment: PaymentMethod;
} {
  switch (kind) {
    case "upi_mandate":
      return { categoryId: "utilities", payment: "upi" };
    case "mutual_fund":
      return { categoryId: "other-out", payment: "netbanking" };
    case "loan":
      return { categoryId: "other-out", payment: "netbanking" };
    case "subscription":
      return { categoryId: "entertainment", payment: "upi" };
    default:
      return { categoryId: "other-out", payment: "upi" };
  }
}

export function occurrenceInMonth(month: string, dayOfMonth: number): string {
  const start = parseISODate(`${month}-01`);
  const dim = daysInMonth(start);
  const day = Math.min(Math.max(1, dayOfMonth), dim);
  return `${month}-${String(day).padStart(2, "0")}`;
}

export function isOccurrenceActive(ap: AutoPay, iso: string): boolean {
  if (iso < ap.startDate.slice(0, 10)) return false;
  if (ap.endDate && iso > ap.endDate) return false;
  return true;
}

function nextMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if ((m ?? 1) === 12) return `${(y ?? 1970) + 1}-01`;
  return `${y}-${String((m ?? 1) + 1).padStart(2, "0")}`;
}

export function dueDates(ap: AutoPay, todayIso: string, maxMonths = 24): string[] {
  const startMonth = monthKey(ap.startDate);
  const cap = ap.endDate && ap.endDate < todayIso ? ap.endDate : todayIso;
  const endMonth = monthKey(cap);
  const out: string[] = [];
  let cursor = startMonth;
  for (let i = 0; i < maxMonths && cursor <= endMonth; i += 1) {
    if (!ap.postedMonths.includes(cursor)) {
      const iso = occurrenceInMonth(cursor, ap.dayOfMonth);
      if (isOccurrenceActive(ap, iso) && iso <= todayIso) out.push(iso);
    }
    cursor = nextMonth(cursor);
  }
  return out;
}

export type MonthAutoPay = {
  autoPay: AutoPay;
  date: string;
  status: "posted" | "due" | "upcoming";
};

export function monthAutoPays(list: AutoPay[], month: string, todayIso: string): MonthAutoPay[] {
  const rows: MonthAutoPay[] = [];
  for (const ap of list) {
    const date = occurrenceInMonth(month, ap.dayOfMonth);
    if (!isOccurrenceActive(ap, date)) continue;
    const posted = ap.postedMonths.includes(month);
    const status: MonthAutoPay["status"] = posted ? "posted" : date <= todayIso ? "due" : "upcoming";
    rows.push({ autoPay: ap, date, status });
  }
  rows.sort((a, b) => a.date.localeCompare(b.date) || a.autoPay.name.localeCompare(b.autoPay.name));
  return rows;
}

export function isAutoPay(value: unknown): value is AutoPay {
  if (!value || typeof value !== "object") return false;
  const a = value as AutoPay;
  return (
    typeof a.id === "string" &&
    typeof a.name === "string" &&
    typeof a.amount === "number" &&
    typeof a.dayOfMonth === "number" &&
    typeof a.startDate === "string" &&
    Array.isArray(a.postedMonths)
  );
}

export function coerceAutoPay(raw: unknown): AutoPay | null {
  if (!isAutoPay(raw)) return null;
  const kinds: AutoPayKind[] = [
    "upi_mandate",
    "mutual_fund",
    "loan",
    "subscription",
    "other",
  ];
  const kind = kinds.includes(raw.kind as AutoPayKind) ? (raw.kind as AutoPayKind) : "other";
  return {
    id: raw.id,
    name: raw.name.slice(0, 80),
    kind,
    amount: Number.isFinite(raw.amount) ? Math.max(0, raw.amount) : 0,
    categoryId: raw.categoryId,
    payment: raw.payment,
    dayOfMonth: Math.min(31, Math.max(1, Math.round(raw.dayOfMonth))),
    startDate: raw.startDate.slice(0, 10),
    endDate: typeof raw.endDate === "string" && raw.endDate.length >= 10 ? raw.endDate.slice(0, 10) : null,
    postedMonths: raw.postedMonths.filter((m) => typeof m === "string"),
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
  };
}
