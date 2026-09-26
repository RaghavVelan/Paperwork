import { createFileRoute } from "@tanstack/react-router";
import { AboutView } from "@/components/about-view";

export const Route = createFileRoute("/about")({ component: AboutPage });

function AboutPage() {
  return <AboutView />;
}
