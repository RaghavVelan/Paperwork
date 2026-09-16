import { AppLink } from "@/components/app-link";
import { useFinanceStore } from "@/lib/finance/store";
import { cn } from "@/lib/utils";

export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function AvatarMark({
  name,
  size = "md",
  active = false,
}: {
  name: string;
  size?: "sm" | "md";
  active?: boolean;
}) {
  const dim = size === "sm" ? "size-9 text-xs" : "size-11 text-sm";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-raised font-medium text-fg shadow-card",
        dim,
        active && "ring-2 ring-ring/70",
      )}
      aria-hidden
    >
      {initialsFrom(name)}
    </span>
  );
}

export function ProfileAvatar({
  size = "md",
  active = false,
}: {
  size?: "sm" | "md";
  active?: boolean;
}) {
  const name = useFinanceStore((s) => s.profile.displayName);
  return (
    <AppLink href="/profile" active={active} className="inline-flex">
      <span className="sr-only">Profile</span>
      <AvatarMark name={name} size={size} active={active} />
    </AppLink>
  );
}
