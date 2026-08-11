import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_app/repository/")({
  beforeLoad: () => { throw redirect({ to: "/repository/knowledge" }); },
});
