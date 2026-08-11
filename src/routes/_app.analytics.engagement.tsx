import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search as SearchIcon, Columns3, TrendingUp, TrendingDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/crm/PageHeader";
import { SearchableSelect } from "@/components/crm/SearchableSelect";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/analytics/engagement")({
  head: () => ({ meta: [{ title: "Planned vs Actual Engagement Report" }] }),
  component: EngagementReportPage,
});

type RangeOption = "Current Week" | "Last Week" | "Last 3 Months" | "Last 6 Months" | "Custom";
const RANGE_OPTIONS: RangeOption[] = ["Current Week", "Last Week", "Last 3 Months", "Last 6 Months", "Custom"];

interface Row {
  id: string; account: string; contact: string; callType: string;
  plannedDate: string; actualDate: string;
  domain: string; sg: string; sku: string;
  assignedTo: string; status: "Planned" | "Completed" | "Rescheduled" | "Cancelled";
  callDetails: string; nextActionDate: string; nextActionRemarks: string;
  createdBy: string; createdDate: string;
}

const REPS = ["Raghav Sharma", "Karan Mehta", "Priya Shah", "Neha Verma", "Amit Patel"];
const CALL_TYPES = ["Call", "Meeting", "Demo", "Follow-up Call", "Visit"];
const DOMAINS = ["Pharma", "Biotech", "CRO", "Healthcare", "Clinical Operations"];
const SOLUTIONS = ["Biologics", "Clinical Research", "Molecular Biology", "Lab Automation", "CTMS"];
const SKUS = ["BioAssure ELISA", "ClinMark Pro", "GeneSeq 3000", "AutoPrep Plus", "Study Management"];
const ACCOUNTS = ["Acme Pharma Pvt. Ltd.", "MedLife Research", "BioHealth Solutions", "Sitec Labs Pvt. Ltd.", "Vertex BioPharma", "Helios Hospitals"];
const CONTACTS = ["Dr. Ananya Iyer", "Dr. Vivek Menon", "Ms. Priya Nair", "Mr. Karan Deshpande", "Dr. Raj Mehta", "Ms. Sneha Kulkarni"];
const STATUSES: Row["status"][] = ["Planned", "Completed", "Rescheduled", "Cancelled"];

