import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";

export function AppLink({
  href,
  className,
  children,
  active,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  active?: boolean;
}) {
  const router = useRouter();
  return (
    <a
      href={href}
      className={className}
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
