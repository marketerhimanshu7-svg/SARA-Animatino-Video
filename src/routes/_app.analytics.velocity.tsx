import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search as SearchIcon, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/crm/PageHeader";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { SearchableSelect } from "@/components/crm/SearchableSelect";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/analytics/velocity")({
  head: () => ({ meta: [{ title: "Average Conversion Velocity" }] }),
  component: VelocityPage,
});

type RangeOption = "Current Week" | "Last Week" | "Last 3 Months" | "Last 6 Months" | "Custom";
const RANGE_OPTIONS: RangeOption[] = ["Current Week", "Last Week", "Last 3 Months", "Last 6 Months", "Custom"];

interface Row {
  boId: string; account: string; contact: string; owner: string;
  domain: string; sg: string; sku: string;
  demoDate: string; wonDate: string; daysTaken: number;
  status: "Won" | "Closed";
}

const SAMPLE: Row[] = [
  { boId: "BO-2505123", account: "Acme Pharma Pvt. Ltd.", contact: "Dr. Ananya Iyer", owner: "Raghav Sharma", domain: "Pharma", sg: "Biologics", sku: "BioAssure ELISA", demoDate: "2025-05-03T10:30:00.000Z", wonDate: "2025-05-20", daysTaken: 17, status: "Won" },
  { boId: "BO-2505189", account: "BioHealth Solutions", contact: "Ms. Priya Nair", owner: "Raghav Sharma", domain: "Biotech", sg: "Molecular Biology", sku: "GeneSeq 3000", demoDate: "2025-05-12T11:15:00.000Z", wonDate: "2025-05-29", daysTaken: 17, status: "Won" },
  { boId: "BO-2505231", account: "Vertex BioPharma", contact: "Dr. Raj Mehta", owner: "Karan Mehta", domain: "Pharma", sg: "Biologics", sku: "BioAssure ELISA", demoDate: "2025-04-22T10:00:00.000Z", wonDate: "2025-05-12", daysTaken: 20, status: "Won" },
  { boId: "BO-2505244", account: "Helios Hospitals", contact: "Ms. Sneha Kulkarni", owner: "Priya Shah", domain: "Healthcare", sg: "CTMS", sku: "Study Management", demoDate: "2025-04-18T13:30:00.000Z", wonDate: "2025-05-08", daysTaken: 20, status: "Won" },
  { boId: "BO-2505271", account: "MedLife Research", contact: "Dr. Vivek Menon", owner: "Neha Verma", domain: "CRO", sg: "Clinical Research", sku: "ClinMark Pro", demoDate: "2025-03-28T11:00:00.000Z", wonDate: "2025-04-15", daysTaken: 18, status: "Won" },
  { boId: "BO-2505288", account: "BioHealth Solutions", contact: "Ms. Priya Nair", owner: "Raghav Sharma", domain: "Biotech", sg: "Molecular Biology", sku: "GeneSeq 3000", demoDate: "2025-03-15T10:30:00.000Z", wonDate: "2025-04-02", daysTaken: 18, status: "Won" },
  { boId: "BO-2505316", account: "Helios Hospitals", contact: "Ms. Sneha Kulkarni", owner: "Priya Shah", domain: "Healthcare", sg: "CTMS", sku: "Study Management", demoDate: "2025-02-22T10:00:00.000Z", wonDate: "2025-03-12", daysTaken: 18, status: "Won" },
  { boId: "BO-2505340", account: "Acme Pharma Pvt. Ltd.", contact: "Dr. Ananya Iyer", owner: "Karan Mehta", domain: "Pharma", sg: "Lab Automation", sku: "AutoPrep Plus", demoDate: "2025-02-05T09:30:00.000Z", wonDate: "2025-03-05", daysTaken: 28, status: "Won" },
  { boId: "BO-2505361", account: "Sitec Labs Pvt. Ltd.", contact: "Mr. Karan Deshpande", owner: "Amit Patel", domain: "Pharma", sg: "Lab Automation", sku: "AutoPrep Plus", demoDate: "2025-01-22T14:00:00.000Z", wonDate: "2025-02-10", daysTaken: 19, status: "Closed" },
  { boId: "BO-2505384", account: "Vertex BioPharma", contact: "Dr. Raj Mehta", owner: "Karan Mehta", domain: "Pharma", sg: "Biologics", sku: "BioAssure ELISA", demoDate: "2025-01-08T15:00:00.000Z", wonDate: "2025-01-30", daysTaken: 22, status: "Won" },
  { boId: "BO-2505402", account: "MedLife Research", contact: "Dr. Vivek Menon", owner: "Neha Verma", domain: "CRO", sg: "Clinical Research", sku: "ClinMark Pro", demoDate: "2024-12-20T11:00:00.000Z", wonDate: "2025-01-12", daysTaken: 23, status: "Won" },
  { boId: "BO-2505420", account: "Helios Hospitals", contact: "Ms. Sneha Kulkarni", owner: "Priya Shah", domain: "Healthcare", sg: "CTMS", sku: "Study Management", demoDate: "2024-12-05T10:00:00.000Z", wonDate: "2024-12-22", daysTaken: 17, status: "Won" },
];

