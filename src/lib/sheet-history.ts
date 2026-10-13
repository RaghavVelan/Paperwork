type SheetEntry = { token: number; close: () => void };

const stack: SheetEntry[] = [];
let seq = 0;
let listening = false;

function onPopState() {
  const top = stack[stack.length - 1];
  if (!top) return;
  if (window.history.state?.paperworkSheet === top.token) return;
  stack.pop();
  top.close();
}

function ensureListener() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("popstate", onPopState);
}

let skipNextBack = false;

/** The next sheet close is leaving for another page, so do not history.back(). */
export function skipNextSheetBack() {
  skipNextBack = true;
}

/** Push a history entry so the phone back button closes this sheet first. */
export function bindSheetHistory(close: () => void): number {
  ensureListener();
  const token = ++seq;
  const prev = window.history.state ?? {};
  window.history.pushState({ ...prev, paperworkSheet: token }, "");
  stack.push({ token, close });
  return token;
}

/** Drop the entry. If it is still the current history state, pop it. */
export function unbindSheetHistory(token: number) {
  const index = stack.findIndex((entry) => entry.token === token);
  const wasTop = index === stack.length - 1;
  if (index >= 0) stack.splice(index, 1);
  if (wasTop && skipNextBack) {
    skipNextBack = false;
    return;
  }
  if (wasTop && window.history.state?.paperworkSheet === token) {
    window.history.back();
  }
}
