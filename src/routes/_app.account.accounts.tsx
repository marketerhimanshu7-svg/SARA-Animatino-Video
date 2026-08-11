import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/crm/PageHeader";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { SearchableSelect } from "@/components/crm/SearchableSelect";
import { ColumnPicker, useVisibleColumns } from "@/components/crm/ColumnPicker";
import { useCrm, newId, type Account, type Contact } from "@/lib/crm-store";

export const Route = createFileRoute("/_app/account/accounts")({ component: A });

function A() {
  const { accounts, simple, users, currentUserId, upsertAccount, toggleAccountActive, upsertContact,
    opportunities, engagements, businessOpenings } = useCrm();
  const industries = simple["account-industry"].filter((i) => i.active);
  const classifications = simple["classification"].filter((c) => c.active);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const empty: Account = { id: "", name: "", industryId: "", address: "", phone: "", website: "", email: "", city: "", remarks: "", solutionUsed: "", ownerUserId: currentUserId, classificationId: "", active: true };
  const [f, setF] = useState<Account>(empty);
  const me = users.find((u) => u.id === currentUserId)!;
  const [inactivateId, setInactivateId] = useState<string | null>(null);
  const inactivateAcc = accounts.find((a) => a.id === inactivateId);
  const openCount = inactivateId ? (
    opportunities.filter((o) => o.accountId === inactivateId && !["Completed", "Cancelled", "Converted"].includes(String(o.statusName))).length +
    engagements.filter((e) => e.accountId === inactivateId && !["Completed", "Cancelled"].includes(e.status)).length +
    businessOpenings.filter((b) => b.accountId === inactivateId && !b.boClosingDate).length
  ) : 0;
  const [contactOpen, setContactOpen] = useState(false);
  const [contactAccountId, setContactAccountId] = useState("");

  const ALL_COLS = [
    { key: "name", label: "Account" },
    { key: "industry", label: "Industry" },
    { key: "classification", label: "Classification" },
    { key: "city", label: "City" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "owner", label: "Owner" },
    { key: "status", label: "Status" },
  ];
  const { visible, setVisible, isVisible } = useVisibleColumns("accounts", ALL_COLS.map((c) => c.key));

  const save = (): Account | null => {
    if (!f.name || !f.city) { toast.error("Account Name and City required"); return null; }
    const row = editing ? f : { ...f, id: newId(), ownerUserId: currentUserId };
    const err = upsertAccount(row);
    if (err) { toast.error(err); return null; }
    toast.success("Saved");
    return row;
  };

  const onSave = () => { if (save()) setOpen(false); };
  const onSaveAndCreateContact = () => {
    const row = save(); if (!row) return;
    setOpen(false);
    setContactAccountId(row.id);
    setContactOpen(true);
  };

  return (
    <div>
      <PageHeader title="Account Management" actions={
        <div className="flex items-center gap-2">
          <ColumnPicker columns={ALL_COLS} visible={visible} setVisible={setVisible} />
          <Button onClick={() => { setEditing(null); setF({ ...empty, ownerUserId: currentUserId, industryId: industries[0]?.id ?? "", classificationId: classifications[0]?.id ?? "" }); setOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Add New
          </Button>
        </div>
      } />
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow>
            {isVisible("name") && <TableHead>Account</TableHead>}
            {isVisible("industry") && <TableHead>Industry</TableHead>}
            {isVisible("classification") && <TableHead>Classification</TableHead>}
            {isVisible("city") && <TableHead>City</TableHead>}
            {isVisible("phone") && <TableHead>Phone</TableHead>}
            {isVisible("email") && <TableHead>Email</TableHead>}
            {isVisible("owner") && <TableHead>Owner</TableHead>}
            {isVisible("status") && <TableHead>Status</TableHead>}
            <TableHead className="w-32">Action</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {accounts.map((a) => (
              <TableRow key={a.id}>
                {isVisible("name") && <TableCell className="font-medium">{a.name}</TableCell>}
                {isVisible("industry") && <TableCell>{simple["account-industry"].find((i) => i.id === a.industryId)?.name}</TableCell>}
                {isVisible("classification") && <TableCell className="text-xs">{simple["classification"].find((c) => c.id === a.classificationId)?.name ?? "-"}</TableCell>}
                {isVisible("city") && <TableCell>{a.city}</TableCell>}
                {isVisible("phone") && <TableCell className="text-xs">{a.phone}</TableCell>}
                {isVisible("email") && <TableCell className="text-xs">{a.email}</TableCell>}
                {isVisible("owner") && <TableCell className="text-xs">{users.find((u) => u.id === a.ownerUserId)?.fullName}</TableCell>}
                {isVisible("status") && <TableCell><StatusBadge status={a.active ? "Active" : "Inactive"} /></TableCell>}
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(a); setF(a); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (a.active) setInactivateId(a.id); else { toggleAccountActive(a.id); toast.success("Account activated"); } }}><Power className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Account</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div><Label>Account Name *</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div>
              <Label>Industry</Label>
              <SearchableSelect value={f.industryId} onValueChange={(v) => setF({ ...f, industryId: v })}
                options={industries.map((i) => ({ value: i.id, label: i.name }))} />
            </div>
            <div>
              <Label>Classification</Label>
              <SearchableSelect value={f.classificationId ?? ""} onValueChange={(v) => setF({ ...f, classificationId: v })}
                options={classifications.map((c) => ({ value: c.id, label: c.name }))} placeholder="Select Classification" />
            </div>
            <div><Label>City *</Label><Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div><Label>Website</Label><Input value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} /></div>
            <div className="col-span-2"><Label>Address</Label><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
            <div className="col-span-2"><Label>Solution Used</Label><Input value={f.solutionUsed} onChange={(e) => setF({ ...f, solutionUsed: e.target.value })} /></div>
            <div className="col-span-2"><Label>Remarks</Label><Textarea value={f.remarks} onChange={(e) => setF({ ...f, remarks: e.target.value })} /></div>
            <div className="col-span-2 text-xs text-muted-foreground">Owner: {me.fullName}</div>
            <div className="flex items-center gap-2"><Checkbox id="aca" checked={f.active} onCheckedChange={(v) => setF({ ...f, active: !!v })} /><Label htmlFor="aca">Active</Label></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="secondary" onClick={onSaveAndCreateContact}>Create Contact</Button>
            <Button onClick={onSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!inactivateId} onOpenChange={(o) => !o && setInactivateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inactivate Account?</AlertDialogTitle>
            <AlertDialogDescription>
              {openCount > 0 ? (
                <span className="text-destructive font-medium">
                  This account has active engagements or opportunities ({openCount} open record{openCount > 1 ? "s" : ""}). Are you sure you want to inactivate it?
                </span>
              ) : (
                <>Are you sure you want to inactivate {inactivateAcc?.name}?</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (inactivateId) { toggleAccountActive(inactivateId); toast.success("Account inactivated"); } setInactivateId(null); }}>
              Yes, Inactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <QuickContactDialog
        open={contactOpen}
        accountId={contactAccountId}
        onClose={() => setContactOpen(false)}
        onSave={(c) => { upsertContact(c); toast.success("Contact created"); setContactOpen(false); }}
      />
    </div>
  );
}

function QuickContactDialog({ open, accountId, onClose, onSave }: {
  open: boolean; accountId: string; onClose: () => void; onSave: (c: Contact) => void;
}) {
  const { currentUserId } = useCrm();
  const empty: Contact = {
    id: "", accountId, salutation: "Mr.", contactName: "", department: "", designation: "",
    email: "", mobile: "", landline: "", boardNo: "", address: "", city: "",
    birthDate: "", anniversaryDate: "", workAnniversary: "", personalLiking: "",
    crmServiceIds: [], ownerUserId: currentUserId, active: true,
  };
  const [f, setF] = useState<Contact>(empty);
  // sync accountId when opened
  if (open && f.accountId !== accountId && accountId) setF({ ...empty, accountId });
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Create Contact</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2 rounded-md bg-muted p-2 text-xs">Account pre-selected.</div>
          <div><Label>Contact Name *</Label><Input value={f.contactName} onChange={(e) => setF({ ...f, contactName: e.target.value })} /></div>
          <div><Label>Designation</Label><Input value={f.designation} onChange={(e) => setF({ ...f, designation: e.target.value })} /></div>
          <div><Label>Department</Label><Input value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div><Label>Mobile</Label><Input value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} /></div>
          <div><Label>City</Label><Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (!f.contactName) return toast.error("Contact Name required"); onSave({ ...f, id: newId() }); }}>Save Contact</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}