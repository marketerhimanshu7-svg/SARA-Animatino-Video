import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/crm/PageHeader";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { useCrm, newId, nowIso, type User } from "@/lib/crm-store";

export const Route = createFileRoute("/_app/masters/users")({ component: UsersPage });

function UsersPage() {
  const { users, profiles, upsertUser, toggleUserActive } = useCrm();
  const activeProfiles = profiles.filter((p) => p.active);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const empty = { userName: "", fullName: "", email: "", mobile: "", location: "", profileId: "", active: true, password: "demo123" };
  const [f, setF] = useState(empty);

  const start = (u?: User) => {
    if (u) { setEditing(u); setF({ ...u }); } else { setEditing(null); setF({ ...empty, profileId: activeProfiles[0]?.id ?? "" }); }
    setOpen(true);
  };

  const save = () => {
    if (!f.userName || !f.fullName || !f.email || !f.profileId) return toast.error("Fill required fields");
    const row: User = editing
      ? { ...editing, ...f }
      : { id: newId(), ...f, createdBy: "", createdDate: nowIso(), modifiedBy: "", modifiedDate: nowIso() };
    const err = upsertUser(row);
    if (err) return toast.error(err);
    toast.success(editing ? "Updated" : "Added");
    setOpen(false);
  };

  const sorted = useMemo(() => [...users].sort((a, b) => a.userName.localeCompare(b.userName)), [users]);

  return (
    <div>
      <PageHeader title="User Master" description="Manage CRM users and their profiles." actions={
        <Button onClick={() => start()}><Plus className="mr-2 h-4 w-4" />Add New</Button>
      } />
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="w-12">Sr.</TableHead><TableHead>User Name</TableHead><TableHead>Full Name</TableHead>
            <TableHead>Email</TableHead><TableHead>Mobile</TableHead><TableHead>Location</TableHead>
            <TableHead>Profile</TableHead><TableHead>Status</TableHead><TableHead className="w-44">Action</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {sorted.map((u, i) => (
              <TableRow key={u.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell className="font-medium">{u.userName}</TableCell>
                <TableCell>{u.fullName}</TableCell>
                <TableCell className="text-xs">{u.email}</TableCell>
                <TableCell className="text-xs">{u.mobile}</TableCell>
                <TableCell className="text-xs">{u.location}</TableCell>
                <TableCell className="text-xs">{profiles.find((p) => p.id === u.profileId)?.name}</TableCell>
                <TableCell><StatusBadge status={u.active ? "Active" : "Inactive"} /></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => start(u)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleUserActive(u.id)}>
                      <Power className="h-3.5 w-3.5" /><span className="ml-1 text-xs">{u.active ? "Inactivate" : "Activate"}</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} User</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div><Label>User Name *</Label><Input value={f.userName} onChange={(e) => setF({ ...f, userName: e.target.value })} /></div>
            <div><Label>Full Name *</Label><Input value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} /></div>
            <div><Label>Email *</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div><Label>Mobile No.</Label><Input value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} /></div>
            <div><Label>Location</Label><Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></div>
            <div>
              <Label>Profile *</Label>
              <Select value={f.profileId} onValueChange={(v) => setF({ ...f, profileId: v })}>
                <SelectTrigger><SelectValue placeholder="Select active profile" /></SelectTrigger>
                <SelectContent>{activeProfiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Password (mock)</Label><Input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox id="ua" checked={f.active} onCheckedChange={(v) => setF({ ...f, active: !!v })} />
              <Label htmlFor="ua">Active</Label>
            </div>
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