function pad(n: number) { return String(n).padStart(2, "0"); }
function isoDay(daysAgo: number, hour = 10, minute = 30) {
  const d = new Date(Date.UTC(2025, 4, 25));
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}
function fmt(iso: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${pad(d.getUTCDate())}-${pad(d.getUTCMonth() + 1)}-${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}
function fmtOnly(iso: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${pad(d.getUTCDate())}-${pad(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`;
}

function buildSeed(): Row[] {
  const rows: Row[] = [];
  let id = 5001;
  const targets = [
    { rep: "Raghav Sharma", planned: 18, actual: 14 },
    { rep: "Karan Mehta", planned: 15, actual: 11 },
    { rep: "Priya Shah", planned: 12, actual: 9 },
    { rep: "Neha Verma", planned: 10, actual: 7 },
    { rep: "Amit Patel", planned: 8, actual: 5 },
  ];
  targets.forEach((t, ri) => {
    for (let i = 0; i < t.planned; i++) {
      const planned = isoDay(60 - ri * 6 - i, 9 + (i % 8), (i * 7) % 60);
      const completed = i < t.actual;
      const remIdx = i - t.actual;
      let status: Row["status"] = "Completed";
      let actualDate = "";
      if (completed) {
        status = "Completed";
        actualDate = isoDay(60 - ri * 6 - i, 9 + (i % 8), ((i + 5) * 7) % 60);
      } else if (remIdx === 0) status = "Rescheduled";
      else if (remIdx === 1) status = "Cancelled";
      else status = "Planned";
      rows.push({
        id: `ENG-${id++}`,
        account: ACCOUNTS[(ri + i) % ACCOUNTS.length],
        contact: CONTACTS[(ri * 2 + i) % CONTACTS.length],
        callType: CALL_TYPES[(ri + i) % CALL_TYPES.length],
        plannedDate: planned,
        actualDate,
        domain: DOMAINS[(ri + i) % DOMAINS.length],
        sg: SOLUTIONS[(ri + i) % SOLUTIONS.length],
        sku: SKUS[(ri + i) % SKUS.length],
        assignedTo: t.rep,
        status,
        callDetails: status === "Completed" ? "Discovery completed; technical alignment positive." : status === "Cancelled" ? "Client requested cancellation." : status === "Rescheduled" ? "Rescheduled per stakeholder request." : "Awaiting execution.",
        nextActionDate: isoDay(60 - ri * 6 - i - 7),
        nextActionRemarks: status === "Completed" ? "Proposal walk-through planned." : "Follow-up in progress.",
        createdBy: "Aarav Sharma",
        createdDate: isoDay(70 - ri * 6 - i),
      });
    }
  });
  return rows;
}

const SEED = buildSeed();

interface AggRow {
  rep: string;
  planned: number;
  executed: number;
  achievement: number;
  prevAchievement: number;
  trend: number;
}

const ALL_COLUMNS: { key: keyof AggRow; label: string }[] = [
  { key: "rep", label: "Representative Name" },
  { key: "planned", label: "Total Planned Engagements" },
  { key: "executed", label: "Total Executed Engagements" },
  { key: "achievement", label: "Achievement %" },
];
const DEFAULT_VISIBLE = ALL_COLUMNS.map((c) => c.key as string);
const PAGE_SIZES = [10, 20, 30];

function toOpt(arr: string[]) {
  return [{ value: "all", label: "All" }, ...arr.map((x) => ({ value: x, label: x }))];
}

function EngagementReportPage() {
  const [range, setRange] = useState<RangeOption>("Last 6 Months");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedReps, setSelectedReps] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<string>("achievement");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [visible, setVisible] = useState<string[]>(DEFAULT_VISIBLE);

  // Aggregate per rep — current period uses all SEED, previous period simulated via createdDate parity for trend
  const aggregated: AggRow[] = useMemo(() => {
    const map = new Map<string, { planned: number; executed: number; pPlanned: number; pExecuted: number }>();
    SEED.forEach((r) => {
      const cur = map.get(r.assignedTo) ?? { planned: 0, executed: 0, pPlanned: 0, pExecuted: 0 };
      const isPrev = new Date(r.plannedDate).getUTCDate() % 2 === 0;
      if (isPrev) {
        cur.pPlanned += 1;
        if (r.status === "Completed") cur.pExecuted += 1;
      } else {
        cur.planned += 1;
        if (r.status === "Completed") cur.executed += 1;
      }
      map.set(r.assignedTo, cur);
    });
    return Array.from(map.entries()).map(([rep, v]) => {
      const achievement = v.planned ? (v.executed / v.planned) * 100 : 0;
      const prev = v.pPlanned ? (v.pExecuted / v.pPlanned) * 100 : 0;
      return { rep, planned: v.planned, executed: v.executed, achievement, prevAchievement: prev, trend: achievement - prev };
    });
  }, []);

  const filtered = useMemo(() => {
    return aggregated.filter((r) => {
      if (selectedReps.length && !selectedReps.includes(r.rep)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!Object.values(r).some((v) => String(v).toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [aggregated, selectedReps, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a[sortKey as keyof AggRow];
      const bv = b[sortKey as keyof AggRow];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const teamAvg = sorted.length ? sorted.reduce((s, r) => s + r.achievement, 0) / sorted.length : 0;
  const highest = sorted.length ? sorted.reduce((a, b) => (a.achievement >= b.achievement ? a : b)) : null;
  const lowest = sorted.length ? sorted.reduce((a, b) => (a.achievement <= b.achievement ? a : b)) : null;

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);

  const visibleCols = ALL_COLUMNS.filter((c) => visible.includes(c.key as string));

  const clear = () => {
    setRange("Last 6 Months"); setFrom(""); setTo("");
    setSelectedReps([]);
    setSearch(""); setPage(1);
  };

  const exportXlsx = () => {
    const sep = "\t";
    const summary = [
      ["Top Performance Summary"].join(sep),
      ["Highest Performer", highest?.rep ?? "-", `${highest?.achievement.toFixed(1) ?? 0}%`].join(sep),
      ["Lowest Performer", lowest?.rep ?? "-", `${lowest?.achievement.toFixed(1) ?? 0}%`].join(sep),
      ["Team Average", "", `${teamAvg.toFixed(1)}%`].join(sep),
      "",
    ].join("\n");
    const header = visibleCols.map((c) => c.label).join(sep);
    const body = sorted.map((r) => visibleCols.map((c) => {
      const v = r[c.key];
      if (c.key === "achievement") return `${(v as number).toFixed(1)}%`;
      return String(v ?? "");
    }).join(sep)).join("\n");
    const xml = `\uFEFF${summary}${header}\n${body}`;
    const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "planned-vs-actual-engagement.xls"; a.click();
    URL.revokeObjectURL(url);
  };

  const setSort = (k: string) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
  };

  const renderCell = (r: AggRow, key: string) => {
    switch (key) {
      case "achievement": return <span className="text-xs font-medium">{r.achievement.toFixed(1)}%</span>;
      default: return <span className="text-xs">{String(r[key as keyof AggRow] ?? "")}</span>;
    }
  };

  const rowTone = (r: AggRow) => (r.achievement < teamAvg ? "bg-amber-50/50 hover:bg-amber-50" : "");

  const toggleRep = (rep: string) => {
    setSelectedReps((curr) => curr.includes(rep) ? curr.filter((x) => x !== rep) : [...curr, rep]);
    setPage(1);
  };

  const fmtPct = (n: number) => `${n.toFixed(1)}%`;
  const TrendIcon = ({ v }: { v: number }) => v > 0
    ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
    : v < 0 ? <TrendingDown className="h-3.5 w-3.5 text-red-600" /> : null;

  return (
    <div>
      <PageHeader title="Planned vs Actual Engagement Report" description="Rep-level performance overview of planned vs executed engagements." />

      {/* Performance cards */}
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card
          className={cn("cursor-pointer border-l-4 border-emerald-500 transition-shadow hover:shadow-md",
            highest && selectedReps.includes(highest.rep) && "ring-2 ring-emerald-500")}
          onClick={() => highest && toggleRep(highest.rep)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-emerald-700">Highest Performing</div>
              <TrendIcon v={highest?.trend ?? 0} />
            </div>
            <div className="mt-1 text-base font-semibold">{highest?.rep ?? "-"}</div>
            <div className="mt-1 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
              <div>Planned<div className="text-sm font-medium text-foreground">{highest?.planned ?? 0}</div></div>
              <div>Executed<div className="text-sm font-medium text-foreground">{highest?.executed ?? 0}</div></div>
              <div>Achv.<div className="text-sm font-medium text-emerald-700">{fmtPct(highest?.achievement ?? 0)}</div></div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn("cursor-pointer border-l-4 border-red-500 transition-shadow hover:shadow-md",
            lowest && selectedReps.includes(lowest.rep) && "ring-2 ring-red-500")}
          onClick={() => lowest && toggleRep(lowest.rep)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-red-700">Lowest Performing</div>
              <TrendIcon v={lowest?.trend ?? 0} />
            </div>
            <div className="mt-1 text-base font-semibold">{lowest?.rep ?? "-"}</div>
            <div className="mt-1 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
              <div>Planned<div className="text-sm font-medium text-foreground">{lowest?.planned ?? 0}</div></div>
              <div>Executed<div className="text-sm font-medium text-foreground">{lowest?.executed ?? 0}</div></div>
              <div>Achv.<div className="text-sm font-medium text-red-700">{fmtPct(lowest?.achievement ?? 0)}</div></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-primary">Team Average Achievement</div>
              <Users className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="mt-1 text-2xl font-semibold">{fmtPct(teamAvg)}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Across {sorted.length} representative(s)</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters (sticky) */}
      <div className="sticky top-0 z-10 -mx-4 mb-4 bg-background px-4 py-3 sm:-mx-6 sm:px-6">
        <Card>
          <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-4">
            <div>
              <Label className="text-xs">Date Range</Label>
              <Select value={range} onValueChange={(v) => setRange(v as RangeOption)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RANGE_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {range === "Custom" && (
              <>
                <div>
                  <Label className="text-xs">From Date</Label>
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">To Date</Label>
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
              </>
            )}
            <div className={cn(range === "Custom" ? "md:col-span-1" : "md:col-span-3")}>
              <Label className="text-xs">Representative Name</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    <span className="truncate text-xs">
                      {selectedReps.length === 0 ? "All representatives" : selectedReps.length === 1 ? selectedReps[0] : `${selectedReps.length} selected`}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 p-2">
                  <Input
                    placeholder="Search…"
                    className="h-7 mb-2"
                    onChange={(e) => {
                      const q = e.target.value.toLowerCase();
                      document.querySelectorAll<HTMLElement>("[data-rep-opt]").forEach((el) => {
                        el.style.display = el.dataset.repOpt!.toLowerCase().includes(q) ? "" : "none";
                      });
                    }}
                  />
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {REPS.map((r) => (
                      <label key={r} data-rep-opt={r} className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-accent rounded">
                        <Checkbox checked={selectedReps.includes(r)} onCheckedChange={() => toggleRep(r)} />
                        {r}
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="md:col-span-4 flex items-end justify-end gap-2">
              <Button variant="outline" onClick={clear}>Clear</Button>
              <Button onClick={() => setPage(1)}><SearchIcon className="mr-2 h-4 w-4" />Apply</Button>
              <Button variant="outline" onClick={exportXlsx}><Download className="mr-2 h-4 w-4" />Export to Excel</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8 h-8 w-64" placeholder="Search…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm"><Columns3 className="mr-1 h-3.5 w-3.5" />Columns</Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-2">
              <div className="max-h-72 overflow-y-auto space-y-1">
                {ALL_COLUMNS.map((c) => (
                  <label key={c.key as string} className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-accent rounded">
                    <Checkbox
                      checked={visible.includes(c.key as string)}
                      onCheckedChange={(v) => {
                        setVisible((curr) => v ? [...curr, c.key as string] : curr.filter((k) => k !== c.key));
                      }}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button size="sm" variant="outline" onClick={exportXlsx}><Download className="mr-1 h-3.5 w-3.5" />Export to Excel</Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        {sorted.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No engagement records found for selected filters.</div>
        ) : (
          <>
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    {visibleCols.map((c) => (
                      <TableHead key={c.key as string} className="whitespace-nowrap cursor-pointer select-none" onClick={() => setSort(c.key as string)}>
                        {c.label}{sortKey === c.key && (sortDir === "asc" ? " ▲" : " ▼")}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((r) => (
                    <TableRow key={r.rep} className={cn(rowTone(r), "cursor-pointer")} onClick={() => toggleRep(r.rep)}>
                      {visibleCols.map((c) => (
                        <TableCell key={c.key as string} className="whitespace-nowrap">{renderCell(r, c.key as string)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
              <div>{sorted.length} record(s) · Page {page} of {pageCount}</div>
              <div className="flex items-center gap-2">
                <span>Rows per page</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                  <SelectTrigger className="h-7 w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>{PAGE_SIZES.map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                <Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}