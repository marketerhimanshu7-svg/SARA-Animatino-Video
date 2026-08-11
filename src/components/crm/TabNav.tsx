import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export interface TabItem { to: string; label: string }

export function TabNav({ items }: { items: TabItem[] }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="mb-6 border-b">
      <div className="flex flex-wrap gap-1">
        {items.map((t) => {
          const active = pathname === t.to || pathname.startsWith(t.to + "/");
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "rounded-t-md border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}