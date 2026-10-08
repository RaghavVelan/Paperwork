import { cn } from "@/lib/utils";

export function BrandMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("relative inline-block shrink-0 overflow-hidden rounded-[22%]", className)}
      style={{ width: size, height: size }}
    >
      <img
        src="/brand/logo-on-dark.png"
        alt=""
        width={size}
        height={size}
        className="size-full [[data-theme=light]_&]:hidden"
      />
      <img
        src="/brand/logo-on-light.png"
        alt=""
        width={size}
        height={size}
        className="hidden size-full [[data-theme=light]_&]:block"
      />
    </span>
  );
}

export function BrandWordmark({
  markSize = 28,
  className,
  titleClassName,
}: {
  markSize?: number;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BrandMark size={markSize} />
      <span
        className={cn(
          "font-display font-semibold tracking-tight text-fg",
          titleClassName ?? "text-xl",
        )}
      >
        Paperwork
      </span>
    </span>
  );
}
