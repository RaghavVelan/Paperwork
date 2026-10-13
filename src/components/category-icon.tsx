import {
  Banknote,
  Briefcase,
  Bus,
  Clapperboard,
  Fuel,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  MoreHorizontal,
  PiggyBank,
  Plane,
  ShoppingBag,
  ShoppingBasket,
  Tag,
  TrendingUp,
  Users,
  Utensils,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  food: Utensils,
  groceries: ShoppingBasket,
  transport: Bus,
  fuel: Fuel,
  rent: Home,
  utilities: Zap,
  shopping: ShoppingBag,
  entertainment: Clapperboard,
  health: HeartPulse,
  education: GraduationCap,
  family: Users,
  travel: Plane,
  investments: PiggyBank,
  "other-out": MoreHorizontal,
  salary: Banknote,
  freelance: Briefcase,
  investment: TrendingUp,
  gift: Gift,
  "other-in": MoreHorizontal,
};

export function CategoryIcon({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const Icon = ICONS[id] ?? Tag;
  return <Icon className={cn("size-4", className)} strokeWidth={1.75} />;
}