function pad(n: number) { return String(n).padStart(2, "0"); }
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

const ALL_COLUMNS: { key: keyof Row; label: string }[] = [
  { key: "boId", label: "BO ID" },
  { key: "account", label: "Account Name" },
  { key: "contact", label: "Contact Name" },
  { key: "owner", label: "Representative / Owner" },
  { key: "domain", label: "Domain" },
  { key: "sg", label: "Solution Group" },
  { key: "sku", label: "SKU Name" },
  { key: "demoDate", label: "Demonstration Date/Time" },
  { key: "wonDate", label: "Won Date" },
  { key: "daysTaken", label: "Days Taken" },
  { key: "status", label: "Status" },
];
const DEFAULT_VISIBLE = ALL_COLUMNS.map((c) => c.key as string);
const PAGE_SIZES = [10, 20, 30];

function toOpt(arr: string[]) {
  return [{ value: "all", label: "All" }, ...arr.map((x) => ({ value: x, label: x }))];
}

function VelocityPage() {
  const [range, setRange] = useState<RangeOption>("Last 6 Months");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [account, setAccount] = useState("all");
  const [owner, setOwner] = useState("all");
  const [domain, setDomain] = useState("all");
  const [sg, setSg] = useState("all");
  const [sku, setSku] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<string>("wonDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [visible, setVisible] = useState<string[]>(DEFAULT_VISIBLE);

  const accounts = useMemo(() => Array.from(new Set(SAMPLE.map((r) => r.account))), []);
  const owners = useMemo(() => Array.from(new Set(SAMPLE.map((r) => r.owner))), []);
  const domains = useMemo(() => Array.from(new Set(SAMPLE.map((r) => r.domain))), []);
  const sgs = useMemo(() => Array.from(new Set(SAMPLE.map((r) => r.sg))), []);
  const skus = useMemo(() => Array.from(new Set(SAMPLE.map((r) => r.sku))), []);

  const filtered = useMemo(() => SAMPLE.filter((r) => {
    if (!r.demoDate || !r.wonDate) return false;
    if (account !== "all" && r.account !== account) return false;
    if (owner !== "all" && r.owner !== owner) return false;
    if (domain !== "all" && r.domain !== domain) return false;
    if (sg !== "all" && r.sg !== sg) return false;
    if (sku !== "all" && r.sku !== sku) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!Object.values(r).some((v) => String(v).toLowerCase().includes(q))) return false;
    }
    return true;
  }), [account, owner, domain, sg, sku, search]);

  const avgDays = useMemo(() => {
    if (!filtered.length) return 0;
    return filtered.reduce((s, r) => s + r.daysTaken, 0) / filtered.length;
  }, [filtered]);

  const totalBOs = filtered.length;
  const stageBreakdown = useMemo(() => {
    const total = filtered.length || 1;
    const stages = ["Won", "Closed"] as const;
    return stages.map((s) => {
      const c = filtered.filter((r) => r.status === s).length;
      return { stage: s, count: c, pct: (c / total) * 100 };
    });
  }, [filtered]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a[sortKey as keyof Row];
      const bv = b[sortKey as keyof Row];
      if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);
  const visibleCols = ALL_COLUMNS.filter((c) => visible.includes(c.key as string));

  const clear = () => {
    setRange("Last 6 Months"); setFrom(""); setTo("");
    setAccount("all"); setOwner("all"); setDomain("all"); setSg("all"); setSku("all");
    setSearch(""); setPage(1);
  };

  const exportXlsx = () => {
    const sep = "\t";
    const header = visibleCols.map((c) => c.label).join(sep);
    const body = sorted.map((r) => visibleCols.map((c) => {
      const v = r[c.key];
      if (c.key === "demoDate") return fmt(String(v));
      if (c.key === "wonDate") return fmtOnly(String(v));
      return String(v ?? "");
    }).join(sep)).join("\n");
    const xml = `\uFEFF${header}\n${body}`;
    const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "average-conversion-velocity.xls"; a.click();
    URL.revokeObjectURL(url);
  };

  const setSort = (k: string) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
  };

  const renderCell = (r: Row, key: string) => {
    switch (key) {
      case "boId": return <span className="font-mono text-xs">{r.boId}</span>;
      case "demoDate": return <span className="text-xs">{fmt(r.demoDate)}</span>;
      case "wonDate": return <span className="text-xs">{fmtOnly(r.wonDate)}</span>;
      case "daysTaken": return <span className="tabular-nums text-xs">{r.daysTaken}</span>;
      case "status": return <StatusBadge status={r.status} />;
      default: return <span className="text-xs">{String(r[key as keyof Row] ?? "")}</span>;
    }
  };

  const rowTone = (r: Row) => {
    if (r.daysTaken > avgDays) return "bg-amber-50/60 hover:bg-amber-50";
    return "bg-emerald-50/60 hover:bg-emerald-50";
  };

  return (
    <div>
      <PageHeader title="Average Conversion Velocity" description="Average time taken from Demonstration to Won stage." />

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card><CardContent className="p-4">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Total BOs</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{totalBOs}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">In current filter range</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Average Conversion Time</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-primary">{avgDays.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">days</span></div>
          <div className="mt-1 text-[11px] text-muted-foreground">Demonstration → Won</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Conversion % by Stage</div>
          <div className="mt-2 space-y-1.5">
            {stageBreakdown.map((s) => (
              <div key={s.stage} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{s.stage}</span>
                <span className="tabular-nums font-medium">{s.count} · {s.pct.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </div>

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
            <div>
              <Label className="text-xs">From Date</Label>
              <Input type="date" value={from} disabled={range !== "Custom"} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To Date</Label>
              <Input type="date" value={to} disabled={range !== "Custom"} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Account Name</Label>
              <SearchableSelect value={account} onValueChange={setAccount} options={toOpt(accounts)} />
            </div>
            <div>
              <Label className="text-xs">Representative / Owner</Label>
              <SearchableSelect value={owner} onValueChange={setOwner} options={toOpt(owners)} />
            </div>
            <div>
              <Label className="text-xs">Domain</Label>
              <SearchableSelect value={domain} onValueChange={setDomain} options={toOpt(domains)} />
            </div>
            <div>
              <Label className="text-xs">Solution Group</Label>
              <SearchableSelect value={sg} onValueChange={setSg} options={toOpt(sgs)} />
            </div>
            <div>
              <Label className="text-xs">SKU Name</Label>
              <SearchableSelect value={sku} onValueChange={setSku} options={toOpt(skus)} />
            </div>
            <div className="md:col-span-4 flex items-end justify-end gap-2">
              <Button variant="outline" onClick={clear}>Clear</Button>
              <Button onClick={() => setPage(1)}><SearchIcon className="mr-2 h-4 w-4" />Apply</Button>
            </div>
          </CardContent>
        </Card>
      </div>

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

      <div className="rounded-lg border bg-card">
        {sorted.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No BOs found from Demonstration to Won stage for selected filters.</div>
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
                    <TableRow key={r.boId} className={cn(rowTone(r))}>
                      {visibleCols.map((c) => (
                        <TableCell key={c.key as string} className="whitespace-nowrap">{renderCell(r, c.key as string)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
              <div>{sorted.length} record(s) · Avg: {avgDays.toFixed(1)} days · Page {page} of {pageCount}</div>
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