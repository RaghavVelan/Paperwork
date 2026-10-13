export const APP_VERSION = "1.6.1";

export const CHANGELOG: {
  version: string;
  date: string;
  items: string[];
}[] = [
  {
    version: "1.6.1",
    date: "13 Oct 2026",
    items: [
      "About and the backup guide open again from Profile.",
    ],
  },
  {
    version: "1.6.0",
    date: "12 Oct 2026",
    items: [
      "Make your own expense and income categories. Auto pays use them too.",
      "Investments is a built-in category, shown in yellow instead of red.",
      "Insights can move to earlier months.",
    ],
  },
  {
    version: "1.5.0",
    date: "8 Oct 2026",
    items: [
      "Tap a category in Insights to see that month’s entries.",
      "The phone back button closes an open sheet before leaving the page.",
    ],
  },
  {
    version: "1.4.0",
    date: "7 Oct 2026",
    items: [
      "Home balance card starts blurred. Tap the eye to show or hide amounts.",
    ],
  },
  {
    version: "1.3.0",
    date: "6 Oct 2026",
    items: [
      "New Paperwork mark — light and dark variants in the app and on the home screen.",
      "Weekly backup reminder. Pick the day in Profile; download when it shows up.",
      "Guide for backing up and restoring from a JSON file.",
    ],
  },
  {
    version: "1.2.0",
    date: "1 Oct 2026",
    items: [
      "Privacy policy — agree on first run, read anytime from Profile.",
      "Profile is a sheet. Drag any sheet down from the top to close it.",
    ],
  },
  {
    version: "1.1.0",
    date: "27 Sep 2026",
    items: [
      "Install as Paperwork on the home screen.",
      "Works offline after the first visit. Later pushes still show up when you’re online.",
    ],
  },
  {
    version: "1.0.0",
    date: "26 Sep 2026",
    items: [
      "Auto pays for UPI mandates, SIPs, and loans, with an optional last date.",
      "Export and import the ledger to move between devices.",
      "About page.",
      "First public release: empty-start onboarding, calendar, insights, theme, and a local ledger.",
    ],
  },
];
