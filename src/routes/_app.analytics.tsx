import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TabNav } from "@/components/crm/TabNav";

export const Route = createFileRoute("/_app/analytics")({
  component: () => (
    <div>
      <TabNav items={[
        { to: "/analytics/engagement", label: "Planned vs Actual Engagement Report" },
        { to: "/analytics/velocity", label: "Average Conversion Velocity" },
      ]} />
      <Outlet />
    </div>
  ),
});