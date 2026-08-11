import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Save, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/crm/PageHeader";
import { SearchableSelect } from "@/components/crm/SearchableSelect";
import { useCrm, fmtDate } from "@/lib/crm-store";

export const Route = createFileRoute("/_app/connect/planning")({ component: P });

function P() {
  const { accounts, simple, users, currentUserId, engagementPlans, addEngagementPlan, updateEngagementPlan } = useCrm();
  const me = users.find((u) => u.id === currentUserId)!;
  const activeAccounts = accounts.filter((a) => a.active);

  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [fromMonth, setFromMonth] = useState(defaultMonth);
  const [toMonth, setToMonth] = useState(defaultMonth);
  const [accountId, setAccountId] = useState(activeAccounts[0]?.id ?? "");
  const [count, setCount] = useState<string>("");
  const [remarks, setRemarks] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const acct = accounts.find((a) => a.id === accountId);
  const classification = simple["classification"].find((c) => c.id === acct?.classificationId)?.name ?? "-";

  const save = () => {
    const n = parseInt(count || "0", 10);
    if (!fromMonth || !toMonth) return toast.error("From and To Month required");
    if (toMonth < fromMonth) return toast.error("To Month cannot be earlier than From Month");
    if (!accountId) return toast.error("Account required");
    if (!n || n < 1) return toast.error("Planned count must be > 0");
    if (editingId) {
      updateEngagementPlan(editingId, { month: fromMonth, fromMonth, toMonth, accountId, plannedCount: n, remarks });
      toast.success("Plan updated");
    } else {
      addEngagementPlan({ month: fromMonth, fromMonth, toMonth, accountId, plannedCount: n, remarks });
      toast.success("Plan saved");
    }
    setCount(""); setRemarks(""); setEditingId(null);
  };

  return (
    <div>
      <PageHeader title="High Level Engagement Planning" description="Plan monthly engagement targets per account." />
      <div className="mb-6 rounded-lg border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-6">
          <div><Label>From Month</Label><Input type="month" value={fromMonth} onChange={(e) => setFromMonth(e.target.value)} /></div>
          <div><Label>To Month</Label><Input type="month" value={toMonth} onChange={(e) => setToMonth(e.target.value)} /></div>
          <div>
            <Label>Account</Label>
            <SearchableSelect value={accountId} onValueChange={setAccountId}
              options={activeAccounts.map((a) => ({ value: a.id, label: a.name }))} />
          </div>
          <div>
            <Label>Classification</Label>
            <Input value={classification} disabled />
          </div>
          <div><Label>Planned Engagement Count</Label><Input type="number" min={1} value={count} onChange={(e) => setCount(e.target.value)} /></div>
          <div className="md:col-span-1">
            <Label>&nbsp;</Label>
            <Button onClick={save} className="w-full"><Save className="mr-2 h-4 w-4" />{editingId ? "Update" : "Save"}</Button>
          </div>
          <div className="md:col-span-6">
            <Label>Remarks</Label>
            <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" />
          </div>
          <div className="md:col-span-6 text-xs text-muted-foreground">User: {me.fullName}</div>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>From Month</TableHead><TableHead>To Month</TableHead><TableHead>Account</TableHead><TableHead>Classification</TableHead>
            <TableHead>Planned Count</TableHead><TableHead>Remarks</TableHead>
            <TableHead>Created By</TableHead><TableHead>Created On</TableHead><TableHead className="w-20">Action</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {engagementPlans.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-xs">No plans saved yet.</TableCell></TableRow>
            )}
            {engagementPlans.map((p) => {
              const a = accounts.find((x) => x.id === p.accountId);
              const cl = simple["classification"].find((c) => c.id === a?.classificationId)?.name ?? "-";
              const u = users.find((x) => x.id === p.createdByUserId)?.fullName;
              return (
                <TableRow key={p.id}>
                  <TableCell className="text-xs">{p.fromMonth ?? p.month}</TableCell>
                  <TableCell className="text-xs">{p.toMonth ?? p.month}</TableCell>
                  <TableCell>{a?.name}</TableCell>
                  <TableCell className="text-xs">{cl}</TableCell>
                  <TableCell className="text-xs">{p.plannedCount}</TableCell>
                  <TableCell className="text-xs">{p.remarks || "-"}</TableCell>
                  <TableCell className="text-xs">{u}</TableCell>
                  <TableCell className="text-xs">{fmtDate(p.createdAt)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingId(p.id); setFromMonth(p.fromMonth ?? p.month); setToMonth(p.toMonth ?? p.month); setAccountId(p.accountId); setCount(String(p.plannedCount)); setRemarks(p.remarks); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}