import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/crm/PageHeader";
import { BoFormDialog } from "@/components/crm/BoFormDialog";
import { useCrm, fmtDate, fmtDateOnly, fmtSize } from "@/lib/crm-store";

export const Route = createFileRoute("/_app/bo/listing")({
  head: () => ({ meta: [{ title: "Business Opening — CRM Solution" }] }),
  component: BoPage,
});

function BoPage() {
  const {
    businessOpenings, accounts, contacts, simple, users,
    boDocs,
  } = useCrm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  const view = viewing ? businessOpenings.find((b) => b.id === viewing) : null;

  return (
    <div>
      <PageHeader
        title="Business Opening"
        description="Qualified opportunities converted into Business Openings."
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Add New
          </Button>
        }
      />

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>BO ID</TableHead>
              <TableHead>Solution Group</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>BO Stage</TableHead>
              <TableHead>Estimated 1 Year CV</TableHead>
              <TableHead>Total Contract Value</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created On</TableHead>
              <TableHead className="w-20">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {businessOpenings.map((b) => {
              const acc = accounts.find((a) => a.id === b.accountId);
              return (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.boId}</TableCell>
                  <TableCell className="text-xs">{simple["solution-group"].find((x) => x.id === b.solutionGroupId)?.name}</TableCell>
                  <TableCell>{acc?.name}</TableCell>
                  <TableCell className="text-xs">{simple["bo-stage"].find((x) => x.id === b.boStageId)?.name}</TableCell>
                  <TableCell className="text-xs">{b.estimatedFirstYearValue || "-"}</TableCell>
                  <TableCell className="text-xs">{b.totalContractValue || "-"}</TableCell>
                  <TableCell className="text-xs">{users.find((u) => u.id === b.ownerUserId)?.fullName}</TableCell>
                  <TableCell className="text-xs">{fmtDateOnly(b.boCreationDate)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(b.id); setOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {businessOpenings.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                  No business openings yet. Convert an Opportunity to BO or click "Add New".
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <BoFormDialog
        open={open}
        editingId={editing}
        onClose={() => { setOpen(false); setEditing(null); }}
      />

      <Dialog open={!!view} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>BO Details — {view?.boId}</DialogTitle></DialogHeader>
          {view && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Account" value={accounts.find((a) => a.id === view.accountId)?.name} />
                <Field label="Contact" value={contacts.find((c) => c.id === view.contactId)?.contactName} />
                <Field label="Source" value={simple["bo-source"].find((x) => x.id === view.boSourceId)?.name} />
                <Field label="Stage" value={simple["bo-stage"].find((x) => x.id === view.boStageId)?.name} />
                <Field label="Type" value={simple["bo-type"].find((x) => x.id === view.boTypeId)?.name} />
                <Field label="Probability" value={view.boProbability} />
                <Field label="Domain" value={simple.domain.find((x) => x.id === view.domainId)?.name} />
                <Field label="Solution Group" value={simple["solution-group"].find((x) => x.id === view.solutionGroupId)?.name} />
                <Field label="SKU" value={view.skuIds.map((id) => simple["sku-name"].find((x) => x.id === id)?.name).filter(Boolean).join(", ")} />
                <Field label="Created" value={fmtDate(view.createdDate)} />
                <Field label="Expected Closure" value={fmtDateOnly(view.expectedClosureDate)} />
                <Field label="Proposal Date" value={fmtDateOnly(view.proposalDate)} />
                <Field label="Closing Date" value={fmtDateOnly(view.boClosingDate)} />
                <Field label="1st Year Value" value={view.estimatedFirstYearValue} />
                <Field label="Total Contract Value" value={view.totalContractValue} />
                <Field label="Created By" value={view.createdBy} />
                <Field label="Modified By" value={view.modifiedBy} />
                <Field label="Linked Opportunity" value={view.sourceOpportunityRefNo ?? "-"} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">BO Details</div>
                <div className="rounded-md bg-muted p-2 text-xs">{view.boDetails || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Remarks</div>
                <div className="rounded-md bg-muted p-2 text-xs">{view.remarks || "-"}</div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Documents</span><span><Upload className="inline h-3 w-3" /> multiple supported</span>
                </div>
                <div className="rounded-md border">
                  {boDocs.filter((d) => d.boId === view.id).length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">No documents uploaded.</div>
                  ) : (
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>File</TableHead><TableHead>Type</TableHead><TableHead>Size</TableHead><TableHead>Uploaded By</TableHead><TableHead>Uploaded</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {boDocs.filter((d) => d.boId === view.id).map((d) => (
                          <TableRow key={d.id}>
                            <TableCell className="text-xs">{d.fileName}</TableCell>
                            <TableCell className="text-xs">{d.fileType}</TableCell>
                            <TableCell className="text-xs">{fmtSize(d.fileSize)}</TableCell>
                            <TableCell className="text-xs">{d.uploadedBy}</TableCell>
                            <TableCell className="text-xs">{fmtDate(d.uploadedDate)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value || "-"}</div>
    </div>
  );
}