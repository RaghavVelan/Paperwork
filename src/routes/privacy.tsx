import { createFileRoute } from "@tanstack/react-router";
import { PrivacyView } from "@/components/privacy-view";

export const Route = createFileRoute("/privacy")({ component: PrivacyPage });

function PrivacyPage() {
  return <PrivacyView />;
}
