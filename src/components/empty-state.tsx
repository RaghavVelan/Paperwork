import { Plus } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { transition } from "@/lib/motion";

export function EmptyState({
  title,
  body,
  action,
  onAction,
}: {
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition.page}
      className="rounded-3xl bg-surface px-5 py-12 text-center shadow-card"
    >
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-raised text-muted">
        <Plus className="size-5" strokeWidth={1.75} />
      </span>
      <p className="mt-4 font-display text-lg font-semibold tracking-tight text-fg">{title}</p>
      <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-muted">{body}</p>
      {action && onAction ? (
        <Button className="mt-6 rounded-full px-5" onClick={onAction}>
          {action}
        </Button>
      ) : null}
    </motion.div>
  );
}
