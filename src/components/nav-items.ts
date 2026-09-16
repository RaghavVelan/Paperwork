import { BarChart3, CalendarDays, House } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: House, match: (p) => p === "/" },
  {
    href: "/calendar",
    label: "Calendar",
    icon: CalendarDays,
    match: (p) => p.startsWith("/calendar"),
  },
  {
    href: "/insights",
    label: "Insights",
    icon: BarChart3,
    match: (p) => p.startsWith("/insights"),
  },
];
