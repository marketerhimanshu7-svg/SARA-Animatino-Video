import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Play, MoreVertical, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronsUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/crm/PageHeader";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { SearchableSelect } from "@/components/crm/SearchableSelect";
import { ColumnPicker, useVisibleColumns } from "@/components/crm/ColumnPicker";
import { EngagementExecuteDialog, RescheduleDialog, CancelDialog } from "@/components/crm/EngagementDialogs";
import { useCrm, newId, nowIso, fmtDate, type Engagement } from "@/lib/crm-store";
import { Paginator, usePagination } from "@/components/crm/Paginator";

export const Route = createFileRoute("/_app/connect/engagements")({ component: E });

function E() {
  const { engagements, accounts, contacts, simple, users, currentUserId, addEngagement, addHistory } = useCrm();
  const [open, setOpen] = useState(false);
  const [exec, setExec] = useState<string | null>(null);
  const [resch, setResch] = useState<string | null>(null);
  const [cancel, setCancel] = useState<string | null>(null);
  const activeUsers = users.filter((u) => u.active);
  const me = users.find((u) => u.id === currentUserId)!;
  const sorted = [...engagements].sort((a, b) => {
    const ax = Date.parse(a.actualDate || a.plannedDate || a.assignedDate || "");
    const bx = Date.parse(b.actualDate || b.plannedDate || b.assignedDate || "");
    return bx - ax;
  });
  const pg = usePagination(sorted, 10);
  const ALL_COLS = [
    { key: "refNo", label: "Ref" },
    { key: "account", label: "Account" },
    { key: "contact", label: "Contact" },
    { key: "callType", label: "Call Type" },
    { key: "planned", label: "Planned" },
    { key: "assigned", label: "Assigned To" },
    { key: "status", label: "Status" },
  ];
  const { visible, setVisible, isVisible } = useVisibleColumns("engagements", ALL_COLS.map((c) => c.key));

  const empty = {
    accountId: accounts[0]?.id ?? "", contactId: contacts[0]?.id ?? "",
    domainId: simple.domain[0]?.id ?? "", solutionGroupId: simple["solution-group"][0]?.id ?? "",
    skuIds: [] as string[], callTypeId: simple["call-type"][0]?.id ?? "",
    plannedDate: "", jointPresenter: "", plannedType: "Planned" as "Planned" | "Unplanned",
    assignedToUserId: currentUserId,
  };
  const [f, setF] = useState(empty);

  const create = () => {
    if (!f.accountId || !f.contactId || !f.plannedDate) return toast.error("Account, Contact, Planned Date required");
    const refNo = `ENG-${1100 + Math.floor(Math.random() * 9000)}`;
    const e: Engagement = {
      id: newId(), refNo, ...f,
      plannedDate: new Date(f.plannedDate).toISOString(),
      ownerUserId: currentUserId, assignedByUserId: currentUserId, assignedDate: nowIso(),
      status: "Planned", rescheduleHistory: [],
    };
    addEngagement(e);
    addHistory({ recordType: "Engagement", refNo, action: "Created", actionBy: me.fullName, actionDate: nowIso(), toUserId: f.assignedToUserId });
    toast.success(`Engagement ${refNo} planned`);
    setOpen(false); setF(empty);
  };

  return (
    <div>
      <PageHeader title="Engagement Calls" actions={
        <div className="flex items-center gap-2">
          <ColumnPicker columns={ALL_COLS} visible={visible} setVisible={setVisible} />
          <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Plan Engagement</Button>
        </div>
      } />
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow>
            {isVisible("refNo") && <TableHead>Ref</TableHead>}
            {isVisible("account") && <TableHead>Account</TableHead>}
            {isVisible("contact") && <TableHead>Contact</TableHead>}
            {isVisible("callType") && <TableHead>Call Type</TableHead>}
            {isVisible("planned") && <TableHead>Planned</TableHead>}
            {isVisible("assigned") && <TableHead>Assigned To</TableHead>}
            {isVisible("status") && <TableHead>Status</TableHead>}
            <TableHead className="w-48">Action</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {pg.paged.map((e) => {
              const eligible = !["Completed", "Cancelled"].includes(e.status);
              return (
                <TableRow key={e.id}>
                  {isVisible("refNo") && <TableCell className="font-mono text-xs">{e.refNo}</TableCell>}
                  {isVisible("account") && <TableCell>{accounts.find((a) => a.id === e.accountId)?.name}</TableCell>}
                  {isVisible("contact") && <TableCell>{contacts.find((c) => c.id === e.contactId)?.contactName}</TableCell>}
                  {isVisible("callType") && <TableCell>{simple["call-type"].find((c) => c.id === e.callTypeId)?.name}</TableCell>}
                  {isVisible("planned") && <TableCell className="text-xs">{fmtDate(e.plannedDate)}</TableCell>}
                  {isVisible("assigned") && <TableCell className="text-xs">{users.find((u) => u.id === e.assignedToUserId)?.fullName}</TableCell>}
                  {isVisible("status") && <TableCell><StatusBadge status={e.status} /></TableCell>}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" disabled={!eligible} onClick={() => setExec(e.id)}><Play className="mr-1 h-3 w-3" />Execute</Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button size="sm" variant="ghost"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem disabled={!eligible} onClick={() => setResch(e.id)}><RotateCcw className="mr-2 h-4 w-4" />Reschedule</DropdownMenuItem>
                          <DropdownMenuItem disabled={!eligible} onClick={() => setCancel(e.id)}><X className="mr-2 h-4 w-4" />Cancel</DropdownMenuItem>
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
          <DialogHeader><DialogTitle>Plan Engagement</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div>
              <Label>Account</Label>
              <SearchableSelect value={f.accountId} onValueChange={(v) => setF({ ...f, accountId: v })}
                options={accounts.filter((a) => a.active).map((a) => ({ value: a.id, label: a.name }))} />
            </div>
            <div>
              <Label>Contact</Label>
              <SearchableSelect value={f.contactId} onValueChange={(v) => setF({ ...f, contactId: v })}
                options={contacts.filter((c) => c.active && c.accountId === f.accountId).map((c) => ({ value: c.id, label: c.contactName }))} />
            </div>
            <div>
              <Label>Domain</Label>
              <SearchableSelect value={f.domainId} onValueChange={(v) => setF({ ...f, domainId: v })}
                options={simple.domain.filter((d) => d.active).map((d) => ({ value: d.id, label: d.name }))} />
            </div>
            <div>
              <Label>Solution Group</Label>
              <SearchableSelect value={f.solutionGroupId} onValueChange={(v) => setF({ ...f, solutionGroupId: v })}
                options={simple["solution-group"].filter((d) => d.active).map((d) => ({ value: d.id, label: d.name }))} />
            </div>
            <div>
              <Label>Call Type</Label>
              <SearchableSelect value={f.callTypeId} onValueChange={(v) => setF({ ...f, callTypeId: v })}
                options={simple["call-type"].filter((d) => d.active).map((d) => ({ value: d.id, label: d.name }))} />
            </div>
            <div>
              <Label>Planned / Unplanned</Label>
              <SearchableSelect value={f.plannedType} onValueChange={(v) => setF({ ...f, plannedType: v as "Planned" | "Unplanned" })}
                options={[{ value: "Planned", label: "Planned" }, { value: "Unplanned", label: "Unplanned" }]} />
            </div>
            <div><Label>Planned Date/Time</Label><Input type="datetime-local" value={f.plannedDate} onChange={(e) => setF({ ...f, plannedDate: e.target.value })} /></div>
            <div><Label>Joint Presenter</Label><Input value={f.jointPresenter} onChange={(e) => setF({ ...f, jointPresenter: e.target.value })} /></div>
            <div className="col-span-2">
              <Label>SKU(s)</Label>
              <SkuMultiSelect
                options={simple["sku-name"].filter((s) => s.active).map((s) => ({ value: s.id, label: s.name }))}
                value={f.skuIds}
                onChange={(v) => setF({ ...f, skuIds: v })}
              />
            </div>
            <div className="col-span-2">
              <Label>Assigned To</Label>
              <SearchableSelect value={f.assignedToUserId} onValueChange={(v) => setF({ ...f, assignedToUserId: v })}
                options={activeUsers.map((u) => ({ value: u.id, label: u.fullName }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EngagementExecuteDialog id={exec} onClose={() => setExec(null)} />
      <RescheduleDialog id={resch} onClose={() => setResch(null)} />
      <CancelDialog id={cancel} onClose={() => setCancel(null)} />
    </div>
  );
}

function SkuMultiSelect({
  options, value, onChange,
}: {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  const labels = options.filter((o) => value.includes(o.value)).map((o) => o.label);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          <span className="truncate text-left">
            {labels.length === 0 ? <span className="text-muted-foreground">Select SKUs...</span> : labels.join(", ")}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="p-2 border-b">
          <Input placeholder="Search SKUs..." value={q} onChange={(e) => setQ(e.target.value)} className="h-8" />
        </div>
        <div className="max-h-64 overflow-auto p-1">
          {filtered.length === 0 && <div className="px-2 py-3 text-xs text-muted-foreground">No SKUs found</div>}
          {filtered.map((o) => (
            <label key={o.value} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer">
              <Checkbox checked={value.includes(o.value)} onCheckedChange={() => toggle(o.value)} />
              <span className="truncate">{o.label}</span>
            </label>
          ))}
        </div>
        {value.length > 0 && (
          <div className="flex items-center justify-between border-t p-2">
            <span className="text-xs text-muted-foreground">{value.length} selected</span>
            <Button size="sm" variant="ghost" onClick={() => onChange([])}>Clear</Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
