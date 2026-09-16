import { createFileRoute } from "@tanstack/react-router";
import { ProfileView } from "@/components/profile-view";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  return <ProfileView />;
}
