import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSheetStore } from "@/lib/finance/sheet";

export const Route = createFileRoute("/profile")({ component: ProfileRedirect });

function ProfileRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    useSheetStore.getState().openProfile();
    void navigate({ to: "/", replace: true });
  }, [navigate]);
  return null;
}
