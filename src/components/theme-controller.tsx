import { useEffect, useState } from "react";
import { useFinanceStore } from "@/lib/finance/store";
import { applyTheme, resolveTheme } from "@/lib/theme";

export function ThemeController() {
  const theme = useFinanceStore((s) => s.profile.theme);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  return null;
}

export function useResolvedTheme(): "light" | "dark" {
  const theme = useFinanceStore((s) => s.profile.theme);
  const [resolved, setResolved] = useState<"light" | "dark">("dark");

  useEffect(() => {
    setResolved(resolveTheme(theme));
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(resolveTheme("system"));
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  return resolved;
}
