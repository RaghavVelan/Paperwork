import { useEffect, useState, type ComponentProps, type ElementType, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { TabBar } from "glisse";
import { NAV_ITEMS } from "@/components/nav-items";
import { cn } from "@/lib/utils";

/** Three passes, stronger toward the bottom. */
const BLUR_LAYERS = [
  { blur: 2, from: "0%", to: "32%" },
  { blur: 6, from: "22%", to: "64%" },
  { blur: 14, from: "48%", to: "100%" },
];

function TabLink({
  href,
  className,
  children,
  ...rest
}: {
  href: string;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentProps<"a">, "href" | "className" | "children">) {
  const router = useRouter();
  return (
    <a
      href={href}
      className={className}
      {...rest}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        void router.navigate({ to: href });
      }}
    >
      {children}
    </a>
  );
}

export function GlassTabBar({ pathname, hidden }: { pathname: string; hidden: boolean }) {
  const value = NAV_ITEMS.find((item) => item.match(pathname))?.href ?? null;
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    setSettling(true);
    const timer = window.setTimeout(() => setSettling(false), 180);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 transition-opacity duration-200 lg:hidden",
        hidden && "opacity-0",
        settling && "pw-tab-settling",
      )}
    >
      <style>{`
        .pw-tab-settling .lg-glass {
          -webkit-backdrop-filter: blur(12px) saturate(1.4);
          backdrop-filter: blur(12px) saturate(1.4);
        }
        .pw-tab-settling .pw-blur-layer {
          -webkit-backdrop-filter: none;
          backdrop-filter: none;
        }
      `}</style>
      <div className="absolute inset-x-0 bottom-0 h-28" aria-hidden>
        {BLUR_LAYERS.map((layer) => (
          <div
            key={layer.blur}
            className="pw-blur-layer absolute inset-0"
            style={{
              backdropFilter: `blur(${layer.blur}px)`,
              WebkitBackdropFilter: `blur(${layer.blur}px)`,
              maskImage: `linear-gradient(to bottom, transparent ${layer.from}, black ${layer.to})`,
              WebkitMaskImage: `linear-gradient(to bottom, transparent ${layer.from}, black ${layer.to})`,
            }}
          />
        ))}
      </div>
      <div
        className={cn(
          "relative flex justify-center px-3 pt-3 pb-[max(0.7rem,env(safe-area-inset-bottom))]",
          hidden ? "pointer-events-none" : "pointer-events-auto",
        )}
      >
        <TabBar
          aria-label="Main"
          link={TabLink as ElementType}
          value={value}
          items={NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return {
              value: item.href,
              href: item.href,
              label: item.label,
              icon: <Icon strokeWidth={1.75} />,
            };
          })}
        />
      </div>
    </div>
  );
}
