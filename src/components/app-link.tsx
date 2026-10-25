import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";

export function AppLink({
  href,
  className,
  children,
  active,
  ariaLabel,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  active?: boolean;
  ariaLabel?: string;
}) {
  const router = useRouter();
  return (
    <a
      href={href}
      className={className}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        void router.navigate({ to: href });
      }}
    >
      {children}
    </a>
  );
}
