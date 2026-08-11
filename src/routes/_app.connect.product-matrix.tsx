import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, CheckCircle2, Clock, Ban, Layers, Search, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/crm/PageHeader";
import { SearchableSelect } from "@/components/crm/SearchableSelect";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { useCrm, newId, nowIso, nextEngRef, type Engagement } from "@/lib/crm-store";

export const Route = createFileRoute("/_app/connect/product-matrix")({ component: PM });

type Row = { sgId: string; sgName: string; skuId: string; skuName: string; domainId: string; domainName: string };

function PM() {
  const { accounts, simple, contacts, users, currentUserId, engagements, opportunities, addEngagement, addHistory } = useCrm();
  const activeAccounts = accounts.filter((a) => a.active);
  const [accountId, setAccountId] = useState(activeAccounts[0]?.id ?? "");
  const me = users.find((u) => u.id === currentUserId)!;

  const account = accounts.find((a) => a.id === accountId);
  const used = useMemo<Row[]>(() => {
    if (!account) return [];
    const usedTokens = account.solutionUsed.split(/[,;]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    const rows: Row[] = [];
    simple["solution-group"].forEach((sg, idx) => {
      if (usedTokens.some((t) => sg.name.toLowerCase().includes(t) || t.includes(sg.name.toLowerCase()))) {
        const sku = simple["sku-name"][idx % simple["sku-name"].length];
        const dom = simple.domain[idx % simple.domain.length];
        rows.push({ sgId: sg.id, sgName: sg.name, skuId: sku.id, skuName: sku.name, domainId: dom.id, domainName: dom.name });
      }
    });
    return rows;
  }, [account, simple]);

  const available = useMemo<Row[]>(() => {
    const usedSgIds = new Set(used.map((u) => u.sgId));
    const rows: Row[] = [];
    simple["solution-group"].forEach((sg, idx) => {
      if (usedSgIds.has(sg.id)) return;
      const sku = simple["sku-name"][idx % simple["sku-name"].length];
      const dom = simple.domain[idx % simple.domain.length];
      rows.push({ sgId: sg.id, sgName: sg.name, skuId: sku.id, skuName: sku.name, domainId: dom.id, domainName: dom.name });
    });
    return rows;
  }, [used, simple]);

  // ----- Applicability (per account+sku, local state) -----
  // Default: every available SKU is Applicable until user marks it Not Applicable.
  const [notApplicable, setNotApplicable] = useState<Set<string>>(new Set());
  const keyOf = (r: Row) => `${accountId}::${r.skuId}`;
  const isApplicable = (r: Row) => !notApplicable.has(keyOf(r));
  const toggleApplicability = (r: Row, makeApplicable: boolean) => {
    setNotApplicable((p) => {
      const n = new Set(p);
      const k = keyOf(r);
      if (makeApplicable) n.delete(k); else n.add(k);
      return n;
    });
  };

  // ----- In Progress detection: account-scoped active engagement/opportunity containing this SKU/SG -----
  const inProgressSkuIds = useMemo(() => {
    const set = new Set<string>();
    engagements.forEach((e) => {
      if (e.accountId !== accountId) return;
      if (e.status === "Completed" || e.status === "Cancelled") return;
      e.skuIds.forEach((s) => set.add(s));
    });
    return set;
  }, [engagements, accountId]);
  const inProgressSgIds = useMemo(() => {
    const set = new Set<string>();
    opportunities.forEach((o) => {
      if (o.accountId !== accountId) return;
      if (["Completed", "Cancelled", "Converted"].includes(String(o.statusName))) return;
      if (o.solutionGroupId) set.add(o.solutionGroupId);
    });
    return set;
  }, [opportunities, accountId]);
  const isInProgress = (r: Row) => inProgressSkuIds.has(r.skuId) || inProgressSgIds.has(r.sgId);

  // Search + filters
  const [query, setQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("__all");
  const [sgFilter, setSgFilter] = useState<string>("__all");
  const matches = (r: Row) => {
    const q = query.trim().toLowerCase();
    if (q && !(
      r.domainName.toLowerCase().includes(q) ||
      r.sgName.toLowerCase().includes(q) ||
      r.skuName.toLowerCase().includes(q)
    )) return false;
    if (domainFilter !== "__all" && r.domainId !== domainFilter) return false;
    if (sgFilter !== "__all" && r.sgId !== sgFilter) return false;
    return true;
  };

  // Applicable tab = applicable & NOT in progress (in-progress lives in its own tab)
  const applicableRows = available.filter((r) => isApplicable(r) && !isInProgress(r) && matches(r));
  const notApplicableRows = available.filter((r) => !isApplicable(r) && matches(r));
  const inProgressRows = available.filter((r) => isApplicable(r) && isInProgress(r) && matches(r));

  // KPI counts (across all available, not filtered)
  const kpiApplicable = available.filter((r) => isApplicable(r) && !isInProgress(r)).length;
  const kpiNotApplicable = available.filter((r) => !isApplicable(r)).length;
  const kpiInProgress = available.filter((r) => isApplicable(r) && isInProgress(r)).length;

  // Group helper by domain → SG cards
  const groupByDomain = (rows: Row[]) => {
    const map = new Map<string, { domainName: string; rows: Row[] }>();
    rows.forEach((r) => {
      const cur = map.get(r.domainId) ?? { domainName: r.domainName, rows: [] };
      cur.rows.push(r);
      map.set(r.domainId, cur);
    });
    return Array.from(map.entries());
  };

  // Find the active engagement for a given SKU within the current account.
  const activeEngagementForSku = (skuId: string) =>
    engagements.find(
      (e) =>
        e.accountId === accountId &&
        e.status !== "Completed" &&
        e.status !== "Cancelled" &&
        e.skuIds.includes(skuId),
    );

  const activeUsers = users.filter((u) => u.active);
  const [engOpen, setEngOpen] = useState(false);
  // When opened for a single SKU via per-card button, this holds the row(s) being planned.
  const [engRows, setEngRows] = useState<Row[]>([]);
  const [existingOpen, setExistingOpen] = useState(false);
  const [viewEng, setViewEng] = useState<Engagement | null>(null);
  const [engF, setEngF] = useState({
    accountId: "",
    contactId: "",
    domainId: "",
    solutionGroupId: "",
    skuIds: [] as string[],
    callTypeId: "",
    plannedDate: "",
    jointPresenter: "",
    plannedType: "Planned" as "Planned" | "Unplanned",
    assignedToUserId: currentUserId,
  });

  useEffect(() => {
    if (engOpen && account) {
      const con = contacts.find((c) => c.accountId === account.id && c.active);
      const rows = engRows;
      const firstRow = rows[0];
      setEngF({
        accountId: account.id,
        contactId: con?.id ?? "",
        domainId: firstRow?.domainId ?? simple.domain[0]?.id ?? "",
        solutionGroupId: firstRow?.sgId ?? simple["solution-group"][0]?.id ?? "",
        skuIds: rows.map((r) => r.skuId),
        callTypeId: simple["call-type"].find((d) => d.active)?.id ?? "",
        plannedDate: "",
        jointPresenter: "",
        plannedType: "Planned",
        assignedToUserId: currentUserId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engOpen]);

  const openEngagementFor = (rows: Row[]) => {
    if (rows.length === 0) return;
    setEngRows(rows);
    setEngOpen(true);
  };

  const saveEngagement = () => {
    if (!engF.accountId || !engF.contactId || !engF.plannedDate) {
      return toast.error("Account, Contact, Planned Date required");
    }
    // 1 engagement per SKU
    const ids = engF.skuIds.length > 0 ? engF.skuIds : [""];
    const refs: string[] = [];
    ids.forEach((skuId) => {
      const refNo = nextEngRef();
      refs.push(refNo);
      const e: Engagement = {
        id: newId(),
        refNo,
        accountId: engF.accountId,
        contactId: engF.contactId,
        domainId: engF.domainId,
        solutionGroupId: engF.solutionGroupId,
        skuIds: skuId ? [skuId] : [],
        callTypeId: engF.callTypeId,
        plannedDate: new Date(engF.plannedDate).toISOString(),
        jointPresenter: engF.jointPresenter,
        plannedType: engF.plannedType,
        assignedToUserId: engF.assignedToUserId,
        ownerUserId: currentUserId,
        assignedByUserId: currentUserId,
        assignedDate: nowIso(),
        status: "Planned",
        rescheduleHistory: [],
      };
      addEngagement(e);
      addHistory({
        recordType: "Engagement",
        refNo,
        action: "Created from Product Matrix",
        actionBy: me.fullName,
        actionDate: nowIso(),
        toUserId: engF.assignedToUserId,
      });
    });
    toast.success(
      refs.length === 1 ? `Engagement ${refs[0]} planned` : `${refs.length} engagements planned`,
    );
    setEngOpen(false);
    setEngRows([]);
  };

  // Tab state
  const [tab, setTab] = useState<"applicable" | "not-applicable" | "in-progress">("applicable");

  return (
    <div className="pb-8">
      <PageHeader title="Product Matrix" description="Mark SKUs applicable per account and plan engagements for the right opportunities." />

      {/* Top: account selector + summary cards */}
      <div className="mb-4 rounded-lg border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <Label>Account</Label>
            <SearchableSelect value={accountId} onValueChange={(v) => { setAccountId(v); setQuery(""); setDomainFilter("__all"); setSgFilter("__all"); }}
              options={activeAccounts.map((a) => ({ value: a.id, label: a.name }))} />
            {account && (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{account.address || account.city || "—"}</p>
            )}
          </div>
          <button type="button" onClick={() => setExistingOpen(true)} className="text-left">
            <Kpi icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Existing SKUs" value={used.length} tone="green" hoverable hint="Click to view list" />
          </button>
          <Kpi icon={<Layers className="h-3.5 w-3.5" />} label="Available SKUs" value={available.length} tone="primary" />
          <Kpi icon={<Layers className="h-3.5 w-3.5" />} label="Total Marked" value={kpiNotApplicable + kpiInProgress + kpiApplicable} tone="muted" />
        </div>
      </div>

      {/* Search + filters */}
      <div className="mb-3 grid gap-3 md:grid-cols-4">
        <div className="md:col-span-2 relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Domain, Solution Group or SKU…"
            className="h-9 pl-8"
          />
        </div>
        <div>
          <SearchableSelect
            value={domainFilter}
            onValueChange={setDomainFilter}
            placeholder="All Domains"
            options={[{ value: "__all", label: "All Domains" }, ...simple.domain.filter((d) => d.active).map((d) => ({ value: d.id, label: d.name }))]}
          />
        </div>
        <div>
          <SearchableSelect
            value={sgFilter}
            onValueChange={setSgFilter}
            placeholder="All Solution Groups"
            options={[{ value: "__all", label: "All Solution Groups" }, ...simple["solution-group"].filter((d) => d.active).map((d) => ({ value: d.id, label: d.name }))]}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="applicable" className="gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Applicable
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700">{kpiApplicable}</Badge>
          </TabsTrigger>
          <TabsTrigger value="not-applicable" className="gap-2">
            <Ban className="h-3.5 w-3.5 text-muted-foreground" /> Not Applicable
            <Badge variant="secondary" className="bg-muted text-muted-foreground">{kpiNotApplicable}</Badge>
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="gap-2">
            <Clock className="h-3.5 w-3.5 text-amber-600" /> In Progress
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-700">{kpiInProgress}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Applicable */}
        <TabsContent value="applicable">
          <div className="rounded-lg border bg-card">
            <div className="space-y-4 p-3">
              {applicableRows.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">No applicable SKUs match your filters.</div>
              )}
              {groupByDomain(applicableRows).map(([dId, g]) => (
                <div key={dId}>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.domainName}</div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {g.rows.map((r) => (
                      <div key={`${r.sgId}::${r.skuId}`} className="flex flex-col gap-2 rounded-md border p-3 transition-colors hover:bg-accent/30">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium line-clamp-1">{r.sgName}</div>
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 text-[10px]">Applicable</Badge>
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{r.skuName} · {r.domainName}</div>
                        </div>
                        <div className="flex items-center justify-between gap-2 border-t pt-2">
                          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                            <Switch checked={false} onCheckedChange={() => toggleApplicability(r, false)} />
                            Mark Not Applicable
                          </label>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => openEngagementFor([r])}
                          >
                            <Plus className="mr-1 h-3 w-3" />Create Engagement
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Not Applicable */}
        <TabsContent value="not-applicable">
          <div className="rounded-lg border bg-card">
            <div className="space-y-4 p-3">
              {notApplicableRows.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">No SKUs marked as not applicable.</div>
              )}
              {groupByDomain(notApplicableRows).map(([dId, g]) => (
                <div key={dId}>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.domainName}</div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {g.rows.map((r) => (
                      <div key={`${r.sgId}::${r.skuId}`} className="flex flex-col gap-2 rounded-md border border-dashed bg-muted/20 p-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium line-clamp-1 text-muted-foreground">{r.sgName}</div>
                            <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px]">
                              <Ban className="mr-1 h-3 w-3" />Not Applicable
                            </Badge>
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{r.skuName} · {r.domainName}</div>
                        </div>
                        <div className="flex items-center justify-between gap-2 border-t pt-2">
                          <span className="text-[11px] text-muted-foreground">Currently inactive</span>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toggleApplicability(r, true)}>
                            <RotateCcw className="mr-1 h-3 w-3" />Mark Available
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* In Progress */}
        <TabsContent value="in-progress">
          <div className="rounded-lg border bg-card">
            <div className="space-y-4 p-3">
              {inProgressRows.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">No SKUs with in-progress engagements.</div>
              )}
              {groupByDomain(inProgressRows).map(([dId, g]) => (
                <div key={dId}>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.domainName}</div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {g.rows.map((r) => {
                      const eng = activeEngagementForSku(r.skuId);
                      return (
                        <div key={`${r.sgId}::${r.skuId}`} className="flex flex-col gap-2 rounded-md border bg-amber-500/5 p-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium line-clamp-1">{r.sgName}</div>
                              <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 text-[10px]">
                                <Clock className="mr-1 h-3 w-3" />In Progress
                              </Badge>
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{r.skuName} · {r.domainName}</div>
                            {eng && (
                              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                                <span className="font-mono">{eng.refNo}</span>
                                <StatusBadge status={eng.status} />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-end gap-2 border-t pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled={!eng}
                              onClick={() => eng && setViewEng(eng)}
                            >
                              <Eye className="mr-1 h-3 w-3" />View Engagement
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Existing SKUs popup */}
      <Dialog open={existingOpen} onOpenChange={setExistingOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Existing SKUs {account ? `· ${account.name}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2 max-h-[60vh] overflow-y-auto">
            {used.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">No existing SKUs for this account.</div>}
            {used.map((r) => (
              <div key={r.sgId + r.skuId} className="flex items-start justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2">
                <div>
                  <div className="text-sm font-medium">{r.sgName}</div>
                  <div className="text-xs text-muted-foreground">{r.skuName} · {r.domainName}</div>
                </div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-700"><CheckCircle2 className="mr-1 h-3 w-3" />Used</Badge>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setExistingOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Engagement popup */}
      <Dialog open={!!viewEng} onOpenChange={(o) => { if (!o) setViewEng(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Engagement {viewEng?.refNo}</DialogTitle>
          </DialogHeader>
          {viewEng && (
            <div className="grid grid-cols-2 gap-3 py-2 text-sm">
              <Field label="Status"><StatusBadge status={viewEng.status} /></Field>
              <Field label="Planned Type">{viewEng.plannedType}</Field>
              <Field label="Account">{accounts.find((a) => a.id === viewEng.accountId)?.name ?? "—"}</Field>
              <Field label="Contact">{contacts.find((c) => c.id === viewEng.contactId)?.contactName ?? "—"}</Field>
              <Field label="Domain">{simple.domain.find((d) => d.id === viewEng.domainId)?.name ?? "—"}</Field>
              <Field label="Solution Group">{simple["solution-group"].find((d) => d.id === viewEng.solutionGroupId)?.name ?? "—"}</Field>
              <Field label="SKU(s)">{viewEng.skuIds.map((s) => simple["sku-name"].find((x) => x.id === s)?.name).filter(Boolean).join(", ") || "—"}</Field>
              <Field label="Call Type">{simple["call-type"].find((d) => d.id === viewEng.callTypeId)?.name ?? "—"}</Field>
              <Field label="Planned Date">{viewEng.plannedDate ? new Date(viewEng.plannedDate).toLocaleString() : "—"}</Field>
              <Field label="Assigned To">{users.find((u) => u.id === viewEng.assignedToUserId)?.fullName ?? "—"}</Field>
              <Field label="Joint Presenter">{viewEng.jointPresenter || "—"}</Field>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewEng(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={engOpen} onOpenChange={(o) => { setEngOpen(o); if (!o) setEngRows([]); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Create Engagement
            </DialogTitle>
          </DialogHeader>
          {account && engRows.length > 0 && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <div className="text-xs text-muted-foreground">
                Selected SKU
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {engRows.map((r) => (
                  <Badge key={`${r.sgId}::${r.skuId}`} variant="secondary" className="text-[10px]">
                    {r.sgName} · {r.skuName}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 py-2">
            <div>
              <Label>Account</Label>
              <SearchableSelect value={engF.accountId} onValueChange={(v) => setEngF({ ...engF, accountId: v })}
                options={accounts.filter((a) => a.active).map((a) => ({ value: a.id, label: a.name }))} />
            </div>
            <div>
              <Label>Contact</Label>
              <SearchableSelect value={engF.contactId} onValueChange={(v) => setEngF({ ...engF, contactId: v })}
                options={contacts.filter((c) => c.active && c.accountId === engF.accountId).map((c) => ({ value: c.id, label: c.contactName }))} />
            </div>
            <div>
              <Label>Domain</Label>
              <SearchableSelect value={engF.domainId} onValueChange={(v) => setEngF({ ...engF, domainId: v })}
                options={simple.domain.filter((d) => d.active).map((d) => ({ value: d.id, label: d.name }))} />
            </div>
            <div>
              <Label>Solution Group</Label>
              <SearchableSelect value={engF.solutionGroupId} onValueChange={(v) => setEngF({ ...engF, solutionGroupId: v })}
                options={simple["solution-group"].filter((d) => d.active).map((d) => ({ value: d.id, label: d.name }))} />
            </div>
            <div>
              <Label>Call Type</Label>
              <SearchableSelect value={engF.callTypeId} onValueChange={(v) => setEngF({ ...engF, callTypeId: v })}
                options={simple["call-type"].filter((d) => d.active).map((d) => ({ value: d.id, label: d.name }))} />
            </div>
            <div>
              <Label>Planned / Unplanned</Label>
              <SearchableSelect value={engF.plannedType} onValueChange={(v) => setEngF({ ...engF, plannedType: v as "Planned" | "Unplanned" })}
                options={[{ value: "Planned", label: "Planned" }, { value: "Unplanned", label: "Unplanned" }]} />
            </div>
            <div><Label>Planned Date/Time</Label><Input type="datetime-local" value={engF.plannedDate} onChange={(e) => setEngF({ ...engF, plannedDate: e.target.value })} /></div>
            <div><Label>Joint Presenter</Label><Input value={engF.jointPresenter} onChange={(e) => setEngF({ ...engF, jointPresenter: e.target.value })} /></div>
            <div className="col-span-2">
              <Label>Assigned To</Label>
              <SearchableSelect value={engF.assignedToUserId} onValueChange={(v) => setEngF({ ...engF, assignedToUserId: v })}
                options={activeUsers.map((u) => ({ value: u.id, label: u.fullName }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEngOpen(false)}>Cancel</Button>
            <Button onClick={saveEngagement}>Save Engagement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({
  icon, label, value, tone, hoverable, hint,
}: {
  icon: React.ReactNode; label: string; value: number;
  tone: "green" | "primary" | "emerald" | "amber" | "muted";
  hoverable?: boolean; hint?: string;
}) {
  const toneCls: Record<string, string> = {
    green: "text-green-600",
    primary: "text-primary",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    muted: "text-muted-foreground",
  };
  return (
    <div className={`rounded-md border p-3 ${hoverable ? "transition-colors hover:bg-accent/40 cursor-pointer" : ""}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${toneCls[tone]}`}>{value}</div>
      {hint && <div className="mt-0.5 text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}