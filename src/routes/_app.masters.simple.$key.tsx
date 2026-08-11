import { createFileRoute } from "@tanstack/react-router";
import { SimpleMasterPage } from "@/components/crm/SimpleMasterPage";
import type { SimpleMasterKey } from "@/lib/crm-store";

export const Route = createFileRoute("/_app/masters/simple/$key")({
  component: () => {
    const { key } = Route.useParams();
    return <SimpleMasterPage masterKey={key as SimpleMasterKey} />;
  },
});