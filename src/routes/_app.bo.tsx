import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TabNav } from "@/components/crm/TabNav";

export const Route = createFileRoute("/_app/bo")({
  component: () => (
    <div>
      <TabNav items={[
        { to: "/bo/dashboard", label: "Dashboard" },
        { to: "/bo/listing", label: "BO Management" },
      ]} />
      <Outlet />
    </div>
  ),
});