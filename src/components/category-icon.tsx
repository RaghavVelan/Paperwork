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
  Plane,
  ShoppingBag,
  ShoppingBasket,
  TrendingUp,
  Users,
  Utensils,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { CategoryId } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

const ICONS: Record<CategoryId, LucideIcon> = {
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
  id: CategoryId;
  className?: string;
}) {
  const Icon = ICONS[id] ?? MoreHorizontal;
  return <Icon className={cn("size-4", className)} strokeWidth={1.75} />;
}
