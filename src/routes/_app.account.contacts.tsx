import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/crm/PageHeader";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { SearchableSelect } from "@/components/crm/SearchableSelect";
import { useCrm, newId, type Contact } from "@/lib/crm-store";

export const Route = createFileRoute("/_app/account/contacts")({ component: C });

const SALUTATIONS = ["Mr.", "Mrs.", "Dr.", "Miss", "Ms."];

function C() {
  const { contacts, accounts, simple, currentUserId, upsertContact, toggleContactActive } = useCrm();
  const activeAccounts = accounts.filter((a) => a.active);
  const services = simple["crm-services"].filter((s) => s.active);
  const [open, setOpen] = useState(false);
  const empty: Contact = { id: "", accountId: activeAccounts[0]?.id ?? "", salutation: "Mr.", contactName: "", department: "", designation: "", email: "", mobile: "", landline: "", boardNo: "", address: "", city: "", birthDate: "", anniversaryDate: "", workAnniversary: "", personalLiking: "", crmServiceIds: [], ownerUserId: currentUserId, active: true };
  const [f, setF] = useState<Contact>(empty);

  const save = () => {
    if (!f.contactName || !f.accountId) return toast.error("Account and Contact Name required");
    upsertContact({ ...f, id: f.id || newId() });
    toast.success("Saved"); setOpen(false);
  };

  return (
    <div>
      <PageHeader title="Contact Management" actions={
        <Button onClick={() => { setF({ ...empty, ownerUserId: currentUserId, accountId: activeAccounts[0]?.id ?? "" }); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Add New
        </Button>
      } />
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Account</TableHead><TableHead>Contact</TableHead><TableHead>Department</TableHead>
            <TableHead>Designation</TableHead><TableHead>Email</TableHead><TableHead>Mobile</TableHead>
            <TableHead>Status</TableHead><TableHead className="w-32">Action</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {contacts.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{accounts.find((a) => a.id === c.accountId)?.name}</TableCell>
                <TableCell className="font-medium">{c.salutation} {c.contactName}</TableCell>
                <TableCell>{c.department}</TableCell>
                <TableCell>{c.designation}</TableCell>
                <TableCell className="text-xs">{c.email}</TableCell>
                <TableCell className="text-xs">{c.mobile}</TableCell>
                <TableCell><StatusBadge status={c.active ? "Active" : "Inactive"} /></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setF(c); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { toggleContactActive(c.id); toast.success(c.active ? "Inactivated" : "Activated"); }}><Power className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{f.id ? "Edit" : "Add"} Contact</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div>
              <Label>Account *</Label>
              <SearchableSelect value={f.accountId} onValueChange={(v) => setF({ ...f, accountId: v })}
                options={activeAccounts.map((a) => ({ value: a.id, label: a.name }))} />
            </div>
            <div>
              <Label>Salutation</Label>
              <SearchableSelect value={f.salutation} onValueChange={(v) => setF({ ...f, salutation: v })}
                options={SALUTATIONS.map((s) => ({ value: s, label: s }))} />
            </div>
            <div><Label>Contact Name *</Label><Input value={f.contactName} onChange={(e) => setF({ ...f, contactName: e.target.value })} /></div>
            <div><Label>Department</Label><Input value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} /></div>
            <div><Label>Designation</Label><Input value={f.designation} onChange={(e) => setF({ ...f, designation: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div><Label>Mobile</Label><Input value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} /></div>
            <div><Label>City</Label><Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></div>
            <div className="col-span-2">
              <Label>CRM Services</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {services.map((s) => (
                  <label key={s.id} className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" checked={f.crmServiceIds.includes(s.id)}
                      onChange={(e) => setF({ ...f, crmServiceIds: e.target.checked ? [...f.crmServiceIds, s.id] : f.crmServiceIds.filter((x) => x !== s.id) })} />
                    {s.name}
                  </label>
                ))}
              </div>
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