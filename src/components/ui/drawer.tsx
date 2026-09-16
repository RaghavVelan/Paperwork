import * as React from "react";
import { Drawer as Vaul } from "vaul";
import { cn } from "@/lib/utils";

export const Drawer = Vaul.Root;
export const DrawerTrigger = Vaul.Trigger;
export const DrawerClose = Vaul.Close;
export const DrawerPortal = Vaul.Portal;

export function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof Vaul.Overlay>) {
  return (
    <Vaul.Overlay
      className={cn("fixed inset-0 z-50 bg-bg/70", className)}
      {...props}
    />
  );
}

export function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Vaul.Content>) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <Vaul.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl bg-surface pt-3 shadow-float outline-none",
          className,
        )}
        {...props}
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-border" />
        {children}
      </Vaul.Content>
    </DrawerPortal>
  );
}

export function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid gap-1 px-5 pb-3", className)} {...props} />;
}

export function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof Vaul.Title>) {
  return (
    <Vaul.Title
      className={cn("font-display text-xl font-medium tracking-tight text-fg", className)}
      {...props}
    />
  );
}

export function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof Vaul.Description>) {
  return (
    <Vaul.Description className={cn("text-sm text-muted", className)} {...props} />
  );
}
