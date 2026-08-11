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
import { useCrm, newId, nowIso, fmtDate, fmtSize, type KnowledgeDoc } from "@/lib/crm-store";
import { Paginator, usePagination } from "@/components/crm/Paginator";

const ALLOWED = [".pdf", ".xls", ".xlsx", ".ppt", ".pptx", ".doc", ".docx"];
const MAX_FILE = 25 * 1024 * 1024;
const MAX_TOTAL = 100 * 1024 * 1024;

export const Route = createFileRoute("/_app/repository/knowledge")({ component: K });

function K() {
  const { simple, knowledgeDocs, addKnowledgeDoc, users, currentUserId } = useCrm();
  const me = users.find((u) => u.id === currentUserId)!;
  const pg = usePagination(knowledgeDocs, 10);
  const [open, setOpen] = useState(false);
  const [domainId, setDomainId] = useState("");
  const [sgId, setSgId] = useState("");
  const [skuId, setSkuId] = useState("");
  const [docTypeId, setDocTypeId] = useState("");
  const [remarks, setRemarks] = useState("");

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    if (!domainId || !sgId || !skuId || !docTypeId) return toast.error("Select Domain, Solution Group, SKU, Document Type");
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
      const doc: KnowledgeDoc = {
        id: newId(), domainId, solutionGroupId: sgId, skuId, documentTypeId: docTypeId,
        fileName: f.name, fileType: f.type || f.name.split(".").pop() || "",
        fileSize: f.size, remarks, uploadedBy: me.userName, uploadedDate: nowIso(),
        modifiedBy: me.userName, modifiedDate: nowIso(), active: true,
      };
      addKnowledgeDoc(doc);
    });
    toast.success(`${list.length} document(s) uploaded`);
    setOpen(false); setRemarks("");
  };

  return (
    <div>
      <PageHeader title="Knowledge Bank" description="Solution/SKU-specific internal documents." actions={
        <Button onClick={() => setOpen(true)}><Upload className="mr-2 h-4 w-4" />Upload Documents</Button>
      } />
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>File</TableHead><TableHead>Domain</TableHead><TableHead>Solution Group</TableHead>
            <TableHead>SKU</TableHead><TableHead>Doc Type</TableHead>
            <TableHead>Size</TableHead><TableHead>Uploaded By</TableHead><TableHead>Uploaded</TableHead>
            <TableHead className="w-32">Action</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {pg.paged.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.fileName}</TableCell>
                <TableCell className="text-xs">{simple.domain.find((x) => x.id === d.domainId)?.name}</TableCell>
                <TableCell className="text-xs">{simple["solution-group"].find((x) => x.id === d.solutionGroupId)?.name}</TableCell>
                <TableCell className="text-xs">{simple["sku-name"].find((x) => x.id === d.skuId)?.name}</TableCell>
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
            {knowledgeDocs.length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">No documents uploaded.</TableCell></TableRow>}
          </TableBody>
        </Table>
        <Paginator {...pg} />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload to Knowledge Bank</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div><Label>Domain</Label>
              <Select value={domainId} onValueChange={setDomainId}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{simple.domain.filter((x) => x.active).map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Solution Group</Label>
              <Select value={sgId} onValueChange={setSgId}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{simple["solution-group"].filter((x) => x.active).map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>SKU</Label>
              <Select value={skuId} onValueChange={setSkuId}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{simple["sku-name"].filter((x) => x.active).map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Document Type</Label>
              <Select value={docTypeId} onValueChange={setDocTypeId}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{simple["document-type"].filter((x) => x.active).map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Remarks</Label><Input value={remarks} onChange={(e) => setRemarks(e.target.value)} /></div>
            <div className="col-span-2">
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
