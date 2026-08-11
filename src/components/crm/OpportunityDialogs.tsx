import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCrm, nowIso, fmtDate } from "@/lib/crm-store";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

function useOpp(id: string | null) {
  const { opportunities } = useCrm();
  return id ? opportunities.find((o) => o.id === id) ?? null : null;
}

export function OpportunityExecuteDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const opp = useOpp(id);
  const { updateOpportunity, addHistory, users, currentUserId, simple, accounts, contacts, opportunities } = useCrm();
  const me = users.find((u) => u.id === currentUserId)!;
  const statuses = simple["new-opportunity-status"].filter((s) => s.active);

  const [execDate, setExecDate] = useState("");
  const [execRemarks, setExecRemarks] = useState("");
  const [statusId, setStatusId] = useState("");
  const [nextActionDate, setNextActionDate] = useState("");
  const [nextActionRemarks, setNextActionRemarks] = useState("");

  useEffect(() => {
    if (opp) {
      setExecDate(""); setExecRemarks("");
      setStatusId(opp.statusId);
      setNextActionDate(opp.nextActionDate ? opp.nextActionDate.slice(0, 16) : "");
      setNextActionRemarks(opp.nextActionRemarks);
    }
  }, [opp?.id]);

  if (!opp) return null;

  const save = () => {
    if (!execDate) return toast.error("Execution Date/Time required");
    if (!execRemarks.trim()) return toast.error("Execution Remarks required");
    const status = statuses.find((s) => s.id === statusId);
    updateOpportunity(opp.id, {
      statusId, statusName: status?.name ?? opp.statusName,
      nextActionDate: nextActionDate ? new Date(nextActionDate).toISOString() : "",
      nextActionRemarks,
      executionLog: [...opp.executionLog, { date: new Date(execDate).toISOString(), remarks: execRemarks, status: status?.name ?? "", by: me.fullName }],
    });
    addHistory({
      recordType: "Opportunity", refNo: opp.refNo, action: "Executed",
      actionBy: me.fullName, actionDate: nowIso(), remarks: execRemarks,
    });
    toast.success("Opportunity executed");
    if (status?.name === "Converted to BO") {
      toast.message("Notification sent", { description: `BO Manager notified — ${opp.refNo} converted to BO.` });
      addHistory({ recordType: "Opportunity", refNo: opp.refNo, action: "Converted to BO — BO Manager notified", actionBy: me.fullName, actionDate: nowIso() });
    }
    onClose();
  };

  const acc = accounts.find((a) => a.id === opp.accountId);
  const con = contacts.find((c) => c.id === opp.contactId);
  const dom = simple.domain.find((d) => d.id === opp.domainId)?.name;
  const sg = simple["solution-group"].find((d) => d.id === opp.solutionGroupId)?.name;
  const oType = simple["new-opportunity-type"].find((t) => t.id === opp.opportunityTypeId)?.name;
  const assignedTo = users.find((u) => u.id === opp.assignedToUserId)?.fullName;
  const assignedBy = users.find((u) => u.id === opp.assignedByUserId)?.fullName;
  const linked = opportunities.filter((o) => o.id !== opp.id && o.accountId === opp.accountId);

  return (
    <>
      <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>Execute Opportunity — {opp.refNo}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/40 p-3 text-xs">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Opportunity Summary</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 md:grid-cols-3">
                <SumRow k="Account" v={acc?.name} />
                <SumRow k="Contact" v={con?.contactName} />
                <SumRow k="Opportunity Type" v={oType} />
                <SumRow k="Domain" v={dom} />
                <SumRow k="Solution Group" v={sg} />
                <SumRow k="Current Status" v={String(opp.statusName)} />
                <SumRow k="Assigned To" v={assignedTo} />
                <SumRow k="Assigned By" v={assignedBy} />
                <SumRow k="Assigned Date" v={fmtDate(opp.assignedDate)} />
                <SumRow k="Source" v={opp.source} />
                <SumRow k="Created From" v={`${opp.createdFrom}${opp.engagementRefNo ? ` (${opp.engagementRefNo})` : ""}`} />
                <SumRow k="Next Action" v={fmtDate(opp.nextActionDate)} />
              </div>
              {opp.description && (
                <div className="mt-2 border-t pt-2"><span className="text-muted-foreground">Description: </span><span className="whitespace-pre-wrap">{opp.description}</span></div>
              )}
              {opp.notes && (
                <div className="mt-1"><span className="text-muted-foreground">Notes: </span><span className="whitespace-pre-wrap">{opp.notes}</span></div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Execution Date/Time</Label>
                <Input type="datetime-local" value={execDate} onChange={(e) => setExecDate(e.target.value)} />
              </div>
              <div>
                <Label>Opportunity Status</Label>
                <Select value={statusId} onValueChange={setStatusId}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Execution Remarks</Label>
              <Textarea value={execRemarks} onChange={(e) => setExecRemarks(e.target.value)} rows={2} />
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
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Linked Opportunities — History</div>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ref</TableHead><TableHead>Type</TableHead><TableHead>Description</TableHead>
                      <TableHead>Status</TableHead><TableHead>Assigned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linked.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="py-4 text-center text-xs text-muted-foreground">No previous opportunities linked.</TableCell></TableRow>
                    )}
                    {linked.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-mono text-xs">{l.refNo}</TableCell>
                        <TableCell className="text-xs">{simple["new-opportunity-type"].find((t) => t.id === l.opportunityTypeId)?.name}</TableCell>
                        <TableCell className="max-w-xs truncate text-xs" title={l.description}>{l.description}</TableCell>
                        <TableCell className="text-xs">{String(l.statusName)}</TableCell>
                        <TableCell className="text-xs">{fmtDate(l.assignedDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={save}>Save Execution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SumRow({ k, v }: { k: string; v?: string }) {
  return (
    <div className="flex gap-1.5">
      <span className="text-muted-foreground">{k}:</span>
      <span className="font-medium">{v || "—"}</span>
    </div>
  );
}

export function OppRescheduleDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const opp = useOpp(id);
  const { updateOpportunity, addHistory, users, currentUserId, simple } = useCrm();
  const me = users.find((u) => u.id === currentUserId)!;
  const [date, setDate] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (opp) { setDate(opp.nextActionDate ? opp.nextActionDate.slice(0, 16) : ""); setRemarks(""); }
  }, [opp?.id]);

  if (!opp) return null;

  const submit = () => {
    if (!date) return toast.error("New Next Action Date/Time required");
    if (!remarks.trim()) return toast.error("Reschedule Remarks mandatory");
    const newDate = new Date(date).toISOString();
    const reschedStatus = simple["new-opportunity-status"].find((s) => s.name === "Rescheduled" && s.active);
    updateOpportunity(opp.id, {
      nextActionDate: newDate,
      statusId: reschedStatus?.id ?? opp.statusId,
      statusName: reschedStatus ? "Rescheduled" : opp.statusName,
      rescheduleHistory: [...opp.rescheduleHistory, { oldDate: opp.nextActionDate, newDate, by: me.fullName, on: nowIso(), remarks }],
    });
    addHistory({
      recordType: "Opportunity", refNo: opp.refNo, action: "Rescheduled",
      actionBy: me.fullName, actionDate: nowIso(), remarks,
      oldNextActionDate: opp.nextActionDate, newNextActionDate: newDate,
    });
    toast.success("Opportunity rescheduled");
    onClose();
  };

  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Reschedule Opportunity</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">Current Next Action: <span className="text-foreground font-medium">{fmtDate(opp.nextActionDate)}</span></div>
          <div>
            <Label>New Next Action Date/Time</Label>
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

export function OppCancelDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const opp = useOpp(id);
  const { updateOpportunity, addHistory, users, currentUserId, simple } = useCrm();
  const me = users.find((u) => u.id === currentUserId)!;
  const [remarks, setRemarks] = useState("");
  useEffect(() => { setRemarks(""); }, [id]);
  if (!opp) return null;

  const confirm = () => {
    if (!remarks.trim()) return toast.error("Cancellation Remarks mandatory");
    const cancelStatus = simple["new-opportunity-status"].find((s) => s.name === "Cancelled" && s.active);
    updateOpportunity(opp.id, {
      statusId: cancelStatus?.id ?? opp.statusId, statusName: cancelStatus ? "Cancelled" : opp.statusName,
      cancellation: { by: me.fullName, on: nowIso(), remarks },
    });
    addHistory({
      recordType: "Opportunity", refNo: opp.refNo, action: "Cancelled",
      actionBy: me.fullName, actionDate: nowIso(), remarks,
    });
    toast.success("Opportunity cancelled");
    onClose();
  };

  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Cancel Opportunity — {opp.refNo}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm">Are you sure you want to cancel this opportunity?</p>
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

export function ReassignDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const opp = useOpp(id);
  const { updateOpportunity, addHistory, users, currentUserId } = useCrm();
  const me = users.find((u) => u.id === currentUserId)!;
  const [toUser, setToUser] = useState("");
  useEffect(() => { if (opp) setToUser(opp.assignedToUserId); }, [opp?.id]);
  if (!opp) return null;

  const submit = () => {
    if (!toUser) return toast.error("Select a user");
    const prev = opp.assignedToUserId;
    updateOpportunity(opp.id, { assignedToUserId: toUser, assignedByUserId: currentUserId, assignedDate: nowIso() });
    addHistory({
      recordType: "Opportunity", refNo: opp.refNo, action: "Reassigned",
      fromUserId: prev, toUserId: toUser, actionBy: me.fullName, actionDate: nowIso(),
    });
    toast.success("Opportunity reassigned");
    onClose();
  };

  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Reassign Opportunity — {opp.refNo}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Label>Assign To</Label>
          <Select value={toUser} onValueChange={setToUser}>
            <SelectTrigger><SelectValue placeholder="Select active user" /></SelectTrigger>
            <SelectContent>
              {users.filter((u) => u.active).map((u) => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Reassign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}