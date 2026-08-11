import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Play, MoreVertical, RotateCcw, X, UserPlus, MessageSquare, Send } from "lucide-react";
import { Paginator, usePagination } from "@/components/crm/Paginator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/crm/PageHeader";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { SearchableSelect } from "@/components/crm/SearchableSelect";
import { ColumnPicker, useVisibleColumns } from "@/components/crm/ColumnPicker";
import { OpportunityExecuteDialog, OppRescheduleDialog, OppCancelDialog, ReassignDialog } from "@/components/crm/OpportunityDialogs";
import { useCrm, newId, nowIso, fmtDate, type Opportunity } from "@/lib/crm-store";

export const Route = createFileRoute("/_app/connect/opportunities")({ component: O });

function O() {
  const { opportunities, accounts, contacts, simple, users, currentUserId, addOpportunity, addHistory, oppComments, addOppComment, markOppCommentsRead, unreadOppCommentsCount } = useCrm();
  const [open, setOpen] = useState(false);
  const [exec, setExec] = useState<string | null>(null);
  const [resch, setResch] = useState<string | null>(null);
  const [cancel, setCancel] = useState<string | null>(null);
  const [reassign, setReassign] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatText, setChatText] = useState("");
  const me = users.find((u) => u.id === currentUserId)!;
  const activeUsers = users.filter((u) => u.active);
  const sorted = [...opportunities].sort((a, b) => Date.parse(b.assignedDate || "") - Date.parse(a.assignedDate || ""));
  const pg = usePagination(sorted, 10);

  const ALL_COLS = [
    { key: "refNo", label: "Ref" },
    { key: "account", label: "Account" },
    { key: "contact", label: "Contact" },
    { key: "type", label: "Type" },
    { key: "source", label: "Source" },
    { key: "status", label: "Status" },
    { key: "assigned", label: "Assigned" },
    { key: "nextAction", label: "Next Action" },
    { key: "from", label: "From" },
  ];
  const { visible, setVisible, isVisible } = useVisibleColumns("opportunities", ALL_COLS.map((c) => c.key));

  const empty = {
    accountId: accounts[0]?.id ?? "", contactId: contacts[0]?.id ?? "",
    domainId: simple.domain[0]?.id ?? "", solutionGroupId: simple["solution-group"][0]?.id ?? "",
    opportunityTypeId: simple["new-opportunity-type"][0]?.id ?? "",
    description: "", assignedToUserId: currentUserId,
    statusId: simple["new-opportunity-status"][0]?.id ?? "", source: "Direct",
    notes: "", nextActionDate: "", nextActionRemarks: "",
  };
  const [f, setF] = useState(empty);

  const create = () => {
    if (!f.description) return toast.error("Description required");
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
      createdFrom: "Direct", rescheduleHistory: [], executionLog: [],
    };
    addOpportunity(o);
    addHistory({ recordType: "Opportunity", refNo, action: "Created", actionBy: me.fullName, actionDate: nowIso(), toUserId: f.assignedToUserId });
    toast.success(`Opportunity ${refNo} created`);
    setOpen(false); setF(empty);
  };

  return (
    <div>
      <PageHeader title="Opportunity" actions={
        <div className="flex items-center gap-2">
          <ColumnPicker columns={ALL_COLS} visible={visible} setVisible={setVisible} />
          <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Create Opportunity</Button>
        </div>
      } />
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            {isVisible("refNo") && <TableHead>Ref</TableHead>}
            {isVisible("account") && <TableHead>Account</TableHead>}
            {isVisible("contact") && <TableHead>Contact</TableHead>}
            {isVisible("type") && <TableHead>Type</TableHead>}
            {isVisible("source") && <TableHead>Source</TableHead>}
            {isVisible("status") && <TableHead>Status</TableHead>}
            {isVisible("assigned") && <TableHead>Assigned</TableHead>}
            {isVisible("nextAction") && <TableHead>Next Action</TableHead>}
            {isVisible("from") && <TableHead>From</TableHead>}
            <TableHead className="w-60">Action</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {pg.paged.map((o) => {
              const eligible = !["Completed", "Cancelled", "Converted"].includes(String(o.statusName));
              const unread = unreadOppCommentsCount(o.id);
              return (
                <TableRow key={o.id}>
                  {isVisible("refNo") && <TableCell className="font-mono text-xs">{o.refNo}</TableCell>}
                  {isVisible("account") && <TableCell>{accounts.find((a) => a.id === o.accountId)?.name}</TableCell>}
                  {isVisible("contact") && <TableCell>{contacts.find((c) => c.id === o.contactId)?.contactName}</TableCell>}
                  {isVisible("type") && <TableCell className="text-xs">{simple["new-opportunity-type"].find((t) => t.id === o.opportunityTypeId)?.name}</TableCell>}
                  {isVisible("source") && <TableCell className="text-xs">{o.source}</TableCell>}
                  {isVisible("status") && <TableCell><StatusBadge status={String(o.statusName)} /></TableCell>}
                  {isVisible("assigned") && <TableCell className="text-xs">{users.find((u) => u.id === o.assignedToUserId)?.fullName}</TableCell>}
                  {isVisible("nextAction") && <TableCell className="text-xs">{fmtDate(o.nextActionDate)}</TableCell>}
                  {isVisible("from") && <TableCell className="text-xs">{o.createdFrom}{o.engagementRefNo ? ` (${o.engagementRefNo})` : ""}</TableCell>}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" disabled={!eligible} onClick={() => setExec(o.id)}><Play className="mr-1 h-3 w-3" />Execute</Button>
                      <Button size="sm" variant="ghost" className="relative" onClick={() => { setChatId(o.id); markOppCommentsRead(o.id); }} title="Notes & Comments">
                        <MessageSquare className="h-4 w-4" />
                        {unread > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold text-destructive-foreground">{unread}</span>
                        )}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button size="sm" variant="ghost"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem disabled={!eligible} onClick={() => setResch(o.id)}><RotateCcw className="mr-2 h-4 w-4" />Reschedule</DropdownMenuItem>
                          <DropdownMenuItem disabled={!eligible} onClick={() => setReassign(o.id)}><UserPlus className="mr-2 h-4 w-4" />Reassign</DropdownMenuItem>
                          <DropdownMenuItem disabled={!eligible} onClick={() => setCancel(o.id)}><X className="mr-2 h-4 w-4" />Cancel</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <Paginator {...pg} />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Opportunity</DialogTitle></DialogHeader>
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
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <OpportunityExecuteDialog id={exec} onClose={() => setExec(null)} />
      <OppRescheduleDialog id={resch} onClose={() => setResch(null)} />
      <OppCancelDialog id={cancel} onClose={() => setCancel(null)} />
      <ReassignDialog id={reassign} onClose={() => setReassign(null)} />

      {/* Collaboration chat popup */}
      <Dialog open={!!chatId} onOpenChange={(o) => { if (!o) { setChatId(null); setChatText(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Collaboration — {opportunities.find((o) => o.id === chatId)?.refNo ?? ""}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border bg-muted/30 p-3">
            {(() => {
              const list = oppComments.filter((c) => c.opportunityId === chatId);
              if (list.length === 0) return <div className="py-6 text-center text-xs text-muted-foreground">No comments yet.</div>;
              return list.map((c) => (
                <div key={c.id} className="rounded-md bg-card p-2 text-xs shadow-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium">{c.userName}</span>
                    <span className="text-muted-foreground">{fmtDate(c.at)}</span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm">{c.text}</div>
                </div>
              ));
            })()}
          </div>
          <div className="flex items-end gap-2">
            <Textarea value={chatText} onChange={(e) => setChatText(e.target.value)} rows={2} placeholder="Add a comment…" />
            <Button
              size="sm"
              onClick={() => {
                if (!chatId || !chatText.trim()) return;
                addOppComment(chatId, chatText.trim());
                setChatText("");
                addHistory({ recordType: "Opportunity", refNo: opportunities.find((o) => o.id === chatId)?.refNo ?? "", action: "Comment added", actionBy: me.fullName, actionDate: nowIso() });
              }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
