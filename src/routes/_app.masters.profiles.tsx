import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/crm/PageHeader";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { useCrm, newId, nowIso, type Profile } from "@/lib/crm-store";

export const Route = createFileRoute("/_app/masters/profiles")({ component: P });

function P() {
  const { profiles, upsertProfile, toggleProfileActive } = useCrm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);

  const save = () => {
    if (!name.trim()) return toast.error("Profile Name required");
    const row: Profile = editing
      ? { ...editing, name, active }
      : { id: newId(), name, active, createdBy: "", createdDate: nowIso(), modifiedBy: "", modifiedDate: nowIso() };
    const err = upsertProfile(row);
    if (err) return toast.error(err);
    toast.success("Saved"); setOpen(false);
  };

  return (
    <div>
      <PageHeader title="Profile Master" actions={
        <Button onClick={() => { setEditing(null); setName(""); setActive(true); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />Add New</Button>
      } />
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="w-12">Sr.</TableHead><TableHead>Profile Name</TableHead><TableHead>Status</TableHead><TableHead className="w-44">Action</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {profiles.map((p, i) => (
              <TableRow key={p.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell><StatusBadge status={p.active ? "Active" : "Inactive"} /></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(p); setName(p.name); setActive(p.active); setOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleProfileActive(p.id)}>
                      <Power className="h-3.5 w-3.5" /><span className="ml-1 text-xs">{p.active ? "Inactivate" : "Activate"}</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Profile</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Profile Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="flex items-center gap-2"><Checkbox id="pa" checked={active} onCheckedChange={(v) => setActive(!!v)} /><Label htmlFor="pa">Active</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
