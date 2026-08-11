import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Power, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/crm/PageHeader";
import { StatusBadge } from "@/components/crm/StatusBadge";
import {
  SIMPLE_MASTERS, useCrm, type SimpleMasterKey, type MasterRow, newId, nowIso, fmtDate,
} from "@/lib/crm-store";

export function SimpleMasterPage({ masterKey }: { masterKey: SimpleMasterKey }) {
  const def = SIMPLE_MASTERS.find((m) => m.key === masterKey)!;
  const { simple, upsertSimple, toggleSimpleActive } = useCrm();
  const rows = simple[masterKey];

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MasterRow | null>(null);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);

  const startAdd = () => { setEditing(null); setName(""); setActive(true); setOpen(true); };
  const startEdit = (r: MasterRow) => { setEditing(r); setName(r.name); setActive(r.active); setOpen(true); };

  const onSave = () => {
    if (!name.trim()) return toast.error("Name is required");
    const row: MasterRow = editing
      ? { ...editing, name: name.trim(), active }
      : { id: newId(), name: name.trim(), active, createdBy: "", createdDate: nowIso(), modifiedBy: "", modifiedDate: nowIso() };
    const err = upsertSimple(masterKey, row);
    if (err) return toast.error(err);
    toast.success(editing ? "Updated" : "Added");
    setOpen(false);
  };

  const sorted = useMemo(() => [...rows].sort((a, b) => a.name.localeCompare(b.name)), [rows]);

  return (
    <div>
      <PageHeader
        title={def.label}
        description="Manage master values used across the application."
        actions={<Button onClick={startAdd}><Plus className="mr-2 h-4 w-4" /> Add New</Button>}
      />
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Sr. No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead>Modified By</TableHead>
              <TableHead>Modified Date</TableHead>
              <TableHead className="w-44">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r, i) => (
              <TableRow key={r.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell><StatusBadge status={r.active ? "Active" : "Inactive"} /></TableCell>
                <TableCell className="text-xs">{r.createdBy}</TableCell>
                <TableCell className="text-xs">{fmtDate(r.createdDate)}</TableCell>
                <TableCell className="text-xs">{r.modifiedBy}</TableCell>
                <TableCell className="text-xs">{fmtDate(r.modifiedDate)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(r)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleSimpleActive(masterKey, r.id)}>
                      <Power className="h-3.5 w-3.5" />
                      <span className="ml-1 text-xs">{r.active ? "Inactivate" : "Activate"}</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">No records.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add New"} — {def.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="active" checked={active} onCheckedChange={(v) => setActive(!!v)} />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}><X className="mr-2 h-4 w-4" /> Cancel</Button>
            <Button onClick={onSave}><Save className="mr-2 h-4 w-4" /> Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}