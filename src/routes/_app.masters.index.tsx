import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/masters/")({
  beforeLoad: () => { throw redirect({ to: "/masters/simple/$key", params: { key: "account-industry" } }); },
});