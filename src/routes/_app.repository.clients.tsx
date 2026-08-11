import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/crm/PageHeader";
import { useCrm, newId, nowIso, fmtDate, fmtSize, type ClientDoc } from "@/lib/crm-store";
import { Paginator, usePagination } from "@/components/crm/Paginator";

const ALLOWED = [".pdf", ".xls", ".xlsx", ".ppt", ".pptx", ".doc", ".docx"];
const MAX_FILE = 25 * 1024 * 1024;
const MAX_TOTAL = 100 * 1024 * 1024;

export const Route = createFileRoute("/_app/repository/clients")({ component: C });

function C() {
  const { accounts, simple, clientDocs, addClientDoc, users, currentUserId } = useCrm();
  const me = users.find((u) => u.id === currentUserId)!;
  const pg = usePagination(clientDocs, 10);
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [docTypeId, setDocTypeId] = useState("");
  const [remarks, setRemarks] = useState("");

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    if (!accountId || !docTypeId) return toast.error("Select Account and Document Type");
    let total = 0;
    const list = Array.from(files);
    for (const f of list) {
      const ext = "." + f.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED.includes(ext)) return toast.error("Only PDF, Excel, PowerPoint, and Word files are allowed.");
      if (f.size > MAX_FILE) return toast.error("File size exceeds the allowed limit of 25 MB.");
      total += f.size;
    }
    if (total > MAX_TOTAL) return toast.error("Total upload size exceeds the allowed limit of 100 MB.");
    list.forEach((f) => {
      const doc: ClientDoc = {
        id: newId(), accountId, documentTypeId: docTypeId,
        fileName: f.name, fileType: f.type || f.name.split(".").pop() || "",
        fileSize: f.size, remarks, uploadedBy: me.userName, uploadedDate: nowIso(),
        modifiedBy: me.userName, modifiedDate: nowIso(), active: true,
      };
      addClientDoc(doc);
    });
    toast.success(`${list.length} document(s) uploaded`);
    setOpen(false); setRemarks("");
  };

  return (
    <div>
      <PageHeader title="Repository" description="Account-specific documents." actions={
        <Button onClick={() => setOpen(true)}><Upload className="mr-2 h-4 w-4" />Upload Documents</Button>
      } />
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Account</TableHead><TableHead>File</TableHead><TableHead>Doc Type</TableHead>
            <TableHead>Size</TableHead><TableHead>Uploaded By</TableHead><TableHead>Uploaded</TableHead>
            <TableHead className="w-32">Action</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {pg.paged.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="text-xs">{accounts.find((a) => a.id === d.accountId)?.name}</TableCell>
                <TableCell className="font-medium">{d.fileName}</TableCell>
                <TableCell className="text-xs">{simple["document-type"].find((x) => x.id === d.documentTypeId)?.name}</TableCell>
                <TableCell className="text-xs">{fmtSize(d.fileSize)}</TableCell>
                <TableCell className="text-xs">{d.uploadedBy}</TableCell>
                <TableCell className="text-xs">{fmtDate(d.uploadedDate)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => toast.message("Download (mock)")}><Download className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {clientDocs.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No documents uploaded.</TableCell></TableRow>}
          </TableBody>
        </Table>
        <Paginator {...pg} />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Client Document</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{accounts.filter((a) => a.active).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Document Type</Label>
              <Select value={docTypeId} onValueChange={setDocTypeId}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{simple["document-type"].filter((x) => x.active).map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Remarks</Label><Input value={remarks} onChange={(e) => setRemarks(e.target.value)} /></div>
            <div>
              <Label>Files (PDF, Excel, PowerPoint, Word — max 25 MB each, 100 MB total)</Label>
              <Input type="file" multiple accept={ALLOWED.join(",")} onChange={(e) => onFiles(e.target.files)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
