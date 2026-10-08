import { PrivacyView } from "@/components/privacy-view";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PrivacySheet({ open, onOpenChange }: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Privacy policy</DrawerTitle>
          <DrawerDescription>How Paperwork treats data on this device.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <PrivacyView compact />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
