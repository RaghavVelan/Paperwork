import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (!("serviceWorker" in navigator)) return;

    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          updateViaCache: "none",
        });
        await registration.update();
        const onVisible = () => {
          if (document.visibilityState === "visible") void registration.update();
        };
        document.addEventListener("visibilitychange", onVisible);
        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
        return () => {
          document.removeEventListener("visibilitychange", onVisible);
          navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
        };
      } catch {
        return undefined;
      }
    };

    let dispose: (() => void) | undefined;
    const start = () => {
      void register().then((fn) => {
        dispose = fn;
      });
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      dispose?.();
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
