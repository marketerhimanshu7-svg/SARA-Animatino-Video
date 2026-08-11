import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/crm/PageHeader";
import { BoFormDialog } from "@/components/crm/BoFormDialog";
import { SearchableSelect } from "@/components/crm/SearchableSelect";
import { useCrm, fmtDateOnly, fmtDate, rangeBounds, type RangeOption } from "@/lib/crm-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/bo/dashboard")({
  head: () => ({ meta: [{ title: "BO Dashboard — CRM Solution" }] }),
  component: BoDashboardPage,
});

const RANGE_OPTIONS: RangeOption[] = [
  "Today", "Current Week", "Last Week", "This Month", "Last 3 Months", "Last 6 Months", "Custom",
];

// Stage cards order (left → right)
const STAGE_ORDER = ["Lead", "Proposal", "Pushing Over the Line", "Almost There", "Won"];

const STAGE_COLORS: Record<string, string> = {
  "Lead": "#3b82f6",
  "Proposal": "#8b5cf6",
  "Pushing Over the Line": "#0ea5e9",
  "Almost There": "#f59e0b",
  "Won": "#22c55e",
  "Lost": "#ef4444",
};

function parseValue(v: string | undefined): number {
  if (!v) return 0;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return isNaN(n) ? 0 : n;
}
function fmtINR(n: number): string {
  if (!n) return "₹ 0";
  return `₹ ${n.toLocaleString("en-IN")}`;
}

