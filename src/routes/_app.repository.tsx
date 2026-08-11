import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TabNav } from "@/components/crm/TabNav";

export const Route = createFileRoute("/_app/repository")({
  component: () => (
    <div>
      <TabNav items={[
        { to: "/repository/knowledge", label: "Knowledge Bank" },
        { to: "/repository/clients", label: "Repository" },
      ]} />
      <Outlet />
    </div>
  ),
});
