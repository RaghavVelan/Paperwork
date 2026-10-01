import * as React from "react";
import { Drawer as Vaul } from "vaul";
import { cn } from "@/lib/utils";

export function Drawer({
  shouldScaleBackground = false,
  repositionInputs = true,
  ...props
}: React.ComponentProps<typeof Vaul.Root>) {
  return (
    <Vaul.Root
      shouldScaleBackground={shouldScaleBackground}
      repositionInputs={repositionInputs}
      {...props}
    />
  );
}

export function NestedDrawer({
  shouldScaleBackground = false,
  repositionInputs = true,
  ...props
}: React.ComponentProps<typeof Vaul.NestedRoot>) {
  return (
    <Vaul.NestedRoot
      shouldScaleBackground={shouldScaleBackground}
      repositionInputs={repositionInputs}
      {...props}
    />
  );
}

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
          "fixed inset-x-0 bottom-0 z-50 mx-auto flex h-auto max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl bg-surface shadow-float outline-none",
          className,
        )}
        {...props}
      >
        <Vaul.Handle className="mx-auto mt-1 mb-0 flex h-7 w-full items-center justify-center bg-transparent !shadow-none after:block after:h-1 after:w-10 after:rounded-full after:bg-border" />
        {children}
      </Vaul.Content>
    </DrawerPortal>
  );
}

export function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("shrink-0 px-5 pt-3 pb-2", className)} {...props} />;
}

export function DrawerBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8",
        className,
      )}
      {...props}
    />
  );
}

export function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof Vaul.Title>) {
  return (
    <Vaul.Title
      className={cn("font-display text-xl font-semibold tracking-tight text-fg", className)}
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
