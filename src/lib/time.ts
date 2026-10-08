/** Civil date in a named IANA zone. en-CA yields YYYY-MM-DD. */
export function zonedISODate(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return zonedISODate(date, "UTC");
  }
}

export function zonedMonthKey(date: Date, timeZone: string): string {
  return zonedISODate(date, timeZone).slice(0, 7);
}

export function zonedHour(date: Date, timeZone: string): number {
  try {
    const hour = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date);
    return Number.parseInt(hour, 10);
  } catch {
    return date.getHours();
  }
}

/** 0 Sunday … 6 Saturday, matching Date.getDay, in the named zone. */
export function zonedWeekday(date: Date, timeZone: string): number {
  try {
    const wd = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
    const i = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd.slice(0, 3));
    return i >= 0 ? i : date.getUTCDay();
  } catch {
    return date.getUTCDay();
  }
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const next = new Date(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + days);
  const yy = next.getFullYear();
  const mm = String(next.getMonth() + 1).padStart(2, "0");
  const dd = String(next.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
