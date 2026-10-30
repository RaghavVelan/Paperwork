export const APP_VERSION = "1.8.0";

export const CHANGELOG: {
  version: string;
  date: string;
  items: string[];
}[] = [
  {
    version: "1.8.0",
    date: "30 Oct 2026",
    items: [
      "An expense can remember a place. Search the map, or use this phone.",
      "Profile chooses Off, Ask each time, or Always use this phone. Older entries stay as they are.",
      "The entry sheet stays on the bottom after the keyboard or the map closes.",
    ],
  },
  {
    version: "1.7.0",
    date: "22 Oct 2026",
    items: [
      "Search notes, categories, and amounts.",
      "Rename or remove a category you created. Removed entries move to Other.",
      "Auto pays can be weekly, yearly, or a salary coming in.",
      "Optional category caps, a year view on Insights, and a CSV download.",
      "Calendar has a year view, same as Insights.",
      "Search field and the expense switch stay inside their frames.",
      "The backup guide explains CSV as well as JSON.",
    ],
  },
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
