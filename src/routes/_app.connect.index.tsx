import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_app/connect/")({
  beforeLoad: () => { throw redirect({ to: "/connect/product-matrix" }); },
});
