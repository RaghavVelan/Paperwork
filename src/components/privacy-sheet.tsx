import { PrivacyView } from "@/components/privacy-view";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  NestedDrawer,
} from "@/components/ui/drawer";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nested?: boolean;
};

export function PrivacySheet({ open, onOpenChange, nested = false }: Props) {
  const Root = nested ? NestedDrawer : Drawer;
  return (
    <Root open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Privacy policy</DrawerTitle>
          <DrawerDescription>How Paperwork treats data on this device.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <PrivacyView compact />
        </DrawerBody>
      </DrawerContent>
    </Root>
  );
}
