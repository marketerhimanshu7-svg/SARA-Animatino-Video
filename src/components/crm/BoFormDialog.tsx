import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/crm/SearchableSelect";
import {
  useCrm, newId, nowIso, BO_PROBABILITIES, type BusinessOpening, type BODoc, type BOProbability,
} from "@/lib/crm-store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const ALLOWED = [".pdf", ".xls", ".xlsx", ".ppt", ".pptx", ".doc", ".docx"];
const MAX_FILE = 25 * 1024 * 1024;
const MAX_TOTAL = 100 * 1024 * 1024;

export interface BoFormPrefill {
  accountId?: string;
  contactId?: string;
  domainId?: string;
  solutionGroupId?: string;
  skuIds?: string[];
  boDetails?: string;
  sourceOpportunityId?: string;
  sourceOpportunityRefNo?: string;
}

export function BoFormDialog({
  open, onClose, editingId, prefill, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editingId?: string | null;
  prefill?: BoFormPrefill;
  onSaved?: (bo: BusinessOpening) => void;
}) {
  const {
    accounts, contacts, simple, users, currentUserId,
    businessOpenings, addBusinessOpening, updateBusinessOpening,
    opportunities, history,
    addBoDoc, addHistory,
  } = useCrm();
  const me = users.find((u) => u.id === currentUserId)!;
  const editing = editingId ? businessOpenings.find((b) => b.id === editingId) ?? null : null;

  const initial = (): Partial<BusinessOpening> => ({
    accountId: editing?.accountId ?? prefill?.accountId ?? "",
    contactId: editing?.contactId ?? prefill?.contactId ?? "",
    boSourceId: editing?.boSourceId ?? "",
    boCreationDate: editing?.boCreationDate ?? new Date().toISOString().slice(0, 10),
    boStageId: editing?.boStageId ?? "",
    domainId: editing?.domainId ?? prefill?.domainId ?? "",
    solutionGroupId: editing?.solutionGroupId ?? prefill?.solutionGroupId ?? "",
    skuIds: editing?.skuIds ?? prefill?.skuIds ?? [],
    boDetails: editing?.boDetails ?? prefill?.boDetails ?? "",
    boTypeId: editing?.boTypeId ?? "",
    boProbability: editing?.boProbability ?? "",
    expectedClosureDate: editing?.expectedClosureDate ?? "",
    proposalDate: editing?.proposalDate ?? "",
    estimatedFirstYearValue: editing?.estimatedFirstYearValue ?? "",
    totalContractValue: editing?.totalContractValue ?? "",
    boClosingDate: editing?.boClosingDate ?? "",
    remarks: editing?.remarks ?? "",
    sourceOpportunityId: editing?.sourceOpportunityId ?? prefill?.sourceOpportunityId,
    sourceOpportunityRefNo: editing?.sourceOpportunityRefNo ?? prefill?.sourceOpportunityRefNo,
  });

  const [f, setF] = useState<Partial<BusinessOpening>>(initial());
  const [pendingDocs, setPendingDocs] = useState<File[]>([]);

  useEffect(() => {
    if (open) {
      setF(initial());
      setPendingDocs([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingId, prefill?.sourceOpportunityId]);

  const filteredContacts = contacts.filter((c) => c.active && (!f.accountId || c.accountId === f.accountId));

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const list = Array.from(files);
    let total = pendingDocs.reduce((s, x) => s + x.size, 0);
    for (const file of list) {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED.includes(ext)) return toast.error("Only PDF, Excel, PowerPoint, and Word files are allowed.");
      if (file.size > MAX_FILE) return toast.error("File size exceeds the allowed limit of 25 MB.");
      total += file.size;
    }
    if (total > MAX_TOTAL) return toast.error("Total upload size exceeds the allowed limit of 100 MB.");
    setPendingDocs((p) => [...p, ...list]);
  };

  const save = () => {
    if (!f.accountId) return toast.error("Account Name required");
    if (!f.contactId) return toast.error("Contact Name required");
    if (!f.boSourceId) return toast.error("BO Source required");
    if (!f.boStageId) return toast.error("BO Stage required");
    if (!f.boTypeId) return toast.error("BO Type required");
    if (!f.expectedClosureDate) return toast.error("Expected Closure Date required");

    if (editing) {
      updateBusinessOpening(editing.id, { ...f, modifiedBy: me.fullName });
      pendingDocs.forEach((file) => {
        addBoDoc({
          id: newId(), boId: editing.id, fileName: file.name,
          fileType: file.type || file.name.split(".").pop() || "",
          fileSize: file.size, uploadedBy: me.userName, uploadedDate: nowIso(),
          modifiedBy: me.userName, modifiedDate: nowIso(),
        });
      });
      addHistory({
        recordType: "Opportunity", refNo: editing.boId, action: "BO updated",
        actionBy: me.fullName, actionDate: nowIso(),
      });
      toast.success(`Business Opening ${editing.boId} updated`);
      onSaved?.({ ...editing, ...f } as BusinessOpening);
      onClose();
      return;
    }

    const id = newId();
    const boId = `BO-${3000 + Math.floor(Math.random() * 9000)}`;
    const created: BusinessOpening = {
      id, boId,
      accountId: f.accountId!, contactId: f.contactId!,
      boSourceId: f.boSourceId!, boCreationDate: f.boCreationDate || new Date().toISOString().slice(0, 10),
      boStageId: f.boStageId!,
      domainId: f.domainId ?? "", solutionGroupId: f.solutionGroupId ?? "",
      skuIds: f.skuIds ?? [],
      boDetails: f.boDetails ?? "",
      boTypeId: f.boTypeId!,
      boProbability: (f.boProbability as BOProbability) || "Medium",
      expectedClosureDate: f.expectedClosureDate!,
      proposalDate: f.proposalDate ?? "",
      estimatedFirstYearValue: f.estimatedFirstYearValue ?? "",
      totalContractValue: f.totalContractValue ?? "",
      boClosingDate: f.boClosingDate ?? "",
      remarks: f.remarks ?? "",
      ownerUserId: currentUserId,
      sourceOpportunityId: f.sourceOpportunityId,
      sourceOpportunityRefNo: f.sourceOpportunityRefNo,
      createdBy: me.fullName, createdDate: nowIso(),
      modifiedBy: me.fullName, modifiedDate: nowIso(),
      convertedBy: f.sourceOpportunityId ? me.fullName : undefined,
      convertedDate: f.sourceOpportunityId ? nowIso() : undefined,
      active: true,
    };
    addBusinessOpening(created);
    pendingDocs.forEach((file) => {
      addBoDoc({
        id: newId(), boId: id, fileName: file.name,
        fileType: file.type || file.name.split(".").pop() || "",
        fileSize: file.size, uploadedBy: me.userName, uploadedDate: nowIso(),
        modifiedBy: me.userName, modifiedDate: nowIso(),
      });
    });
    addHistory({
      recordType: "Opportunity", refNo: boId,
      action: f.sourceOpportunityRefNo ? `BO created from ${f.sourceOpportunityRefNo}` : "BO created",
      actionBy: me.fullName, actionDate: nowIso(),
    });
    toast.success(`Business Opening ${boId} created`);
    onSaved?.(created);
    onClose();
  };

  const toggleSku = (id: string) =>
    setF((p) => ({ ...p, skuIds: (p.skuIds ?? []).includes(id) ? (p.skuIds ?? []).filter((x) => x !== id) : [...(p.skuIds ?? []), id] }));

  const accOpts = accounts.filter((a) => a.active);
  const sources = simple["bo-source"].filter((x) => x.active);
  const stages = simple["bo-stage"].filter((x) => x.active);
  const domains = simple.domain.filter((x) => x.active);
  const sgs = simple["solution-group"].filter((x) => x.active);
  const skus = simple["sku-name"].filter((x) => x.active);
  const types = simple["bo-type"].filter((x) => x.active);

  const stageIdx = stages.findIndex((s) => s.id === f.boStageId);
  const pct = stageIdx >= 0 && stages.length > 0 ? ((stageIdx + 1) / stages.length) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? `Edit Business Opening — ${editing.boId}` : f.sourceOpportunityRefNo ? `Convert to BO (from ${f.sourceOpportunityRefNo})` : "New Business Opening"}
          </DialogTitle>
        </DialogHeader>

        <div className="sticky top-0 z-20 -mx-6 border-b bg-background/95 px-6 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="font-medium uppercase tracking-wide">BO Stage Progress</span>
            <span>{stageIdx >= 0 ? `${stages[stageIdx].name} · ${stageIdx + 1}/${stages.length}` : "Not set"}</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1.5 flex gap-1 overflow-x-auto pb-0.5">
            {stages.map((s, i) => {
              const active = i === stageIdx;
              const done = stageIdx >= 0 && i < stageIdx;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setF({ ...f, boStageId: s.id })}
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-[10px] transition-colors",
                    active && "border-primary bg-primary text-primary-foreground",
                    done && !active && "border-primary/40 bg-primary/10 text-primary",
                    !active && !done && "border-border bg-background text-muted-foreground hover:bg-muted",
                  )}
                  title={s.name}
                >
                  {i + 1}. {s.name}
                </button>
              );
            })}
          </div>
        </div>

        {f.sourceOpportunityRefNo && !editing && (
          <div className="rounded-md bg-muted p-3 text-xs">
            Linked Opportunity: <span className="font-medium">{f.sourceOpportunityRefNo}</span>
          </div>
        )}

        {!editing && !prefill?.sourceOpportunityId && (
          <div className="rounded-md border bg-card p-3">
            <Label className="text-xs">Link to Opportunity (optional)</Label>
            <SearchableSelect
              value={f.sourceOpportunityId ?? ""}
              onValueChange={(v) => {
                const opp = opportunities.find((o) => o.id === v);
                setF({
                  ...f,
                  sourceOpportunityId: v,
                  sourceOpportunityRefNo: opp?.refNo,
                  accountId: opp?.accountId ?? f.accountId,
                  contactId: opp?.contactId ?? f.contactId,
                  domainId: opp?.domainId ?? f.domainId,
                  solutionGroupId: opp?.solutionGroupId ?? f.solutionGroupId,
                });
              }}
              options={opportunities
                .filter((o) => !f.accountId || o.accountId === f.accountId)
                .map((o) => ({ value: o.id, label: `${o.refNo} — ${accounts.find((a) => a.id === o.accountId)?.name ?? ""}` }))}
              placeholder="Select opportunity to link"
            />
            {f.sourceOpportunityId && (() => {
              const opp = opportunities.find((o) => o.id === f.sourceOpportunityId);
              if (!opp) return null;
              const trail = history.filter((h) => h.recordType === "Opportunity" && h.refNo === opp.refNo).slice(0, 6);
              return (
                <div className="mt-3">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Linked Opportunity — History</div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead className="text-[11px]">Action</TableHead>
                        <TableHead className="text-[11px]">By</TableHead>
                        <TableHead className="text-[11px]">When</TableHead>
                        <TableHead className="text-[11px]">Remarks</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {trail.length === 0 && (
                          <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-3">No history yet for {opp.refNo}.</TableCell></TableRow>
                        )}
                        {trail.map((h) => (
                          <TableRow key={h.id}>
                            <TableCell className="text-xs">{h.action}</TableCell>
                            <TableCell className="text-xs">{h.actionBy}</TableCell>
                            <TableCell className="text-xs">{new Date(h.actionDate).toISOString().slice(0, 16).replace("T", " ")}</TableCell>
                            <TableCell className="text-xs">{h.remarks ?? "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 py-2">
          <div>
            <Label>Account Name *</Label>
            <SearchableSelect value={f.accountId ?? ""} onValueChange={(v) => setF({ ...f, accountId: v, contactId: "" })}
              options={accOpts.map((a) => ({ value: a.id, label: a.name }))} placeholder="Select Account" />
          </div>
          <div>
            <Label>Contact Name *</Label>
            <SearchableSelect value={f.contactId ?? ""} onValueChange={(v) => setF({ ...f, contactId: v })}
              options={filteredContacts.map((c) => ({ value: c.id, label: c.contactName }))} placeholder="Select Contact" />
          </div>
          <div>
            <Label>BO Source *</Label>
            <SearchableSelect value={f.boSourceId ?? ""} onValueChange={(v) => setF({ ...f, boSourceId: v })}
              options={sources.map((x) => ({ value: x.id, label: x.name }))} placeholder="Select Source" />
          </div>
          <div>
            <Label>BO Creation Date</Label>
            <Input type="date" value={f.boCreationDate ?? ""} onChange={(e) => setF({ ...f, boCreationDate: e.target.value })} />
          </div>
          <div>
            <Label>BO Stage *</Label>
            <SearchableSelect value={f.boStageId ?? ""} onValueChange={(v) => setF({ ...f, boStageId: v })}
              options={stages.map((x) => ({ value: x.id, label: x.name }))} placeholder="Select Stage" />
          </div>
          <div>
            <Label>BO Type *</Label>
            <SearchableSelect value={f.boTypeId ?? ""} onValueChange={(v) => setF({ ...f, boTypeId: v })}
              options={types.map((x) => ({ value: x.id, label: x.name }))} placeholder="Select Type" />
          </div>
          <div>
            <Label>Domain</Label>
            <SearchableSelect value={f.domainId ?? ""} onValueChange={(v) => setF({ ...f, domainId: v })}
              options={domains.map((x) => ({ value: x.id, label: x.name }))} placeholder="Select Domain" />
          </div>
          <div>
            <Label>Solution Group</Label>
            <SearchableSelect value={f.solutionGroupId ?? ""} onValueChange={(v) => setF({ ...f, solutionGroupId: v })}
              options={sgs.map((x) => ({ value: x.id, label: x.name }))} placeholder="Select Solution Group" />
          </div>
          <div className="col-span-2">
            <Label>SKU Name (Multi Select)</Label>
            <div className="flex flex-wrap gap-3 rounded-md border p-3">
              {skus.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={(f.skuIds ?? []).includes(s.id)} onCheckedChange={() => toggleSku(s.id)} />
                  {s.name}
                </label>
              ))}
              {skus.length === 0 && <span className="text-xs text-muted-foreground">No SKUs available</span>}
            </div>
          </div>
          <div className="col-span-2">
            <Label>BO Details</Label>
            <Textarea rows={3} value={f.boDetails ?? ""} onChange={(e) => setF({ ...f, boDetails: e.target.value })} />
          </div>
          <div>
            <Label>BO Probability</Label>
            <SearchableSelect value={f.boProbability ?? ""} onValueChange={(v) => setF({ ...f, boProbability: v as BOProbability })}
              options={BO_PROBABILITIES.map((p) => ({ value: p, label: p }))} placeholder="Select Probability" />
          </div>
          <div>
            <Label>Expected Closure Date *</Label>
            <Input type="date" value={f.expectedClosureDate ?? ""} onChange={(e) => setF({ ...f, expectedClosureDate: e.target.value })} />
          </div>
          <div>
            <Label>Proposal Date</Label>
            <Input type="date" value={f.proposalDate ?? ""} onChange={(e) => setF({ ...f, proposalDate: e.target.value })} />
          </div>
          <div>
            <Label>BO Closing Date</Label>
            <Input type="date" value={f.boClosingDate ?? ""} onChange={(e) => setF({ ...f, boClosingDate: e.target.value })} />
          </div>
          <div>
            <Label>Estimated 1st Year Value</Label>
            <Input value={f.estimatedFirstYearValue ?? ""} onChange={(e) => setF({ ...f, estimatedFirstYearValue: e.target.value })} placeholder="e.g. 25,00,000" />
          </div>
          <div>
            <Label>Total Contract Value</Label>
            <Input value={f.totalContractValue ?? ""} onChange={(e) => setF({ ...f, totalContractValue: e.target.value })} placeholder="e.g. 75,00,000" />
          </div>
          <div className="col-span-2">
            <Label>Remarks</Label>
            <Textarea rows={2} value={f.remarks ?? ""} onChange={(e) => setF({ ...f, remarks: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>Documents (PDF, Excel, PowerPoint, Word — max 25 MB each, 100 MB total)</Label>
            <Input type="file" multiple accept={ALLOWED.join(",")} onChange={(e) => handleFiles(e.target.files)} />
            {pendingDocs.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                {pendingDocs.length} file(s) staged: {pendingDocs.map((f) => f.name).join(", ")}
              </div>
            )}
          </div>
          <div className="col-span-2 rounded-md bg-muted p-3 text-xs">
            <span className="text-muted-foreground">User Name:</span> <span className="font-medium">{me.fullName}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}><Upload className="mr-2 h-4 w-4" />{editing ? "Update" : "Save BO"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}