function BoDashboardPage() {
  const { businessOpenings, accounts, contacts, simple, users } = useCrm();

  const [range, setRange] = useState<RangeOption>("This Month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [sgFilter, setSgFilter] = useState<string>("all");

  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);

  // Filtered set (date + filters, before stage selection)
  const filtered = useMemo(() => {
    const { start, end } = rangeBounds(range, from, to);
    return businessOpenings.filter((b) => {
      const d = new Date(b.boCreationDate);
      if (!isNaN(d.getTime())) {
        if (d < start || d > end) return false;
      }
      if (stageFilter !== "all" && b.boStageId !== stageFilter) return false;
      if (accountFilter !== "all" && b.accountId !== accountFilter) return false;
      if (domainFilter !== "all" && b.domainId !== domainFilter) return false;
      if (sgFilter !== "all" && b.solutionGroupId !== sgFilter) return false;
      return true;
    });
  }, [businessOpenings, range, from, to, stageFilter, accountFilter, domainFilter, sgFilter]);

  // Stage cards (fixed order, restricted to existing stages)
  const stageCards = useMemo(() => {
    const byName = new Map(simple["bo-stage"].map((s) => [s.name, s]));
    const counts: Record<string, number> = {};
    const tcvs: Record<string, number> = {};
    filtered.forEach((b) => {
      counts[b.boStageId] = (counts[b.boStageId] ?? 0) + 1;
      tcvs[b.boStageId] = (tcvs[b.boStageId] ?? 0) + parseValue(b.totalContractValue);
    });
    const list = STAGE_ORDER.map((n) => byName.get(n)).filter(Boolean) as { id: string; name: string }[];
    return list.map((s) => ({ id: s.id, name: s.name, count: counts[s.id] ?? 0, tcv: tcvs[s.id] ?? 0 }));
  }, [filtered, simple]);

  // Stage table records
  const stageRecords = useMemo(() => {
    if (!selectedStageId) return [];
    let recs = filtered.filter((b) => b.boStageId === selectedStageId);
    if (search.trim()) {
      const q = search.toLowerCase();
      recs = recs.filter((b) => {
        const acc = accounts.find((a) => a.id === b.accountId)?.name?.toLowerCase() ?? "";
        const con = contacts.find((c) => c.id === b.contactId)?.contactName?.toLowerCase() ?? "";
        return b.boId.toLowerCase().includes(q) || acc.includes(q) || con.includes(q);
      });
    }
    return recs;
  }, [filtered, selectedStageId, search, accounts, contacts]);

  const totalPages = Math.max(1, Math.ceil(stageRecords.length / PAGE_SIZE));
  const pageRecords = stageRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedStageName = stageCards.find((s) => s.id === selectedStageId)?.name;

  const view = viewing ? businessOpenings.find((b) => b.id === viewing) : null;

  const onSelectStage = (stageId: string) => {
    setSelectedStageId(stageId);
    setPage(1);
    setSearch("");
  };

  return (
    <div>
      <PageHeader
        title="BO Dashboard"
        description="Visual movement of Business Openings across stages."
      />

      {/* Filter bar */}
      <div className="mb-6 rounded-lg border bg-card p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          <div>
            <Label className="text-xs">Date Range</Label>
            <SearchableSelect value={range} onValueChange={(v) => setRange(v as RangeOption)}
              options={RANGE_OPTIONS.map((r) => ({ value: r, label: r }))} />
          </div>
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} disabled={range !== "Custom"} />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} disabled={range !== "Custom"} />
          </div>
          <div>
            <Label className="text-xs">BO Stage</Label>
            <SearchableSelect value={stageFilter} onValueChange={setStageFilter}
              options={[{ value: "all", label: "All Stages" }, ...simple["bo-stage"].map((s) => ({ value: s.id, label: s.name }))]} />
          </div>
          <div>
            <Label className="text-xs">Account</Label>
            <SearchableSelect value={accountFilter} onValueChange={setAccountFilter}
              options={[{ value: "all", label: "All Accounts" }, ...accounts.filter((a) => a.active).map((a) => ({ value: a.id, label: a.name }))]} />
          </div>
          <div>
            <Label className="text-xs">Domain</Label>
            <SearchableSelect value={domainFilter} onValueChange={setDomainFilter}
              options={[{ value: "all", label: "All Domains" }, ...simple.domain.map((s) => ({ value: s.id, label: s.name }))]} />
          </div>
          <div>
            <Label className="text-xs">Solution Group</Label>
            <SearchableSelect value={sgFilter} onValueChange={setSgFilter}
              options={[{ value: "all", label: "All Solution Groups" }, ...simple["solution-group"].map((s) => ({ value: s.id, label: s.name }))]} />
          </div>
        </div>
      </div>

      {/* Stage cards */}
      <div className="mb-6 rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Business Openings by Stage</h2>
            <p className="text-xs text-muted-foreground">Click any stage card to view its records below.</p>
          </div>
          {selectedStageId && (
            <Button size="sm" variant="ghost" onClick={() => setSelectedStageId(null)}>Clear selection</Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {stageCards.map((s) => {
            const isActive = selectedStageId === s.id;
            const color = STAGE_COLORS[s.name] ?? "#64748b";
            const isWon = /won/i.test(s.name);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectStage(s.id)}
                className={cn(
                  "rounded-lg border bg-card p-4 text-left shadow-sm transition-all hover:shadow-md",
                  isActive ? "ring-2 ring-offset-1" : "",
                )}
                style={{ borderTop: `3px solid ${color}`, ...(isActive ? { boxShadow: `0 0 0 2px ${color}` } : {}) }}
              >
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.name}</div>
                <div className="mt-2 text-2xl font-semibold tabular-nums" style={{ color }}>{s.count}</div>
                {isWon && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    TCV: <span className="font-medium text-foreground">{fmtINR(s.tcv)}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage detail table */}
      <div className="rounded-lg border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <h2 className="text-sm font-semibold">
            {selectedStageName ? `BO Details — ${selectedStageName}` : "BO Details — select a stage above"}
          </h2>
          <div className="w-64">
            <Input
              placeholder="Search BO ID / Account / Contact"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              disabled={!selectedStageId}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>BO ID</TableHead>
                <TableHead>Solution Group</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>BO Stage</TableHead>
                <TableHead>Estimated 1 Year CV</TableHead>
                <TableHead>Total Contract Value</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created On</TableHead>
                <TableHead className="w-28">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!selectedStageId ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    Click a stage card above to view its BO records.
                  </TableCell>
                </TableRow>
              ) : pageRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    No BO records found for selected stage.
                  </TableCell>
                </TableRow>
              ) : pageRecords.map((b) => {
                const acc = accounts.find((a) => a.id === b.accountId);
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.boId}</TableCell>
                    <TableCell className="text-xs">{simple["solution-group"].find((x) => x.id === b.solutionGroupId)?.name}</TableCell>
                    <TableCell>{acc?.name}</TableCell>
                    <TableCell className="text-xs">{simple["bo-stage"].find((x) => x.id === b.boStageId)?.name}</TableCell>
                    <TableCell className="text-xs">{b.estimatedFirstYearValue || "-"}</TableCell>
                    <TableCell className="text-xs">{b.totalContractValue || "-"}</TableCell>
                    <TableCell className="text-xs">{users.find((u) => u.id === b.ownerUserId)?.fullName}</TableCell>
                    <TableCell className="text-xs">{fmtDateOnly(b.boCreationDate)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setViewing(b.id)}><Eye className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditingId(b.id); setEditOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {selectedStageId && stageRecords.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t p-3 text-xs">
            <span className="text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, stageRecords.length)} of {stageRecords.length}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      <BoFormDialog
        open={editOpen}
        editingId={editingId}
        onClose={() => { setEditOpen(false); setEditingId(null); }}
      />

      <Dialog open={!!view} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>BO Details — {view?.boId}</DialogTitle></DialogHeader>
          {view && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Account" value={accounts.find((a) => a.id === view.accountId)?.name} />
              <Field label="Contact" value={contacts.find((c) => c.id === view.contactId)?.contactName} />
              <Field label="Source" value={simple["bo-source"].find((x) => x.id === view.boSourceId)?.name} />
              <Field label="Stage" value={simple["bo-stage"].find((x) => x.id === view.boStageId)?.name} />
              <Field label="Type" value={simple["bo-type"].find((x) => x.id === view.boTypeId)?.name} />
              <Field label="Probability" value={view.boProbability} />
              <Field label="Domain" value={simple.domain.find((x) => x.id === view.domainId)?.name} />
              <Field label="Solution Group" value={simple["solution-group"].find((x) => x.id === view.solutionGroupId)?.name} />
              <Field label="SKU" value={view.skuIds.map((id) => simple["sku-name"].find((x) => x.id === id)?.name).filter(Boolean).join(", ")} />
              <Field label="Created" value={fmtDate(view.createdDate)} />
              <Field label="Expected Closure" value={fmtDateOnly(view.expectedClosureDate)} />
              <Field label="Proposal Date" value={fmtDateOnly(view.proposalDate)} />
              <Field label="Closing Date" value={fmtDateOnly(view.boClosingDate)} />
              <Field label="1st Year Value" value={view.estimatedFirstYearValue} />
              <Field label="Total Contract Value" value={view.totalContractValue} />
              <Field label="Owner" value={users.find((u) => u.id === view.ownerUserId)?.fullName} />
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground">BO Details</div>
                <div className="rounded-md bg-muted p-2 text-xs">{view.boDetails || "-"}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground">Remarks</div>
                <div className="rounded-md bg-muted p-2 text-xs">{view.remarks || "-"}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value || "-"}</div>
    </div>
  );
}