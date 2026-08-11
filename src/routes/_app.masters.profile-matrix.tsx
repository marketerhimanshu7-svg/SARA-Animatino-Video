import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/crm/PageHeader";
import { useCrm, MATRIX_MODULES } from "@/lib/crm-store";

export const Route = createFileRoute("/_app/masters/profile-matrix")({ component: PM });

function PM() {
  const { profiles, matrix, saveMatrix, validateCredentials } = useCrm();
  const activeProfiles = profiles.filter((p) => p.active);
  const [profileId, setProfileId] = useState(activeProfiles[0]?.id ?? "");
  const initial = matrix.find((m) => m.profileId === profileId);
  const [access, setAccess] = useState<Record<string, boolean>>(initial?.access ?? Object.fromEntries(MATRIX_MODULES.map((m) => [m.key, false])));
  const [confirm, setConfirm] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");

  // sync when profile changes
  useEffect(() => {
    const cur = matrix.find((m) => m.profileId === profileId);
    setAccess(cur?.access ?? Object.fromEntries(MATRIX_MODULES.map((m) => [m.key, false])));
  }, [profileId, matrix]);

  const tryConfirm = () => {
    if (!validateCredentials(loginId, password)) {
      return toast.error("Invalid Login ID or Password. Profile Matrix changes were not saved.");
    }
    saveMatrix({ profileId, access });
    toast.success("Profile Matrix saved");
    setConfirm(false); setLoginId(""); setPassword("");
  };

  const grouped = MATRIX_MODULES.reduce<Record<string, typeof MATRIX_MODULES>>((acc, m) => {
    (acc[m.module] ??= []).push(m); return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Profile Matrix" description="Configure module/sub-module access per profile." />
      <div className="mb-4 flex items-end gap-3">
        <div className="w-72">
          <Label>Profile</Label>
          <Select value={profileId} onValueChange={setProfileId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{activeProfiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={() => setConfirm(true)}><Save className="mr-2 h-4 w-4" />Save Matrix</Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Module</TableHead><TableHead>Sub Module</TableHead><TableHead className="w-32">Access</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {Object.entries(grouped).map(([mod, items]) => (
              items.map((it, idx) => (
                <TableRow key={it.key}>
                  <TableCell className="font-medium">{idx === 0 ? mod : ""}</TableCell>
                  <TableCell>{it.sub}</TableCell>
                  <TableCell>
                    <Checkbox checked={!!access[it.key]} onCheckedChange={(v) => setAccess((a) => ({ ...a, [it.key]: !!v }))} />
                  </TableCell>
                </TableRow>
              ))
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm with credentials</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">Re-enter your Login ID and Password to save the Profile Matrix.</p>
            <div><Label>Login ID</Label><Input value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="e.g. admin" /></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="e.g. admin123" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button onClick={tryConfirm}>Confirm & Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
