import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TabNav } from "@/components/crm/TabNav";

export const Route = createFileRoute("/_app/account")({
  component: () => (
    <div>
      <TabNav items={[
        { to: "/account/accounts", label: "Accounts" },
        { to: "/account/contacts", label: "Contact" },
      ]} />
      <Outlet />
    </div>
  ),
});