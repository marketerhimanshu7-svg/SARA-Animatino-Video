import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Database,
  Network,
  ListTodo,
  FolderOpen,
  Briefcase,
  BarChart3,
  Search,
  ChevronDown,
  ChevronRight,
  Bell,
  User as UserIcon,
  Building2,
  PanelLeftOpen,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useCrm, SIMPLE_MASTERS } from "@/lib/crm-store";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

const MASTER_CHILDREN = [
  ...SIMPLE_MASTERS.map((m) => ({ to: `/masters/simple/${m.key}`, label: m.label })),
  { to: "/masters/users", label: "User Master" },
  { to: "/masters/profiles", label: "Profile Master" },
  { to: "/masters/profile-matrix", label: "Profile Matrix" },
];

export function Shell() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mastersOpen, setMastersOpen] = useState(pathname.startsWith("/masters"));
  const [analyticsOpen, setAnalyticsOpen] = useState(pathname.startsWith("/analytics"));
  const [accountOpen, setAccountOpen] = useState(pathname.startsWith("/account"));
  const [connectOpen, setConnectOpen] = useState(pathname.startsWith("/connect"));
  const [boOpen, setBoOpen] = useState(pathname.startsWith("/bo"));
  const { users, currentUserId, setCurrentUserId, profiles } = useCrm();
  const me = users.find((u) => u.id === currentUserId)!;
  const profile = profiles.find((p) => p.id === me.profileId);
  const initials = me.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("");

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "relative flex flex-col bg-sidebar text-sidebar-foreground shrink-0 transition-all duration-300 ease-in-out",
          "border-r-2 border-sidebar-border shadow-[3px_0_18px_rgba(0,0,0,0.22)]",
          collapsed ? "w-[60px]" : "w-[252px]",
        )}
      >
        {/* Logo + collapse */}
        <div className={cn(
          "flex h-14 shrink-0 items-center border-b-2 border-sidebar-border",
          collapsed ? "justify-center px-0" : "gap-3 px-3",
        )}>
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand" : "Collapse"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-primary shadow-[0_2px_10px_rgba(59,130,246,0.55)] transition-all duration-200 hover:scale-95 active:scale-90"
          >
            <Zap className="h-4 w-4 text-white" />
          </button>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold tracking-tight text-sidebar-foreground">
                  Connect &amp; Grow
                </div>
                <div className="truncate text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/45">
                  CRM Suite
                </div>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/35 transition-colors hover:bg-sidebar-primary hover:text-sidebar-foreground"
                title="Collapse"
              >
                <PanelLeftOpen className="h-3.5 w-3.5 rotate-180" />
              </button>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">

          <SectionLabel label="Workspace" collapsed={collapsed} first />
          <NavItem to="/todo" label="My To Do" icon={ListTodo} tile="bg-blue-500" pathname={pathname} collapsed={collapsed} />

          <SectionLabel label="CRM" collapsed={collapsed} />
          <NavGroup
            label="Account" icon={Building2} tile="bg-teal-500"
            pathname={pathname} basePath="/account"
            collapsed={collapsed} open={accountOpen} setOpen={setAccountOpen}
            items={[
              { to: "/account/accounts", label: "Accounts" },
              { to: "/account/contacts", label: "Contacts" },
            ]}
          />
          <NavGroup
            label="Connect" icon={Network} tile="bg-orange-500"
            pathname={pathname} basePath="/connect"
            collapsed={collapsed} open={connectOpen} setOpen={setConnectOpen}
            items={[
              { to: "/connect/product-matrix", label: "Product Matrix" },
              { to: "/connect/engagements", label: "Engagement" },
              { to: "/connect/opportunities", label: "Opportunity" },
              { to: "/connect/planning", label: "HL Engagement Planning" },
            ]}
          />
          <NavItem to="/repository" label="Repository" icon={FolderOpen} tile="bg-amber-500" pathname={pathname} collapsed={collapsed} />
          <NavGroup
            label="Business Opening" icon={Briefcase} tile="bg-emerald-500"
            pathname={pathname} basePath="/bo"
            collapsed={collapsed} open={boOpen} setOpen={setBoOpen}
            items={[
              { to: "/bo/dashboard", label: "Dashboard" },
              { to: "/bo/listing", label: "BO Management" },
            ]}
          />

          <SectionLabel label="Data" collapsed={collapsed} />
          <NavGroup
            label="Masters" icon={Database} tile="bg-slate-500"
            pathname={pathname} basePath="/masters"
            collapsed={collapsed} open={mastersOpen} setOpen={setMastersOpen}
            items={MASTER_CHILDREN}
          />
          <NavGroup
            label="Analytics" icon={BarChart3} tile="bg-rose-500"
            pathname={pathname} basePath="/analytics"
            collapsed={collapsed} open={analyticsOpen} setOpen={setAnalyticsOpen}
            items={[
              { to: "/analytics/engagement", label: "Engagement Report" },
              { to: "/analytics/velocity", label: "Conversion Velocity" },
            ]}
          />
        </nav>

        {/* User footer */}
        <div className="shrink-0 border-t-2 border-sidebar-border p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-sidebar-accent",
                collapsed && "justify-center",
              )}>
                <Avatar className="h-7 w-7 shrink-0 ring-2 ring-sidebar-foreground/25">
                  <AvatarFallback className="bg-primary text-white text-[10px] font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-sidebar-foreground">{me.fullName}</div>
                    <div className="truncate text-[10px] text-sidebar-foreground/50">{profile?.name}</div>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-52 mb-1">
              <DropdownMenuLabel className="text-xs">Switch user (demo)</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {users.filter((u) => u.active).map((u) => (
                <DropdownMenuItem key={u.id} onClick={() => setCurrentUserId(u.id)}>
                  <UserIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
                  <span className="text-xs truncate">
                    {u.fullName} <span className="text-muted-foreground">({u.userName})</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-20 flex h-14 shrink-0 items-center gap-4 border-b border-border/60 px-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search accounts, contacts…" className="h-8 pl-8 text-xs bg-background border-border" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-muted">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold leading-none">{me.fullName}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">{profile?.name}</div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs">Switch user (demo)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {users.filter((u) => u.active).map((u) => (
                  <DropdownMenuItem key={u.id} onClick={() => setCurrentUserId(u.id)}>
                    <UserIcon className="mr-2 h-3.5 w-3.5" />
                    <span className="text-xs">{u.fullName}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="glass sticky top-14 z-10 flex h-9 shrink-0 items-center gap-1.5 border-b border-border/60 px-5 text-xs text-muted-foreground">
          <Link to="/todo" className="font-medium hover:text-foreground transition-colors">Home</Link>
          {buildCrumbs(pathname).map((c, i, arr) => (
            <span key={i} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-border" />
              <span className={cn(i === arr.length - 1 ? "font-semibold text-foreground" : "hover:text-foreground cursor-pointer")}>{c}</span>
            </span>
          ))}
        </div>

        <main className="flex-1 overflow-x-hidden p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ── Nav primitives ── */

function SectionLabel({ label, collapsed, first }: { label: string; collapsed: boolean; first?: boolean }) {
  if (collapsed) return null;
  return (
    <div className={cn(
      "flex items-center gap-2 border-b border-sidebar-border/60 px-3 pb-1.5",
      first ? "mt-1 pt-1" : "mt-4 pt-1",
    )}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/45">
        {label}
      </span>
    </div>
  );
}

function NavItem({
  to, label, icon: Icon, tile, pathname, collapsed,
}: {
  to: string; label: string;
  icon: React.ComponentType<{ className?: string }>;
  tile: string; pathname: string; collapsed: boolean;
}) {
  const active = pathname.startsWith(to);
  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      className={cn(
        "relative flex items-center gap-3 border-b border-sidebar-border/40 px-3 py-2.5 text-[14px] font-medium transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-sidebar-primary text-sidebar-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
      )}
    >
      {/* Active left rail */}
      {active && <span className="absolute left-0 top-0 h-full w-[3px] rounded-r-full bg-amber-400" />}
      <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px]", tile, active ? "shadow-md" : "opacity-80")}>
        <Icon className="h-3 w-3 text-white" strokeWidth={2.5} />
      </div>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function NavGroup({
  label, icon: Icon, tile, pathname, basePath, collapsed, open, setOpen, items,
}: {
  label: string; icon: React.ComponentType<{ className?: string }>;
  tile: string; pathname: string; basePath: string;
  collapsed: boolean; open: boolean; setOpen: (o: boolean) => void;
  items: { to: string; label: string }[];
}) {
  const groupActive = pathname.startsWith(basePath);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        title={collapsed ? label : undefined}
        className={cn(
          "relative flex w-full items-center gap-3 border-b border-sidebar-border/40 px-3 py-2.5 text-[14px] font-medium transition-colors",
          collapsed && "justify-center px-0",
          groupActive
            ? "bg-sidebar-primary text-sidebar-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        )}
      >
        {groupActive && <span className="absolute left-0 top-0 h-full w-[3px] rounded-r-full bg-amber-400" />}
        <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px]", tile, groupActive ? "shadow-md" : "opacity-80")}>
          <Icon className="h-3 w-3 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left">{label}</span>
            <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-sidebar-foreground/35 transition-transform duration-200", !open && "-rotate-90")} />
          </>
        )}
      </button>

      {!collapsed && open && (
        <div className="border-b border-sidebar-border/40 bg-sidebar-primary/50">
          {items.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 border-b border-sidebar-border/25 py-2 pl-[3.25rem] pr-3 text-[12px] font-medium transition-colors last:border-b-0",
                  active
                    ? "text-sidebar-foreground"
                    : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80",
                )}
              >
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", active ? "bg-amber-400" : "bg-sidebar-foreground/25")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function buildCrumbs(pathname: string): string[] {
  const seg = pathname.replace(/^\//, "").split("/").filter(Boolean);
  const map: Record<string, string> = {
    masters: "Masters", connect: "Connect", todo: "My To Do",
    repository: "Repository", account: "Account", bo: "Business Opening",
    dashboard: "Dashboard", listing: "BO Management",
    accounts: "Accounts", contacts: "Contacts",
    engagements: "Engagement", opportunities: "Opportunities",
    "product-matrix": "Product Matrix", planning: "HL Engagement Planning",
    analytics: "Analytics", engagement: "Engagement Report",
    velocity: "Conversion Velocity", users: "User Master",
    profiles: "Profile Master", "profile-matrix": "Profile Matrix",
    knowledge: "Knowledge Bank", clients: "Client Repository", simple: "Master",
  };
  return seg.map((s) => map[s] ?? s);
}
