import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TabNav } from "@/components/crm/TabNav";

export const Route = createFileRoute("/_app/connect")({
  component: () => (
    <div>
      <TabNav items={[
        { to: "/connect/product-matrix", label: "Product Matrix" },
        { to: "/connect/engagements", label: "Engagement" },
        { to: "/connect/opportunities", label: "Opportunity" },
        { to: "/connect/planning", label: "High Level Engagement Planning" },
      ]} />
      <Outlet />
    </div>
  ),
});
