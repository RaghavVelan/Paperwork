import { daysInMonth, monthKey, parseISODate, toISODate } from "@/lib/money";
import type { CategoryId, PaymentMethod, TxType } from "./types";

export type AutoPayKind =
  | "upi_mandate"
  | "mutual_fund"
  | "loan"
  | "subscription"
  | "salary"
  | "other";

export type AutoPayFrequency = "monthly" | "weekly" | "yearly";

export type AutoPay = {
  id: string;
  name: string;
  kind: AutoPayKind;
  /** Missing on older ledgers. Salary posts as income; everything else as an expense. */
  type: TxType;
  amount: number;
  categoryId: CategoryId;
  payment: PaymentMethod;
  /** Missing on older ledgers → monthly. */
  frequency: AutoPayFrequency;
  /** 1–31. 31 always clamps to the last civil day of that month. */
  dayOfMonth: number;
  /** 0 Sunday … 6 Saturday. Used when frequency is weekly. */
  weekday: number;
  /** 1–12. Used when frequency is yearly. */
  monthOfYear: number;
  startDate: string;
  /** Inclusive last date. Null = ongoing. */
  endDate: string | null;
  postedMonths: string[];
  /** ISO dates already posted. Monthly still trusts postedMonths so old ledgers are not posted twice. */
  postedDates: string[];
  createdAt: string;
};

export const AUTO_PAY_KINDS: { id: AutoPayKind; label: string }[] = [
  { id: "upi_mandate", label: "UPI mandate" },
  { id: "mutual_fund", label: "Mutual fund" },
  { id: "loan", label: "Loan" },
  { id: "subscription", label: "Subscription" },
  { id: "salary", label: "Salary" },
  { id: "other", label: "Other" },
];

export function kindLabel(kind: AutoPayKind): string {
  return AUTO_PAY_KINDS.find((k) => k.id === kind)?.label ?? "Auto pay";
}

