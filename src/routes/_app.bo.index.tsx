import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/bo/")({
  beforeLoad: () => {
    throw redirect({ to: "/bo/dashboard" });
  },
});