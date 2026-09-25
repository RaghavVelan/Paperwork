/** Shared Motion settings. Keep springs bounce:0 — bounce was the jank source. */
export const easeOut = [0.22, 1, 0.36, 1] as const;

export const transition = {
  page: { duration: 0.28, ease: easeOut },
  overlay: { duration: 0.2, ease: easeOut },
  sheet: { duration: 0.34, ease: easeOut },
  spring: { type: "spring" as const, duration: 0.32, bounce: 0 },
  tap: { duration: 0.12, ease: easeOut },
};

export const tapScale = { scale: 0.96 };
