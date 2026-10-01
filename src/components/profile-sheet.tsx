import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { PrivacyView } from "@/components/privacy-view";
import { ProfileView } from "@/components/profile-view";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useSheetStore } from "@/lib/finance/sheet";
import { useFinanceStore } from "@/lib/finance/store";

export function ProfileSheet() {
  const open = useSheetStore((s) => s.profileOpen);
  const setOpen = useSheetStore((s) => s.setProfileOpen);
  const name = useFinanceStore((s) => s.profile.displayName);
  const [panel, setPanel] = useState<"settings" | "privacy">("settings");

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setPanel("settings");
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          {panel === "privacy" ? (
            <>
              <button
                type="button"
                onClick={() => setPanel("settings")}
                className="mb-2 inline-flex items-center gap-1 text-sm text-muted"
              >
                <ChevronLeft className="size-4" />
                Profile
              </button>
              <DrawerTitle>Privacy policy</DrawerTitle>
              <DrawerDescription>How Paperwork treats data on this device.</DrawerDescription>
            </>
          ) : (
            <>
              <DrawerTitle>{name.trim() || "Profile"}</DrawerTitle>
              <DrawerDescription>Name, currency, timezone, and a cap.</DrawerDescription>
            </>
          )}
        </DrawerHeader>
        <DrawerBody>
          {panel === "privacy" ? (
            <PrivacyView compact />
          ) : (
            <ProfileView
              onOpenPrivacy={() => setPanel("privacy")}
              onNavigate={() => onOpenChange(false)}
            />
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
