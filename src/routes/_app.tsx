import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/crm/Shell";

export const Route = createFileRoute("/_app")({
  component: Shell,
});