import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CalendarCheck,
  ClipboardList,
  Eye,
  ListTodo,
  MessageSquare,
  MoreVertical,
  Play,
  RotateCcw,
  Send,
  UserPlus,
  X,
  TrendingUp,
  Clock,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCrm, fmtDate, rangeBounds, type RangeOption } from "@/lib/crm-store";
import { SearchableSelect } from "@/components/crm/SearchableSelect";
import { Paginator, usePagination } from "@/components/crm/Paginator";
import {
  EngagementExecuteDialog,
  RescheduleDialog,
  CancelDialog,
} from "@/components/crm/EngagementDialogs";
import {
  OpportunityExecuteDialog,
  OppRescheduleDialog,
  OppCancelDialog,
  ReassignDialog,
} from "@/components/crm/OpportunityDialogs";
import { MentionTextarea } from "@/components/crm/MentionTextarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/todo")({
  head: () => ({ meta: [{ title: "My To Do — Connect & Grow CRM" }] }),
  component: TodoPage,
});

function ReadField({ label, value, multiline }: { label: string; value?: string | null; multiline?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-sm ${multiline ? "whitespace-pre-wrap" : "truncate"}`}>{value || "—"}</div>
    </div>
  );
}

const RANGES: RangeOption[] = [
  "Current Week", "Last Week", "Next Week",
  "Current Month", "Last Month", "Next Month",
  "Current Year", "Last Year",
  "Last 7 Days", "Last 15 Days", "Last 30 Days", "Last 90 Days", "Last 180 Days",
  "Next 7 Days", "Next 15 Days", "Next 30 Days",
  "Today", "Yesterday",
];

/* Animated count-up — eases from 0 → target like an iOS widget ticking up */
function CountUp({ value, delay = 0, duration = 900 }: { value: number; delay?: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const elapsed = t - start - delay;
      if (elapsed < 0) {
        raf.current = requestAnimationFrame(tick);
        return;
      }
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(Math.round(value * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, delay, duration]);

  return <>{display}</>;
}

function getGreeting(name: string) {
  const h = new Date().getHours();
  const part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${part}, ${name.split(" ")[0]}`;
}

function TodoPage() {
  const { currentUserId, users, accounts, engagements, opportunities, contacts } = useCrm();
  const me = users.find((u) => u.id === currentUserId)!;

  const [range, setRange] = useState<RangeOption>("Current Month");
  const [activeTab, setActiveTab] = useState("opportunity");
  const bounds = useMemo(() => rangeBounds(range), [range]);
  const inRange = (iso?: string) => {
    if (!iso) return false;
    const d = new Date(iso);
    return d >= bounds.start && d <= bounds.end;
  };

  const myEng = engagements.filter(
    (e) =>
      e.assignedToUserId === currentUserId &&
      (inRange(e.plannedDate) || inRange(e.assignedDate) || inRange(e.nextActionDate)),
  );
  const myOpp = opportunities.filter(
    (o) =>
      o.assignedToUserId === currentUserId &&
      (inRange(o.assignedDate) || inRange(o.nextActionDate)),
  );
  const otherOpp = opportunities.filter((o) => o.assignedToUserId !== currentUserId);

  const executedEng = myEng.filter((e) => e.status === "Completed").length;
  const pendingEng = myEng.filter((e) => ["Planned", "Rescheduled"].includes(e.status)).length;

  const now = new Date();
  const overdueEng = engagements.filter(
    (e) =>
      e.assignedToUserId === currentUserId &&
      e.status !== "Completed" &&
      e.plannedDate &&
      new Date(e.plannedDate) < now,
  ).length;
  const overdueOpp = opportunities.filter(
    (o) =>
      o.assignedToUserId === currentUserId &&
      !["Completed", "Cancelled", "Converted"].includes(String(o.statusName)) &&
      o.assignedDate &&
      new Date(o.assignedDate) < now,
  ).length;
  const overdueTotal = overdueEng + overdueOpp;

  const completionRate = myEng.length > 0
    ? Math.round((executedEng / myEng.length) * 100)
    : 0;

  const today = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const stats = [
    {
      label: "Total Engagements",
      nums: [myEng.length],
      sep: "",
      sub: `${executedEng} completed`,
      icon: CalendarCheck,
      tile: "bg-blue-500",
      glowBg: "rgba(59,130,246,0.13)",
      progress: null as number | null,
    },
    {
      label: "Pending / Done",
      nums: [pendingEng, executedEng],
      sep: " / ",
      sub: `${completionRate}% completion rate`,
      icon: CheckCircle2,
      tile: "bg-emerald-500",
      glowBg: "rgba(16,185,129,0.13)",
      progress: completionRate as number | null,
    },
    {
      label: "My Opportunities",
      nums: [myOpp.length],
      sep: "",
      sub: "assigned to you",
      icon: ClipboardList,
      tile: "bg-orange-500",
      glowBg: "rgba(249,115,22,0.13)",
      progress: null as number | null,
    },
    {
      label: "Overdue Actions",
      nums: [overdueTotal],
      sep: "",
      sub: overdueTotal === 0 ? "You're all caught up" : "need attention",
      icon: overdueTotal > 0 ? AlertTriangle : CheckCircle2,
      tile: overdueTotal > 0 ? "bg-rose-500" : "bg-teal-500",
      glowBg: overdueTotal > 0 ? "rgba(244,63,94,0.13)" : "rgba(20,184,166,0.13)",
      progress: null as number | null,
      pulse: overdueTotal > 0,
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── Header row: greeting + range filter ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="animate-ios-fade-up text-[26px] font-bold leading-tight tracking-tight text-foreground">
            {getGreeting(me.fullName)}
          </h1>
          <p className="animate-ios-fade-up mt-0.5 text-[13px] text-muted-foreground" style={{ animationDelay: "60ms" }}>
            {today}
          </p>
        </div>
        <div className="animate-ios-fade-up flex items-center gap-2" style={{ animationDelay: "100ms" }}>
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Showing:</Label>
          <div className="w-44">
            <SearchableSelect
              value={range}
              onValueChange={(v) => setRange(v as RangeOption)}
              options={RANGES.map((r) => ({ value: r, label: r }))}
            />
          </div>
        </div>
      </div>

      {/* ── Compact stat chips ── */}
      <div className="flex flex-wrap gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="animate-ios-spring flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-card px-4 py-3 shadow-sm"
              style={{ animationDelay: `${80 + i * 60}ms` }}
            >
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] shadow-sm", s.tile, "pulse" in s && s.pulse && "animate-ios-attention")}>
                <Icon className="h-4 w-4 text-white" strokeWidth={2.25} />
              </div>
              <div>
                <div className="text-[20px] font-bold leading-none tabular-nums text-foreground">
                  {s.nums.map((n, j) => (
                    <span key={j}>
                      {j > 0 && <span className="text-muted-foreground/50">{s.sep}</span>}
                      <CountUp value={n} delay={80 + i * 60} />
                    </span>
                  ))}
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-muted-foreground">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs + tables — full width */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
        <TabsList className="h-9 gap-0.5 rounded-full bg-black/[0.05] p-1">
          <TabsTrigger value="opportunity" className="h-7 rounded-full px-3.5 text-[13px] font-medium text-muted-foreground transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            My Opportunities
            {myOpp.length > 0 && <span className="ml-1.5 rounded-full bg-primary/12 px-1.5 text-[10px] font-semibold text-primary">{myOpp.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="meetings" className="h-7 rounded-full px-3.5 text-[13px] font-medium text-muted-foreground transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            My Engagements
            {myEng.length > 0 && <span className="ml-1.5 rounded-full bg-primary/12 px-1.5 text-[10px] font-semibold text-primary">{myEng.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="others" className="h-7 rounded-full px-3.5 text-[13px] font-medium text-muted-foreground transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            Others' Opportunities
          </TabsTrigger>
        </TabsList>

        <div key={activeTab} className="animate-ios-fade-up">
          <TabsContent value="opportunity"><MyOpportunityTable items={myOpp} /></TabsContent>
          <TabsContent value="meetings"><MyMeetingsTable items={myEng} /></TabsContent>
          <TabsContent value="others"><OtherOpportunitiesTable items={otherOpp} /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

/* ── Table: My Opportunities ── */

function MyOpportunityTable({ items }: { items: ReturnType<typeof useCrm>["opportunities"] }) {
  const { accounts, simple, oppComments, addOppComment, markOppCommentsRead, unreadOppCommentsCount, addHistory, users, currentUserId } = useCrm();
  const me = users.find((u) => u.id === currentUserId)!;
  const [exec, setExec] = useState<string | null>(null);
  const [resched, setResched] = useState<string | null>(null);
  const [cancel, setCancel] = useState<string | null>(null);
  const [reassign, setReassign] = useState<string | null>(null);
  const [notesId, setNotesId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const pg = usePagination(items, 10);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-black/[0.05] bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold text-muted-foreground">Account</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Domain</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Solution Group</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Type</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Description</TableHead>
              <TableHead className="w-52 text-xs font-semibold text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pg.paged.map((o) => {
              const eligible = !["Completed", "Cancelled", "Converted"].includes(String(o.statusName));
              const unread = unreadOppCommentsCount(o.id);
              return (
                <TableRow key={o.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-sm">{accounts.find((a) => a.id === o.accountId)?.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{simple.domain.find((d) => d.id === o.domainId)?.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{simple["solution-group"].find((d) => d.id === o.solutionGroupId)?.name}</TableCell>
                  <TableCell className="text-xs">{simple["new-opportunity-type"].find((t) => t.id === o.opportunityTypeId)?.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground" title={o.description}>{o.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" disabled={!eligible} onClick={() => setExec(o.id)}
                        className="h-7 text-xs gap-1">
                        <Play className="h-3 w-3" /> Execute
                      </Button>
                      <Button size="sm" variant="ghost" className="relative h-7 w-7 p-0"
                        onClick={() => { setNotesId(o.id); markOppCommentsRead(o.id); }}>
                        <MessageSquare className="h-3.5 w-3.5" />
                        {unread > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-white">
                            {unread}
                          </span>
                        )}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem disabled={!eligible} onClick={() => setResched(o.id)}>
                            <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reschedule
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={!eligible} onClick={() => setReassign(o.id)}>
                            <UserPlus className="mr-2 h-3.5 w-3.5" /> Reassign
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={!eligible} onClick={() => setCancel(o.id)}
                            className="text-destructive focus:text-destructive">
                            <X className="mr-2 h-3.5 w-3.5" /> Cancel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Circle className="h-8 w-8 text-border" />
                    <span className="text-sm">No opportunities in this range</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Paginator {...pg} />
      </div>

      <OpportunityExecuteDialog id={exec} onClose={() => setExec(null)} />
      <OppRescheduleDialog id={resched} onClose={() => setResched(null)} />
      <OppCancelDialog id={cancel} onClose={() => setCancel(null)} />
      <ReassignDialog id={reassign} onClose={() => setReassign(null)} />

      <Dialog open={!!notesId} onOpenChange={(o) => { if (!o) { setNotesId(null); setNoteText(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="text-base">Notes & Comments</DialogTitle></DialogHeader>
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border bg-muted/30 p-3">
            {(() => {
              const list = oppComments.filter((c) => c.opportunityId === notesId);
              if (list.length === 0) return <div className="py-8 text-center text-xs text-muted-foreground">No notes yet.</div>;
              return list.map((c) => (
                <div key={c.id} className="rounded-lg bg-card p-2.5 text-xs shadow-sm border border-border/50">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-semibold">{c.userName}</span>
                    <span className="text-muted-foreground">{fmtDate(c.at)}</span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm text-foreground/80">{c.text}</div>
                </div>
              ));
            })()}
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <MentionTextarea value={noteText} onChange={setNoteText} placeholder="Add a note… Type @ to tag someone" />
            </div>
            <Button size="sm" onClick={() => {
              if (!notesId || !noteText.trim()) return;
              addOppComment(notesId, noteText.trim());
              addHistory({ recordType: "Opportunity", refNo: "", action: "Note added", actionBy: me.fullName, actionDate: new Date().toISOString() });
              toast.success("Note posted.");
              setNoteText("");
            }}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setNotesId(null); setNoteText(""); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ── Table: My Engagements ── */

function MyMeetingsTable({ items }: { items: ReturnType<typeof useCrm>["engagements"] }) {
  const { accounts, contacts, users, simple } = useCrm();
  const [exec, setExec] = useState<string | null>(null);
  const [resched, setResched] = useState<string | null>(null);
  const [cancel, setCancel] = useState<string | null>(null);

  const sorted = [...items].sort((a, b) => {
    const ax = Date.parse(a.actualDate || a.plannedDate || a.assignedDate || "");
    const bx = Date.parse(b.actualDate || b.plannedDate || b.assignedDate || "");
    return bx - ax;
  });
  const pg = usePagination(sorted, 10);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-black/[0.05] bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold text-muted-foreground">Account</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Contact</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Call Type</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Planned</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Actual</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Next Action</TableHead>
              <TableHead className="w-44 text-xs font-semibold text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pg.paged.map((e) => {
              const eligible = !["Completed", "Cancelled"].includes(e.status);
              return (
                <TableRow key={e.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-sm">{accounts.find((a) => a.id === e.accountId)?.name}</TableCell>
                  <TableCell className="text-xs">{contacts.find((c) => c.id === e.contactId)?.contactName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{simple["call-type"].find((c) => c.id === e.callTypeId)?.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtDate(e.plannedDate)}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmtDate(e.actualDate) || "—"}</TableCell>
                  <TableCell><StatusBadge status={e.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmtDate(e.nextActionDate) || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" disabled={!eligible} onClick={() => setExec(e.id)} className="h-7 text-xs gap-1">
                        <Play className="h-3 w-3" /> Execute
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem disabled={!eligible} onClick={() => setResched(e.id)}>
                            <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reschedule
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={!eligible} onClick={() => setCancel(e.id)}
                            className="text-destructive focus:text-destructive">
                            <X className="mr-2 h-3.5 w-3.5" /> Cancel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <CalendarCheck className="h-8 w-8 text-border" />
                    <span className="text-sm">No engagements in this range</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Paginator {...pg} />
      </div>

      <EngagementExecuteDialog id={exec} onClose={() => setExec(null)} />
      <RescheduleDialog id={resched} onClose={() => setResched(null)} />
      <CancelDialog id={cancel} onClose={() => setCancel(null)} />
    </>
  );
}

/* ── Table: Others' Opportunities ── */

function OtherOpportunitiesTable({ items }: { items: ReturnType<typeof useCrm>["opportunities"] }) {
  const {
    accounts, simple, users, oppComments, addOppComment, markOppCommentsRead,
    unreadOppCommentsCount, addHistory, currentUserId,
  } = useCrm();
  const me = users.find((u) => u.id === currentUserId)!;
  const [notesId, setNotesId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [viewNoteText, setViewNoteText] = useState("");
  const pg = usePagination(items, 10);
  const viewOpp = items.find((o) => o.id === viewId) || null;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-black/[0.05] bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold text-muted-foreground">Account</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Domain</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Solution Group</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Type</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Description</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Assigned To</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
              <TableHead className="w-32 text-xs font-semibold text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pg.paged.map((o) => {
              const unread = unreadOppCommentsCount(o.id);
              return (
                <TableRow key={o.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-sm">{accounts.find((a) => a.id === o.accountId)?.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{simple.domain.find((d) => d.id === o.domainId)?.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{simple["solution-group"].find((d) => d.id === o.solutionGroupId)?.name}</TableCell>
                  <TableCell className="text-xs">{simple["new-opportunity-type"].find((t) => t.id === o.opportunityTypeId)?.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground" title={o.description}>{o.description}</TableCell>
                  <TableCell className="text-xs">{users.find((u) => u.id === o.assignedToUserId)?.fullName}</TableCell>
                  <TableCell><StatusBadge status={String(o.statusName)} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                        onClick={() => { setViewId(o.id); markOppCommentsRead(o.id); }}>
                        <Eye className="h-3 w-3" /> View
                      </Button>
                      <Button size="sm" variant="ghost" className="relative h-7 w-7 p-0"
                        onClick={() => { setNotesId(o.id); markOppCommentsRead(o.id); }}>
                        <MessageSquare className="h-3.5 w-3.5" />
                        {unread > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-white">
                            {unread}
                          </span>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ListTodo className="h-8 w-8 text-border" />
                    <span className="text-sm">No opportunities assigned to others</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Paginator {...pg} />
      </div>

      {/* View dialog */}
      <Dialog open={!!viewId} onOpenChange={(o) => { if (!o) { setViewId(null); setViewNoteText(""); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="text-base">Opportunity Details</DialogTitle></DialogHeader>
          {viewOpp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <ReadField label="Account Name" value={accounts.find((a) => a.id === viewOpp.accountId)?.name} />
                <ReadField label="Domain" value={simple.domain.find((d) => d.id === viewOpp.domainId)?.name} />
                <ReadField label="Solution Group" value={simple["solution-group"].find((d) => d.id === viewOpp.solutionGroupId)?.name} />
                <ReadField label="Opportunity Type" value={simple["new-opportunity-type"].find((t) => t.id === viewOpp.opportunityTypeId)?.name} />
                <ReadField label="Assigned To" value={users.find((u) => u.id === viewOpp.assignedToUserId)?.fullName} />
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="mt-1"><StatusBadge status={String(viewOpp.statusName)} /></div>
                </div>
                <ReadField label="Created By" value={users.find((u) => u.id === viewOpp.assignedByUserId)?.fullName} />
                <ReadField label="Created On" value={fmtDate(viewOpp.assignedDate)} />
                <div className="col-span-2">
                  <ReadField label="Description" value={viewOpp.description} multiline />
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold">Notes / Message Board</div>
                <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border bg-muted/30 p-3">
                  {(() => {
                    const list = oppComments.filter((c) => c.opportunityId === viewOpp.id);
                    if (list.length === 0) return <div className="py-6 text-center text-xs text-muted-foreground">No comments yet.</div>;
                    return list.map((c) => (
                      <div key={c.id} className="rounded-lg bg-card p-2.5 text-xs shadow-sm border border-border/50">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-semibold">{c.userName}</span>
                          <span className="text-muted-foreground">{fmtDate(c.at)}</span>
                        </div>
                        <div className="whitespace-pre-wrap text-foreground/80">{c.text}</div>
                      </div>
                    ));
                  })()}
                </div>
                <div className="mt-2 flex items-end gap-2">
                  <div className="flex-1">
                    <MentionTextarea value={viewNoteText} onChange={setViewNoteText} placeholder="Add a comment… Type @ to tag" />
                    <div className="mt-0.5 text-[10px] text-muted-foreground">{viewNoteText.length}/5000</div>
                  </div>
                  <Button size="sm" onClick={() => {
                    const text = viewNoteText.trim();
                    if (!text) { toast.error("Comment cannot be empty."); return; }
                    if (text.length > 5000) { toast.error("Comment exceeds 5000 characters."); return; }
                    addOppComment(viewOpp.id, text);
                    addHistory({ recordType: "Opportunity", refNo: viewOpp.refNo, action: "Comment added", actionBy: me.fullName, actionDate: new Date().toISOString() });
                    toast.success("Comment posted.");
                    setViewNoteText("");
                  }}>
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setViewId(null); setViewNoteText(""); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes quick dialog */}
      <Dialog open={!!notesId} onOpenChange={(o) => { if (!o) { setNotesId(null); setNoteText(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="text-base">Notes / Message Board</DialogTitle></DialogHeader>
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border bg-muted/30 p-3">
            {(() => {
              const list = oppComments.filter((c) => c.opportunityId === notesId);
              if (list.length === 0) return <div className="py-8 text-center text-xs text-muted-foreground">No notes yet.</div>;
              return list.map((c) => (
                <div key={c.id} className="rounded-lg bg-card p-2.5 text-xs shadow-sm border border-border/50">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-semibold">{c.userName}</span>
                    <span className="text-muted-foreground">{fmtDate(c.at)}</span>
                  </div>
                  <div className="whitespace-pre-wrap text-foreground/80">{c.text}</div>
                </div>
              ));
            })()}
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <MentionTextarea value={noteText} onChange={setNoteText} placeholder="Type @ to tag a user…" />
            </div>
            <Button size="sm" onClick={() => {
              if (!notesId || !noteText.trim()) return;
              addOppComment(notesId, noteText.trim());
              addHistory({ recordType: "Opportunity", refNo: "", action: "Note added", actionBy: me.fullName, actionDate: new Date().toISOString() });
              toast.success("Note posted.");
              setNoteText("");
            }}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setNotesId(null); setNoteText(""); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
