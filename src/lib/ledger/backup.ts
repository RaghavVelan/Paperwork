import { zonedISODate, zonedWeekday } from "@/lib/time";
import type { Profile } from "./types";

export const WEEKDAYS: { id: number; label: string }[] = [
  { id: 1, label: "Monday" },
  { id: 2, label: "Tuesday" },
  { id: 3, label: "Wednesday" },
  { id: 4, label: "Thursday" },
  { id: 5, label: "Friday" },
  { id: 6, label: "Saturday" },
  { id: 0, label: "Sunday" },
];

export function weekdayLabel(id: number): string {
  return WEEKDAYS.find((d) => d.id === id)?.label ?? "Monday";
}

export function isBackupWeekday(id: unknown): id is number {
  return typeof id === "number" && Number.isInteger(id) && id >= 0 && id <= 6;
}

/** True when today is the chosen weekday, they want reminders, and they haven’t backed up this week. */
export function backupReminderDue(profile: Profile, now = new Date()): boolean {
  if (!profile.onboarded || profile.backupReminder === false) return false;
  const tz = profile.timezone || "UTC";
  const todayIso = zonedISODate(now, tz);
  if (zonedWeekday(now, tz) !== (isBackupWeekday(profile.backupWeekday) ? profile.backupWeekday : 1)) {
    return false;
  }
  if (profile.backupSnoozedOn === todayIso) return false;
  const last = profile.lastBackupAt?.slice(0, 10);
  if (last && daysBetween(last, todayIso) < 7) return false;
  return true;
}

function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(`${fromIso}T00:00:00Z`);
  const b = Date.parse(`${toIso}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 99;
  return Math.round((b - a) / 86_400_000);
}
