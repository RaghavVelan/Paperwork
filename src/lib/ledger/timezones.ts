export const TIMEZONES: { id: string; label: string }[] = [
  { id: "Asia/Kolkata", label: "India (Kolkata)" },
  { id: "Asia/Dubai", label: "Gulf (Dubai)" },
  { id: "Asia/Singapore", label: "Singapore" },
  { id: "Asia/Tokyo", label: "Japan (Tokyo)" },
  { id: "Asia/Kuala_Lumpur", label: "Malaysia" },
  { id: "Europe/London", label: "United Kingdom" },
  { id: "Europe/Paris", label: "Central Europe" },
  { id: "America/New_York", label: "US Eastern" },
  { id: "America/Chicago", label: "US Central" },
  { id: "America/Los_Angeles", label: "US Pacific" },
  { id: "Australia/Sydney", label: "Australia (Sydney)" },
  { id: "UTC", label: "UTC" },
];

export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
  } catch {
    return "Asia/Kolkata";
  }
}

export function timezoneChoices(): { id: string; label: string }[] {
  const detected = detectTimezone();
  const known = TIMEZONES.some((z) => z.id === detected);
  const tagged = TIMEZONES.map((z) =>
    z.id === detected ? { ...z, label: `${z.label} · device` } : z,
  );
  if (known) return tagged;
  return [{ id: detected, label: `${detected} · device` }, ...tagged];
}
