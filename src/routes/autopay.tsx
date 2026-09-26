import { createFileRoute } from "@tanstack/react-router";
import { AutoPayView } from "@/components/autopay-view";

export const Route = createFileRoute("/autopay")({ component: AutoPayPage });

function AutoPayPage() {
  return <AutoPayView />;
}
