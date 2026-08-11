import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { SIMPLE_MASTERS } from "@/lib/crm-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/masters")({
  component: MastersLayout,
});

function MastersLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    ...SIMPLE_MASTERS.map((m) => ({ to: `/masters/simple/${m.key}`, label: m.label })),
    { to: "/masters/users", label: "User Master" },
    { to: "/masters/profiles", label: "Profile Master" },
    { to: "/masters/profile-matrix", label: "Profile Matrix" },
  ];
  return (
    <div className="flex gap-6">
      <aside className="w-60 shrink-0">
        <div className="rounded-lg border bg-card p-2">
          <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Masters</div>
          <nav className="mt-1 space-y-0.5">
            {items.map((i) => {
              const active = pathname === i.to;
              return (
                <Link key={i.to} to={i.to}
                  className={cn("block rounded-md px-3 py-1.5 text-sm",
                    active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted")}>
                  {i.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <div className="min-w-0 flex-1"><Outlet /></div>
    </div>
  );
}