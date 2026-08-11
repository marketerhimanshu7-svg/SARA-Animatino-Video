import { useEffect, useState } from "react";
import { toast } from "sonner";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/crm/SearchableSelect";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { useCrm, nowIso, newId, fmtDate, type Opportunity } from "@/lib/crm-store";

function useEngagement(id: string | null) {
  const { engagements } = useCrm();
  return id ? engagements.find((e) => e.id === id) ?? null : null;
}

export function EngagementExecuteDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const eng = useEngagement(id);
  const { updateEngagement, addHistory, users, currentUserId, accounts, contacts, engagements, simple } = useCrm();
  const me = users.find((u) => u.id === currentUserId)!;

  const [actualDate, setActualDate] = useState("");
  const [callDetails, setCallDetails] = useState("");
  const [oppId, setOppId] = useState<"Yes" | "No" | "">("");
  const [nextActionDate, setNextActionDate] = useState("");
  const [nextActionRemarks, setNextActionRemarks] = useState("");
  const [oppFormOpen, setOppFormOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (eng) {
      setActualDate(eng.actualDate ? eng.actualDate.slice(0, 16) : "");
      setCallDetails(eng.callDetails ?? "");
      setOppId(eng.opportunityIdentified ?? "");
      setNextActionDate(eng.nextActionDate ? eng.nextActionDate.slice(0, 16) : "");
      setNextActionRemarks(eng.nextActionRemarks ?? "");
      setOppFormOpen(false);
    }
  }, [eng?.id]);

  if (!eng) return null;

  // Build the chain of parent engagements (oldest → newest, excluding current)
  const chain: typeof engagements = [];
  {
    let cur = eng.parentEngagementId ? engagements.find((x) => x.id === eng.parentEngagementId) : null;
    while (cur) {
      chain.unshift(cur);
      cur = cur.parentEngagementId ? engagements.find((x) => x.id === cur!.parentEngagementId) : null;
    }
  }
  const hasHistory = chain.length > 0;

  const save = (completeOnly = false) => {
    if (!actualDate) return toast.error("Actual Date is required");
    if (!callDetails.trim()) return toast.error("Call Details required");
    updateEngagement(eng.id, {
      actualDate: new Date(actualDate).toISOString(),
      callDetails, opportunityIdentified: oppId || undefined,
      nextActionDate: nextActionDate ? new Date(nextActionDate).toISOString() : undefined,
      nextActionRemarks, status: "Completed",
    });
    addHistory({
      recordType: "Engagement", refNo: eng.refNo, action: "Executed",
      actionBy: me.fullName, actionDate: nowIso(), remarks: "Engagement executed",
    });
    toast.success("Engagement executed");
    if (completeOnly) onClose();
  };

  const acc = accounts.find((a) => a.id === eng.accountId);
  const con = contacts.find((c) => c.id === eng.contactId);
  const dom = simple.domain.find((d) => d.id === eng.domainId)?.name;
  const sg = simple["solution-group"].find((d) => d.id === eng.solutionGroupId)?.name;
  const skus = eng.skuIds.map((id) => simple["sku-name"].find((s) => s.id === id)?.name).filter(Boolean).join(", ");
  const callType = simple["call-type"].find((c) => c.id === eng.callTypeId)?.name;

  return (
    <>
    <Dialog open={!!id && !oppFormOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span>Execute Engagement — {eng.refNo}</span>
            {hasHistory && (
              <Button size="sm" variant="outline" onClick={() => setHistoryOpen(true)}>
                <History className="mr-1 h-3.5 w-3.5" />History
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md border bg-muted/40 p-3 text-xs">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Engagement Summary</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 md:grid-cols-3">
              <div><span className="text-muted-foreground">Account: </span><span className="font-medium">{acc?.name}</span></div>
              <div><span className="text-muted-foreground">Contact: </span><span className="font-medium">{con?.contactName}</span></div>
              <div><span className="text-muted-foreground">Domain: </span><span className="font-medium">{dom || "—"}</span></div>
              <div><span className="text-muted-foreground">Solution Group: </span><span className="font-medium">{sg || "—"}</span></div>
              <div><span className="text-muted-foreground">SKU Name: </span><span className="font-medium">{skus || "—"}</span></div>
              <div><span className="text-muted-foreground">Call Type: </span><span className="font-medium">{callType || "—"}</span></div>
              <div><span className="text-muted-foreground">Planned Date: </span><span className="font-medium">{fmtDate(eng.plannedDate)}</span></div>
              <div><span className="text-muted-foreground">Joint Presenter: </span><span className="font-medium">{eng.jointPresenter || "—"}</span></div>
              <div><span className="text-muted-foreground">Planned/Unplanned: </span><span className="font-medium">{eng.plannedType}</span></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Actual Date/Time</Label>
              <Input type="datetime-local" value={actualDate} onChange={(e) => setActualDate(e.target.value)} />
            </div>
            <div>
              <Label>Opportunity Identified?</Label>
              <SearchableSelect value={oppId} onValueChange={(v) => setOppId(v as "Yes" | "No")}
                options={[{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }]} placeholder="Select" />
            </div>
          </div>
          <div>
            <Label>Call Details</Label>
            <Textarea disabled={!actualDate} value={callDetails} onChange={(e) => setCallDetails(e.target.value)} rows={3} placeholder="What was discussed?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Next Action Date/Time</Label>
              <Input type="datetime-local" value={nextActionDate} onChange={(e) => setNextActionDate(e.target.value)} />
            </div>
            <div>
              <Label>Next Action Remarks</Label>
              <Input value={nextActionRemarks} onChange={(e) => setNextActionRemarks(e.target.value)} />
            </div>
          </div>

          {oppId === "Yes" && (
            <div className="flex items-center justify-between rounded-md border border-dashed p-3">
              <p className="text-xs text-muted-foreground">Log a new opportunity from this engagement. Multiple opportunities can be logged.</p>
              <Button size="sm" variant="secondary" onClick={() => setOppFormOpen(true)}>Log Opportunity</Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => save(true)}>Save Execution</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader><DialogTitle>Engagement History — {eng.refNo}</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground">Read-only trail of previous engagements that led to this follow-up.</p>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Engagement ID</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Call Type</TableHead>
                <TableHead>Planned</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Call Details</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Executed By</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chain.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.refNo}</TableCell>
                  <TableCell className="text-xs">{accounts.find((a) => a.id === p.accountId)?.name}</TableCell>
                  <TableCell className="text-xs">{contacts.find((c) => c.id === p.contactId)?.contactName}</TableCell>
                  <TableCell className="text-xs">{simple["call-type"].find((c) => c.id === p.callTypeId)?.name}</TableCell>
                  <TableCell className="text-xs">{fmtDate(p.plannedDate)}</TableCell>
                  <TableCell className="text-xs">{p.actualDate ? fmtDate(p.actualDate) : "-"}</TableCell>
                  <TableCell className="text-xs max-w-xs whitespace-pre-wrap">{p.callDetails || "-"}</TableCell>
                  <TableCell className="text-xs">{users.find((u) => u.id === p.ownerUserId)?.fullName}</TableCell>
                  <TableCell className="text-xs">{p.actualDate ? users.find((u) => u.id === p.ownerUserId)?.fullName : "-"}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setHistoryOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <NewOpportunityFromEngagement
      open={oppFormOpen}
      onClose={() => setOppFormOpen(false)}
      engagement={eng}
      defaultNextActionDate={nextActionDate ? new Date(nextActionDate).toISOString() : ""}
      defaultNextActionRemarks={nextActionRemarks}
    />
    </>
  );
}

function NewOpportunityFromEngagement({
  open, onClose, engagement, defaultNextActionDate, defaultNextActionRemarks,
}: {
  open: boolean; onClose: () => void; engagement: ReturnType<typeof useEngagement> extends infer T ? T : never;
  defaultNextActionDate: string; defaultNextActionRemarks: string;
}) {
  const { simple, users, accounts, contacts, addOpportunity, addHistory, currentUserId } = useCrm();
  const me = users.find((u) => u.id === currentUserId)!;
  const activeUsers = users.filter((u) => u.active);
  const eng = engagement!;

  const empty = {
    accountId: eng?.accountId ?? "",
    contactId: eng?.contactId ?? "",
    domainId: eng?.domainId ?? "",
    solutionGroupId: eng?.solutionGroupId ?? "",
    opportunityTypeId: simple["new-opportunity-type"][0]?.id ?? "",
    statusId: simple["new-opportunity-status"][0]?.id ?? "",
    description: "", notes: "", source: "Engagement",
    assignedToUserId: eng?.assignedToUserId ?? currentUserId,
    nextActionDate: defaultNextActionDate ? defaultNextActionDate.slice(0, 16) : "",
    nextActionRemarks: defaultNextActionRemarks ?? "",
  };
  const [f, setF] = useState(empty);
  useEffect(() => { if (open) setF(empty); /* eslint-disable-next-line */ }, [open, eng?.id]);

  if (!eng) return null;

  const save = () => {
    if (!f.description.trim()) return toast.error("Description required");
    const refNo = `OPP-${2100 + Math.floor(Math.random() * 9000)}`;
    const status = simple["new-opportunity-status"].find((s) => s.id === f.statusId);
    const o: Opportunity = {
      id: newId(), refNo,
      accountId: f.accountId, contactId: f.contactId,
      domainId: f.domainId, solutionGroupId: f.solutionGroupId,
      opportunityTypeId: f.opportunityTypeId, description: f.description,
      assignedToUserId: f.assignedToUserId, assignedByUserId: currentUserId, assignedDate: nowIso(),
      statusId: f.statusId, statusName: (status?.name ?? "Planned") as Opportunity["statusName"],
      notes: f.notes, ownerUserId: currentUserId,
      nextActionDate: f.nextActionDate ? new Date(f.nextActionDate).toISOString() : "",
      nextActionRemarks: f.nextActionRemarks, source: f.source,
      engagementRefNo: eng.refNo, engagementId: eng.id, createdFrom: "Engagement",
      rescheduleHistory: [], executionLog: [],
    };
    addOpportunity(o);
    addHistory({
      recordType: "Opportunity", refNo, action: "Created",
      actionBy: me.fullName, actionDate: nowIso(), remarks: `From engagement ${eng.refNo}`,
    });
    toast.success(`Opportunity ${refNo} logged`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Opportunity — from {eng.refNo}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div><Label>Account</Label>
            <SearchableSelect value={f.accountId} onValueChange={(v) => setF({ ...f, accountId: v })}
              options={accounts.filter((a) => a.active).map((a) => ({ value: a.id, label: a.name }))} />
          </div>
          <div><Label>Contact</Label>
            <SearchableSelect value={f.contactId} onValueChange={(v) => setF({ ...f, contactId: v })}
              options={contacts.filter((c) => c.active && c.accountId === f.accountId).map((c) => ({ value: c.id, label: c.contactName }))} />
          </div>
          <div><Label>Opportunity Type</Label>
            <SearchableSelect value={f.opportunityTypeId} onValueChange={(v) => setF({ ...f, opportunityTypeId: v })}
              options={simple["new-opportunity-type"].filter((t) => t.active).map((t) => ({ value: t.id, label: t.name }))} />
          </div>
          <div><Label>Opportunity Status</Label>
            <SearchableSelect value={f.statusId} onValueChange={(v) => setF({ ...f, statusId: v })}
              options={simple["new-opportunity-status"].filter((s) => s.active).map((s) => ({ value: s.id, label: s.name }))} />
          </div>
          <div><Label>Domain</Label>
            <SearchableSelect value={f.domainId} onValueChange={(v) => setF({ ...f, domainId: v })}
              options={simple.domain.filter((d) => d.active).map((d) => ({ value: d.id, label: d.name }))} />
          </div>
          <div><Label>Solution Group</Label>
            <SearchableSelect value={f.solutionGroupId} onValueChange={(v) => setF({ ...f, solutionGroupId: v })}
              options={simple["solution-group"].filter((d) => d.active).map((d) => ({ value: d.id, label: d.name }))} />
          </div>
          <div><Label>Assigned To</Label>
            <SearchableSelect value={f.assignedToUserId} onValueChange={(v) => setF({ ...f, assignedToUserId: v })}
              options={activeUsers.map((u) => ({ value: u.id, label: u.fullName }))} />
          </div>
          <div><Label>Source</Label><Input value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} /></div>
          <div><Label>Next Action Date/Time</Label><Input type="datetime-local" value={f.nextActionDate} onChange={(e) => setF({ ...f, nextActionDate: e.target.value })} /></div>
          <div><Label>Next Action Remarks</Label><Input value={f.nextActionRemarks} onChange={(e) => setF({ ...f, nextActionRemarks: e.target.value })} /></div>
          <div className="col-span-2"><Label>Description</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div className="col-span-2"><Label>Notes / Message Board</Label><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save Opportunity</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RescheduleDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const eng = useEngagement(id);
  const { updateEngagement, addHistory, users, currentUserId } = useCrm();
  const me = users.find((u) => u.id === currentUserId)!;
  const [date, setDate] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => { if (eng) { setDate(eng.plannedDate.slice(0, 16)); setRemarks(""); } }, [eng?.id]);
  if (!eng) return null;

  const submit = () => {
    if (!date) return toast.error("New date/time required");
    if (!remarks.trim()) return toast.error("Reschedule Remarks are mandatory");
    const newDate = new Date(date).toISOString();
    updateEngagement(eng.id, {
      plannedDate: newDate, status: "Rescheduled",
      rescheduleHistory: [...eng.rescheduleHistory, { oldDate: eng.plannedDate, newDate, by: me.fullName, on: nowIso(), remarks }],
    });
    addHistory({
      recordType: "Engagement", refNo: eng.refNo, action: "Rescheduled",
      actionBy: me.fullName, actionDate: nowIso(), remarks,
      oldPlannedDate: eng.plannedDate, newPlannedDate: newDate,
    });
    toast.success("Engagement rescheduled");
    onClose();
  };

  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Reschedule Engagement</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">Current Planned: <span className="text-foreground font-medium">{fmtDate(eng.plannedDate)}</span></div>
          <div>
            <Label>New Planned Date/Time</Label>
            <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Reschedule Remarks <span className="text-destructive">*</span></Label>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CancelDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const eng = useEngagement(id);
  const { updateEngagement, addHistory, users, currentUserId } = useCrm();
  const me = users.find((u) => u.id === currentUserId)!;
  const [remarks, setRemarks] = useState("");
  useEffect(() => { setRemarks(""); }, [id]);
  if (!eng) return null;

  const confirm = () => {
    if (!remarks.trim()) return toast.error("Cancellation Remarks are mandatory");
    updateEngagement(eng.id, { status: "Cancelled", cancellation: { by: me.fullName, on: nowIso(), remarks } });
    addHistory({
      recordType: "Engagement", refNo: eng.refNo, action: "Cancelled",
      actionBy: me.fullName, actionDate: nowIso(), remarks,
    });
    toast.success("Engagement cancelled");
    onClose();
  };

  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Cancel Engagement — {eng.refNo}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm">Are you sure you want to cancel this engagement? This cannot be undone.</p>
          <div>
            <Label>Cancellation Remarks <span className="text-destructive">*</span></Label>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Back</Button>
          <Button variant="destructive" onClick={confirm}>Confirm Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}