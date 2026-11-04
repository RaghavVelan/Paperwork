type SheetEntry = {
  token: number;
  close: () => void;
  release?: () => void;
};

const stack: SheetEntry[] = [];
let seq = 0;
let listening = false;
let skipNextBack = false;

function onPopState() {
  const top = stack[stack.length - 1];
  if (!top || top.release) return;
  if (window.history.state?.paperworkSheet === top.token) return;
  stack.pop();
  top.close();
}

function ensureListener() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("popstate", onPopState);
}

/** The next sheet close is leaving for another page, so do not history.back(). */
export function skipNextSheetBack() {
  skipNextBack = true;
}

type CloseWatcherLike = EventTarget & { destroy?: () => void };

function closeWatcher(): { listen: (close: () => void) => () => void } | null {
  const Ctor = (
    globalThis as { CloseWatcher?: new () => CloseWatcherLike }
  ).CloseWatcher;
  if (!Ctor) return null;
  try {
    const watcher = new Ctor();
    return {
      listen(close) {
        watcher.addEventListener("close", close);
        return () => {
          watcher.removeEventListener("close", close);
          watcher.destroy?.();
        };
      },
    };
  } catch {
    return null;
  }
}

/**
 * Back should dismiss the sheet, not navigate.
 * CloseWatcher does that without a history entry, so the phone does not play a
 * page transition. Older browsers fall back to a history entry.
 */
export function bindSheetHistory(close: () => void): number {
  const token = ++seq;
  const watcher = closeWatcher();
  if (watcher) {
    const release = watcher.listen(() => {
      const index = stack.findIndex((entry) => entry.token === token);
      if (index >= 0) stack.splice(index, 1);
      close();
    });
    stack.push({ token, close, release });
    return token;
  }

  ensureListener();
  const prev = window.history.state ?? {};
  window.history.pushState({ ...prev, paperworkSheet: token }, "");
  stack.push({ token, close });
  return token;
}

/** Drop the entry. A swipe-away must not history.back() when CloseWatcher is used. */
export function unbindSheetHistory(token: number) {
  const index = stack.findIndex((entry) => entry.token === token);
  if (index < 0) return;
  const wasTop = index === stack.length - 1;
  const [entry] = stack.splice(index, 1);
  if (wasTop && skipNextBack) {
    skipNextBack = false;
    entry?.release?.();
    return;
  }
  if (entry?.release) {
    entry.release();
    return;
  }
  if (wasTop && window.history.state?.paperworkSheet === token) {
    window.history.back();
  }
}