export function kindDefaults(kind: AutoPayKind): {
  categoryId: CategoryId;
  payment: PaymentMethod;
  type: TxType;
} {
  switch (kind) {
    case "upi_mandate":
      return { categoryId: "utilities", payment: "upi", type: "expense" };
    case "mutual_fund":
      return { categoryId: "investments", payment: "netbanking", type: "expense" };
    case "loan":
      return { categoryId: "other-out", payment: "netbanking", type: "expense" };
    case "subscription":
      return { categoryId: "entertainment", payment: "upi", type: "expense" };
    case "salary":
      return { categoryId: "salary", payment: "netbanking", type: "income" };
    default:
      return { categoryId: "other-out", payment: "upi", type: "expense" };
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
  if (ap.frequency !== "monthly") return extraDueDates(ap, todayIso, maxMonths);
  const startMonth = monthKey(ap.startDate);
  const cap = ap.endDate && ap.endDate < todayIso ? ap.endDate : todayIso;
  const endMonth = monthKey(cap);
  const out: string[] = [];
  let cursor = startMonth;
  for (let i = 0; i < maxMonths && cursor <= endMonth; i += 1) {
    if (!ap.postedMonths.includes(cursor)) {
      const iso = occurrenceInMonth(cursor, ap.dayOfMonth);
      if (isOccurrenceActive(ap, iso) && iso <= todayIso && !ap.postedDates.includes(iso)) {
        out.push(iso);
      }
    }
    cursor = nextMonth(cursor);
  }
  return out;
}

function extraDueDates(ap: AutoPay, todayIso: string, maxMonths: number): string[] {
  const start = ap.startDate.slice(0, 10);
  const cap = ap.endDate && ap.endDate < todayIso ? ap.endDate : todayIso;
  const out: string[] = [];
  if (ap.frequency === "weekly") {
    let cursor = start;
    const limit = maxMonths * 31;
    for (let i = 0; i < limit && cursor <= cap; i += 1) {
      if (parseISODate(cursor).getDay() === ap.weekday && !ap.postedDates.includes(cursor)) {
        out.push(cursor);
      }
      cursor = toISODate(addDays(parseISODate(cursor), 1));
    }
    return out;
  }
  const startYear = Number(start.slice(0, 4));
  const endYear = Number(cap.slice(0, 4));
  for (let year = startYear; year <= endYear && year < startYear + maxMonths; year += 1) {
    const iso = occurrenceInMonth(`${year}-${String(ap.monthOfYear).padStart(2, "0")}`, ap.dayOfMonth);
    if (isOccurrenceActive(ap, iso) && iso <= cap && !ap.postedDates.includes(iso)) out.push(iso);
  }
  return out;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function occurrencesInMonth(ap: AutoPay, month: string): string[] {
  if (ap.frequency === "yearly") {
    const iso = occurrenceInMonth(`${month.slice(0, 4)}-${String(ap.monthOfYear).padStart(2, "0")}`, ap.dayOfMonth);
    return iso.slice(0, 7) === month ? [iso] : [];
  }
  if (ap.frequency === "weekly") {
    const start = parseISODate(`${month}-01`);
    const count = daysInMonth(start);
    const dates: string[] = [];
    for (let day = 1; day <= count; day += 1) {
      const date = new Date(start.getFullYear(), start.getMonth(), day);
      if (date.getDay() === ap.weekday) dates.push(toISODate(date));
    }
    return dates;
  }
  return [occurrenceInMonth(month, ap.dayOfMonth)];
}

export type MonthAutoPay = {
  autoPay: AutoPay;
  date: string;
  status: "posted" | "due" | "upcoming";
};

export function monthAutoPays(list: AutoPay[], month: string, todayIso: string): MonthAutoPay[] {
  const rows: MonthAutoPay[] = [];
  for (const ap of list) {
    for (const date of occurrencesInMonth(ap, month)) {
      if (!isOccurrenceActive(ap, date)) continue;
      const posted =
        ap.frequency === "monthly"
          ? ap.postedMonths.includes(month) || ap.postedDates.includes(date)
          : ap.postedDates.includes(date);
      const status: MonthAutoPay["status"] = posted ? "posted" : date <= todayIso ? "due" : "upcoming";
      rows.push({ autoPay: ap, date, status });
    }
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
    "salary",
    "other",
  ];
  const kind = kinds.includes(raw.kind as AutoPayKind) ? (raw.kind as AutoPayKind) : "other";
  const extra = raw as AutoPay;
  const frequency: AutoPayFrequency =
    extra.frequency === "weekly" || extra.frequency === "yearly" ? extra.frequency : "monthly";
  const start = raw.startDate.slice(0, 10);
  const startDate = parseISODate(start);
  const weekday =
    typeof extra.weekday === "number" && extra.weekday >= 0 && extra.weekday <= 6
      ? Math.round(extra.weekday)
      : startDate.getDay();
  const monthOfYear =
    typeof extra.monthOfYear === "number" && extra.monthOfYear >= 1 && extra.monthOfYear <= 12
      ? Math.round(extra.monthOfYear)
      : startDate.getMonth() + 1;
  const postedDates = Array.isArray(extra.postedDates)
    ? extra.postedDates.filter((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d))
    : [];
  return {
    id: raw.id,
    name: raw.name.slice(0, 80),
    kind,
    type: extra.type === "income" || kind === "salary" ? "income" : "expense",
    amount: Number.isFinite(raw.amount) ? Math.max(0, raw.amount) : 0,
    categoryId: typeof raw.categoryId === "string" && raw.categoryId ? raw.categoryId : "other-out",
    payment: raw.payment,
    frequency,
    dayOfMonth: Math.min(31, Math.max(1, Math.round(raw.dayOfMonth))),
    weekday,
    monthOfYear,
    startDate: start,
    endDate: typeof raw.endDate === "string" && raw.endDate.length >= 10 ? raw.endDate.slice(0, 10) : null,
    postedMonths: raw.postedMonths.filter((m) => typeof m === "string"),
    postedDates,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
  };
}
