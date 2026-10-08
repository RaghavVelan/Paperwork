import { createFileRoute } from "@tanstack/react-router";
import { GuideView } from "@/components/guide-view";

export const Route = createFileRoute("/guide")({ component: GuidePage });

function GuidePage() {
  return <GuideView />;
}
