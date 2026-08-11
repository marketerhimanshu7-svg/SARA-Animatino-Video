import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

// ---- Types ----
export type SimpleMasterKey =
  | "account-industry"
  | "crm-services"
  | "bo-source"
  | "bo-stage"
  | "domain"
  | "solution-group"
  | "sku-name"
  | "bo-type"
  | "call-type"
  | "new-opportunity-type"
  | "new-opportunity-status"
  | "document-type"
  | "classification";

export interface SimpleMasterDef {
  key: SimpleMasterKey;
  label: string;
}

export const SIMPLE_MASTERS: SimpleMasterDef[] = [
  { key: "account-industry", label: "Account Industry Master" },
  { key: "crm-services", label: "CRM Services Master" },
  { key: "bo-source", label: "BO Source Master" },
  { key: "bo-stage", label: "BO Stage Master" },
  { key: "domain", label: "Domain Master" },
  { key: "solution-group", label: "Solution Group Master" },
  { key: "sku-name", label: "SKU Name Master" },
  { key: "bo-type", label: "BO Type Master" },
  { key: "call-type", label: "Call Type Master" },
  { key: "new-opportunity-type", label: "Opportunity Type Master" },
  { key: "new-opportunity-status", label: "Opportunity Status Master" },
  { key: "document-type", label: "Document Type Master" },
  { key: "classification", label: "Classification Master" },
];

export interface MasterRow {
  id: string;
  name: string;
  active: boolean;
  createdBy: string;
  createdDate: string;
  modifiedBy: string;
  modifiedDate: string;
}

export interface Profile {
  id: string;
  name: string;
  active: boolean;
  createdBy: string;
  createdDate: string;
  modifiedBy: string;
  modifiedDate: string;
}

export interface User {
  id: string;
  userName: string;
  fullName: string;
  email: string;
  mobile: string;
  location: string;
  profileId: string;
  active: boolean;
  password: string; // mock only
  createdBy: string;
  createdDate: string;
  modifiedBy: string;
  modifiedDate: string;
}

export interface Account {
  id: string;
  name: string;
  industryId: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  city: string;
  remarks: string;
  solutionUsed: string;
  ownerUserId: string;
  classificationId?: string;
  active: boolean;
  productPortfolio?: string[]; // SKU ids auto-added when a BO is Won
}

export interface Contact {
  id: string;
  accountId: string;
  salutation: string;
  contactName: string;
  department: string;
  designation: string;
  email: string;
  mobile: string;
  landline: string;
  boardNo: string;
  address: string;
  city: string;
  birthDate: string;
  anniversaryDate: string;
  workAnniversary: string;
  personalLiking: string;
  crmServiceIds: string[];
  ownerUserId: string;
  active: boolean;
}

export type EngagementStatus = "Planned" | "Pending" | "Completed" | "Cancelled" | "Rescheduled";

export interface Engagement {
  id: string;
  refNo: string;
  accountId: string;
  contactId: string;
  domainId: string;
  solutionGroupId: string;
  skuIds: string[];
  ownerUserId: string;
  callTypeId: string;
  plannedDate: string;
  jointPresenter: string;
  plannedType: "Planned" | "Unplanned";
  assignedToUserId: string;
  assignedByUserId: string;
  assignedDate: string;
  status: EngagementStatus;
  actualDate?: string;
  callDetails?: string;
  opportunityIdentified?: "Yes" | "No";
  nextActionDate?: string;
  nextActionRemarks?: string;
  rescheduleHistory: {
    oldDate: string;
    newDate: string;
    by: string;
    on: string;
    remarks: string;
  }[];
  cancellation?: { by: string; on: string; remarks: string };
  linkedOpportunityId?: string;
  parentEngagementId?: string;
}

export type OpportunityStatus =
  | "Planned"
  | "Pending"
  | "Completed"
  | "Rescheduled"
  | "Cancelled"
  | "Converted";

export interface Opportunity {
  id: string;
  refNo: string;
  accountId: string;
  contactId: string;
  domainId: string;
  solutionGroupId: string;
  opportunityTypeId: string;
  description: string;
  assignedToUserId: string;
  assignedByUserId: string;
  assignedDate: string;
  statusId: string;
  statusName: OpportunityStatus | string;
  notes: string;
  ownerUserId: string;
  nextActionDate: string;
  nextActionRemarks: string;
  source: string;
  engagementRefNo?: string;
  engagementId?: string;
  createdFrom: "Engagement" | "Direct";
  rescheduleHistory: {
    oldDate: string;
    newDate: string;
    by: string;
    on: string;
    remarks: string;
  }[];
  cancellation?: { by: string; on: string; remarks: string };
  conversion?: { by: string; on: string };
  executionLog: { date: string; remarks: string; status: string; by: string }[];
}

export interface AssignmentHistoryEntry {
  id: string;
  recordType: "Engagement" | "Opportunity";
  refNo: string;
  action: string;
  fromUserId?: string;
  toUserId?: string;
  actionBy: string;
  actionDate: string;
  remarks?: string;
  oldPlannedDate?: string;
  newPlannedDate?: string;
  oldNextActionDate?: string;
  newNextActionDate?: string;
}

export interface OppComment {
  id: string;
  opportunityId: string;
  userId: string;
  userName: string;
  at: string;
  text: string;
}

export interface EngagementPlan {
  id: string;
  month: string; // YYYY-MM (kept for backward compat = fromMonth)
  fromMonth?: string; // YYYY-MM
  toMonth?: string;   // YYYY-MM
  accountId: string;
  plannedCount: number;
  remarks: string;
  createdByUserId: string;
  createdAt: string;
}

export interface KnowledgeDoc {
  id: string;
  domainId: string;
  solutionGroupId: string;
  skuId: string;
  documentTypeId: string;
  fileName: string;
  fileType: string;
  fileSize: number; // bytes
  remarks: string;
  uploadedBy: string;
  uploadedDate: string;
  modifiedBy: string;
  modifiedDate: string;
  active: boolean;
}

export interface ClientDoc {
  id: string;
  accountId: string;
  documentTypeId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  remarks: string;
  uploadedBy: string;
  uploadedDate: string;
  modifiedBy: string;
  modifiedDate: string;
  active: boolean;
}

export type ModuleKey = string;
export interface ProfileMatrixEntry {
  profileId: string;
  access: Record<ModuleKey, boolean>;
}

export const MATRIX_MODULES: { module: string; sub: string; key: string }[] = [
  ...SIMPLE_MASTERS.map((m) => ({ module: "Masters", sub: m.label, key: `masters:${m.key}` })),
  { module: "Masters", sub: "User Master", key: "masters:user" },
  { module: "Masters", sub: "Profile Master", key: "masters:profile" },
  { module: "Masters", sub: "Profile Matrix", key: "masters:profile-matrix" },
  { module: "Account", sub: "Accounts", key: "account:accounts" },
  { module: "Account", sub: "Contacts", key: "account:contacts" },
  { module: "Connect", sub: "Product Matrix", key: "connect:product-matrix" },
  { module: "Connect", sub: "Engagement Management", key: "connect:engagements" },
  { module: "Connect", sub: "Opportunity Management", key: "connect:opportunities" },
  { module: "Connect", sub: "High Level Engagement Planning", key: "connect:planning" },
  { module: "My To Do List", sub: "My Opportunity", key: "todo:opportunity" },
  { module: "My To Do List", sub: "My Engagements", key: "todo:meetings" },
  { module: "Repository", sub: "Knowledge Bank", key: "repo:knowledge" },
  { module: "Repository", sub: "Client Repository", key: "repo:client" },
  { module: "Business Opening", sub: "Dashboard", key: "bo:dashboard" },
  { module: "Business Opening", sub: "BO Management", key: "bo:listing" },
  { module: "Analytics", sub: "Engagement Report — Planned vs Actual", key: "analytics:engagement" },
  { module: "Analytics", sub: "Conversion Velocity Report", key: "analytics:velocity" },
];

export type BOProbability = "Low" | "Medium" | "High" | "Very High";
export const BO_PROBABILITIES: BOProbability[] = ["Low", "Medium", "High", "Very High"];

// ---- Product Applicability ----
export type ApplicabilityStatus = "Yes" | "No" | "Not Applicable" | "Pending";

export interface ProductApplicability {
  id: string;
  productId: string; // solution-group id (used as Product Master)
  accountId: string;
  status: ApplicabilityStatus;
  remarks: string;
  actionBy: string;
  actionDate: string;
  opportunityId?: string;
  opportunityRefNo?: string;
}

export interface BODoc {
  id: string;
  boId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedDate: string;
  modifiedBy: string;
  modifiedDate: string;
}

export interface BusinessOpening {
  id: string;
  boId: string;
  accountId: string;
  contactId: string;
  boSourceId: string;
  boCreationDate: string;
  boStageId: string;
  domainId: string;
  solutionGroupId: string;
  skuIds: string[];
  boDetails: string;
  boTypeId: string;
  boProbability: BOProbability | "";
  expectedClosureDate: string;
  proposalDate: string;
  estimatedFirstYearValue: string;
  totalContractValue: string;
  boClosingDate: string;
  remarks: string;
  ownerUserId: string;
  // traceability
  sourceOpportunityId?: string;
  sourceOpportunityRefNo?: string;
  // audit
  createdBy: string;
  createdDate: string;
  modifiedBy: string;
  modifiedDate: string;
  convertedBy?: string;
  convertedDate?: string;
  active: boolean;
}

// ---- Helpers ----
// Fixed epoch for deterministic seeds (avoid SSR/CSR hydration drift).
const SEED_NOW = "2026-06-10T09:00:00.000Z";
const dayOffset = (days: number) =>
  new Date(Date.parse(SEED_NOW) + days * 86400000).toISOString();
const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

// Sequential ref-number counters (mockup persistence: in-memory)
let _oppSeq = 2100;
let _engSeq = 1100;
let _boSeq = 3100;
export const nextOppRef = () => `OPP-${++_oppSeq}`;
export const nextEngRef = () => `ENG-${++_engSeq}`;
export const nextBoRef = () => `BO-${++_boSeq}`;

function seedMaster(names: string[], by = "admin"): MasterRow[] {
  return names.map((name) => ({
    id: uid(),
    name,
    active: true,
    createdBy: by,
    createdDate: SEED_NOW,
    modifiedBy: by,
    modifiedDate: SEED_NOW,
  }));
}

// ---- Seed data ----
const seedProfiles: Profile[] = [
  { id: "p1", name: "Administrator", active: true, createdBy: "admin", createdDate: SEED_NOW, modifiedBy: "admin", modifiedDate: SEED_NOW },
  { id: "p2", name: "Business Development Manager", active: true, createdBy: "admin", createdDate: SEED_NOW, modifiedBy: "admin", modifiedDate: SEED_NOW },
  { id: "p3", name: "Sales Representative", active: true, createdBy: "admin", createdDate: SEED_NOW, modifiedBy: "admin", modifiedDate: SEED_NOW },
];

const seedUsers: User[] = [
  { id: "u1", userName: "admin", fullName: "Aarav Sharma", email: "admin@crm.io", mobile: "+91 9876500001", location: "Mumbai", profileId: "p1", active: true, password: "admin123", createdBy: "system", createdDate: SEED_NOW, modifiedBy: "system", modifiedDate: SEED_NOW },
  { id: "u2", userName: "priya.bdm", fullName: "Priya Mehta", email: "priya@crm.io", mobile: "+91 9876500002", location: "Bengaluru", profileId: "p2", active: true, password: "priya123", createdBy: "admin", createdDate: SEED_NOW, modifiedBy: "admin", modifiedDate: SEED_NOW },
  { id: "u3", userName: "rohan.sales", fullName: "Rohan Verma", email: "rohan@crm.io", mobile: "+91 9876500003", location: "Pune", profileId: "p3", active: true, password: "rohan123", createdBy: "admin", createdDate: SEED_NOW, modifiedBy: "admin", modifiedDate: SEED_NOW },
  { id: "u4", userName: "neha.sales", fullName: "Neha Kapoor", email: "neha@crm.io", mobile: "+91 9876500004", location: "Delhi", profileId: "p3", active: true, password: "neha123", createdBy: "admin", createdDate: SEED_NOW, modifiedBy: "admin", modifiedDate: SEED_NOW },
];

const seedSimple: Record<SimpleMasterKey, MasterRow[]> = {
  "account-industry": seedMaster(["Manufacturing", "BFSI", "Retail", "Healthcare", "IT Services", "Logistics"]),
  "crm-services": seedMaster(["Lead Generation", "Account Mining", "Renewal", "Upsell", "Cross-sell"]),
  "bo-source": seedMaster(["Inbound", "Outbound", "Referral", "Partner", "Event", "Planned Engagement", "Direct Entry"]),
  "bo-stage": seedMaster(["Lead", "Qualification", "Demonstration", "Proposal", "Pushing Over The Line", "Almost There", "Won", "Lost / Cancel", "Follow-up"]),
  domain: seedMaster(["Cloud", "Cybersecurity", "Data & AI", "Digital Workspace", "Networking", "Clinical Operations", "Regulatory"]),
  "solution-group": seedMaster(["Infra Modernization", "Managed Security", "AI Solutions", "Collaboration", "SD-WAN", "CTMS", "Document Management", "eTMF"]),
  "sku-name": seedMaster(["AWS Landing Zone", "MS Sentinel SOC", "GenAI Pilot", "M365 E5", "Cisco SD-WAN", "Study Management", "eTMF"]),
  "bo-type": seedMaster(["New Logo", "Existing Account", "Strategic"]),
  "call-type": seedMaster(["Call", "Meeting", "Demo", "Follow-up", "Visit"]),
  "new-opportunity-type": seedMaster(["New Logo", "Renewal", "Expansion", "Cross-sell", "New Requirement", "Demo Request"]),
  "new-opportunity-status": seedMaster(["New", "Assigned", "In Progress", "Converted to BO", "Cancelled"]),
  "document-type": seedMaster(["Proposal", "SOW", "Case Study", "Datasheet", "Contract", "Presentation", "Product Brochure", "NDA"]),
  "classification": seedMaster(["A Class", "B Class", "C Class"]),
};

const _cls = seedSimple["classification"];
const seedAccounts: Account[] = [
  { id: "a1", name: "Acme Industries", industryId: seedSimple["account-industry"][0].id, address: "Plot 12, MIDC", phone: "+91 22 4000 1000", website: "acme.in", email: "info@acme.in", city: "Mumbai", remarks: "Strategic account", solutionUsed: "Infra Modernization, Managed Security", ownerUserId: "u2", classificationId: _cls[0].id, active: true },
  { id: "a2", name: "Zenith Bank", industryId: seedSimple["account-industry"][1].id, address: "BKC", phone: "+91 22 5000 2000", website: "zenithbank.in", email: "ops@zenithbank.in", city: "Mumbai", remarks: "BFSI compliance focus", solutionUsed: "Managed Security", ownerUserId: "u2", classificationId: _cls[0].id, active: true },
  { id: "a3", name: "Nova Retail", industryId: seedSimple["account-industry"][2].id, address: "Koramangala", phone: "+91 80 6000 3000", website: "novaretail.com", email: "tech@novaretail.com", city: "Bengaluru", remarks: "Expanding stores", solutionUsed: "SD-WAN, Collaboration", ownerUserId: "u3", classificationId: _cls[1].id, active: true },
  { id: "a4", name: "Acme Pharma Pvt. Ltd.", industryId: seedSimple["account-industry"][3].id, address: "Andheri East", phone: "+91 22 6000 4000", website: "acmepharma.in", email: "contact@acmepharma.in", city: "Mumbai", remarks: "Clinical trials focus", solutionUsed: "CTMS, Document Management", ownerUserId: "u1", classificationId: _cls[0].id, active: true },
  { id: "a5", name: "MedLife Research", industryId: seedSimple["account-industry"][3].id, address: "Whitefield", phone: "+91 80 7000 5000", website: "medliferesearch.com", email: "ops@medliferesearch.com", city: "Bengaluru", remarks: "Regulatory submissions", solutionUsed: "eTMF, CTMS", ownerUserId: "u1", classificationId: _cls[1].id, active: true },
  { id: "a6", name: "Sterling Logistics", industryId: seedSimple["account-industry"][5].id, address: "JNPT Road", phone: "+91 22 7000 6000", website: "sterlinglog.in", email: "it@sterlinglog.in", city: "Navi Mumbai", remarks: "Pan-India fleet ops", solutionUsed: "SD-WAN, Infra Modernization", ownerUserId: "u3", classificationId: _cls[2].id, active: true },
  { id: "a7", name: "Orion Tech Solutions", industryId: seedSimple["account-industry"][4].id, address: "HiTech City", phone: "+91 40 8000 7000", website: "oriontech.io", email: "hello@oriontech.io", city: "Hyderabad", remarks: "Captive R&D", solutionUsed: "AI Solutions, Collaboration", ownerUserId: "u2", classificationId: _cls[1].id, active: true },
  { id: "a8", name: "Vertex BioPharma", industryId: seedSimple["account-industry"][3].id, address: "Genome Valley", phone: "+91 40 9000 8000", website: "vertexbio.com", email: "ops@vertexbio.com", city: "Hyderabad", remarks: "Multi-site trials", solutionUsed: "CTMS, eTMF, Document Management", ownerUserId: "u1", classificationId: _cls[0].id, active: true },
  { id: "a9", name: "Helios Hospitals", industryId: seedSimple["account-industry"][3].id, address: "Anna Nagar", phone: "+91 44 4000 9000", website: "helioshospitals.in", email: "cio@helioshospitals.in", city: "Chennai", remarks: "Multi-specialty chain", solutionUsed: "Managed Security, Collaboration", ownerUserId: "u4", classificationId: _cls[1].id, active: true },
  { id: "a10", name: "Skyline Retail Group", industryId: seedSimple["account-industry"][2].id, address: "Sector 32", phone: "+91 124 5000 1000", website: "skylineretail.in", email: "tech@skylineretail.in", city: "Gurugram", remarks: "200+ outlets", solutionUsed: "SD-WAN", ownerUserId: "u3", classificationId: _cls[2].id, active: true },
];

const seedContacts: Contact[] = [
  { id: "c1", accountId: "a1", salutation: "Mr.", contactName: "Vikram Joshi", department: "IT", designation: "CIO", email: "vikram@acme.in", mobile: "+91 9000000001", landline: "", boardNo: "", address: "", city: "Mumbai", birthDate: "", anniversaryDate: "", workAnniversary: "", personalLiking: "Cricket", crmServiceIds: [seedSimple["crm-services"][0].id], ownerUserId: "u2", active: true },
  { id: "c2", accountId: "a2", salutation: "Mrs.", contactName: "Anita Rao", department: "Security", designation: "CISO", email: "anita@zenithbank.in", mobile: "+91 9000000002", landline: "", boardNo: "", address: "", city: "Mumbai", birthDate: "", anniversaryDate: "", workAnniversary: "", personalLiking: "Travel", crmServiceIds: [seedSimple["crm-services"][1].id], ownerUserId: "u2", active: true },
  { id: "c3", accountId: "a3", salutation: "Mr.", contactName: "Karan Singh", department: "IT", designation: "Head of Infra", email: "karan@novaretail.com", mobile: "+91 9000000003", landline: "", boardNo: "", address: "", city: "Bengaluru", birthDate: "", anniversaryDate: "", workAnniversary: "", personalLiking: "Tech gadgets", crmServiceIds: [], ownerUserId: "u3", active: true },
  { id: "c4", accountId: "a4", salutation: "Dr.", contactName: "Dr. Raj Mehta", department: "Clinical Ops", designation: "Director", email: "raj.mehta@acmepharma.in", mobile: "+91 9000000004", landline: "", boardNo: "", address: "", city: "Mumbai", birthDate: "", anniversaryDate: "", workAnniversary: "", personalLiking: "Golf", crmServiceIds: [], ownerUserId: "u1", active: true },
  { id: "c5", accountId: "a5", salutation: "Ms.", contactName: "Ms. Priya Shah", department: "Regulatory", designation: "Regulatory Head", email: "priya.shah@medliferesearch.com", mobile: "+91 9000000005", landline: "", boardNo: "", address: "", city: "Bengaluru", birthDate: "", anniversaryDate: "", workAnniversary: "", personalLiking: "Yoga", crmServiceIds: [], ownerUserId: "u1", active: true },
];

const seedEngagements: Engagement[] = [
  {
    id: "e1", refNo: "ENG-1001", accountId: "a1", contactId: "c1",
    domainId: seedSimple.domain[0].id, solutionGroupId: seedSimple["solution-group"][0].id,
    skuIds: [seedSimple["sku-name"][0].id], ownerUserId: "u2",
    callTypeId: seedSimple["call-type"][1].id,
    plannedDate: dayOffset(1),
    jointPresenter: "Priya Mehta", plannedType: "Planned",
    assignedToUserId: "u3", assignedByUserId: "u2", assignedDate: SEED_NOW,
    status: "Planned", rescheduleHistory: [],
  },
  {
    id: "e2", refNo: "ENG-1002", accountId: "a2", contactId: "c2",
    domainId: seedSimple.domain[1].id, solutionGroupId: seedSimple["solution-group"][1].id,
    skuIds: [seedSimple["sku-name"][1].id], ownerUserId: "u2",
    callTypeId: seedSimple["call-type"][2].id,
    plannedDate: dayOffset(2),
    jointPresenter: "", plannedType: "Planned",
    assignedToUserId: "u4", assignedByUserId: "u2", assignedDate: SEED_NOW,
    status: "Planned", rescheduleHistory: [],
  },
  {
    id: "e3", refNo: "ENG-1003", accountId: "a4", contactId: "c4",
    domainId: seedSimple.domain[5].id, solutionGroupId: seedSimple["solution-group"][5].id,
    skuIds: [seedSimple["sku-name"][5].id], ownerUserId: "u1",
    callTypeId: seedSimple["call-type"][2].id,
    plannedDate: dayOffset(1),
    jointPresenter: "", plannedType: "Planned",
    assignedToUserId: "u1", assignedByUserId: "u2", assignedDate: SEED_NOW,
    status: "Planned", rescheduleHistory: [],
    nextActionDate: dayOffset(1),
    nextActionRemarks: "Tomorrow 10:00 AM demo",
  },
  {
    id: "e4", refNo: "ENG-1004", accountId: "a5", contactId: "c5",
    domainId: seedSimple.domain[6].id, solutionGroupId: seedSimple["solution-group"][7].id,
    skuIds: [seedSimple["sku-name"][6].id], ownerUserId: "u1",
    callTypeId: seedSimple["call-type"][3].id,
    plannedDate: dayOffset(4),
    jointPresenter: "", plannedType: "Planned",
    assignedToUserId: "u1", assignedByUserId: "u2", assignedDate: SEED_NOW,
    status: "Pending", rescheduleHistory: [],
    nextActionDate: dayOffset(4),
    nextActionRemarks: "Follow-up call",
  },
  // Parent/child engagement chain to demonstrate History trail
  {
    id: "e5", refNo: "ENG-1005", accountId: "a3", contactId: "c3",
    domainId: seedSimple.domain[4].id, solutionGroupId: seedSimple["solution-group"][4].id,
    skuIds: [seedSimple["sku-name"][4].id], ownerUserId: "u3",
    callTypeId: seedSimple["call-type"][2].id,
    plannedDate: dayOffset(-10),
    jointPresenter: "Aarav Sharma", plannedType: "Planned",
    assignedToUserId: "u3", assignedByUserId: "u1", assignedDate: dayOffset(-12),
    status: "Completed", rescheduleHistory: [],
    actualDate: dayOffset(-10), callDetails: "Initial demo completed. Customer interested in pilot.",
    opportunityIdentified: "Yes",
  },
  {
    id: "e6", refNo: "ENG-1006", accountId: "a3", contactId: "c3",
    domainId: seedSimple.domain[4].id, solutionGroupId: seedSimple["solution-group"][4].id,
    skuIds: [seedSimple["sku-name"][4].id], ownerUserId: "u3",
    callTypeId: seedSimple["call-type"][3].id,
    plannedDate: dayOffset(2),
    jointPresenter: "", plannedType: "Planned",
    assignedToUserId: "u3", assignedByUserId: "u3", assignedDate: dayOffset(-10),
    status: "Planned", rescheduleHistory: [],
    parentEngagementId: "e5",
  },
];

const seedOpportunities: Opportunity[] = [
  {
    id: "o1", refNo: "OPP-2001", accountId: "a3", contactId: "c3",
    domainId: seedSimple.domain[4].id, solutionGroupId: seedSimple["solution-group"][4].id,
    opportunityTypeId: seedSimple["new-opportunity-type"][0].id,
    description: "SD-WAN rollout across 120 stores",
    assignedToUserId: "u3", assignedByUserId: "u1", assignedDate: now(),
    statusId: seedSimple["new-opportunity-status"][0].id, statusName: "Planned",
    notes: "Initial scoping done.", ownerUserId: "u3",
    nextActionDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    nextActionRemarks: "Solution presentation", source: "Outbound",
    createdFrom: "Direct", rescheduleHistory: [], executionLog: [],
  },
  {
    id: "o2", refNo: "OPP-2002", accountId: "a4", contactId: "c4",
    domainId: seedSimple.domain[5].id, solutionGroupId: seedSimple["solution-group"][5].id,
    opportunityTypeId: seedSimple["new-opportunity-type"][4].id,
    description: "CTMS implementation for clinical studies portfolio",
    assignedToUserId: "u1", assignedByUserId: "u2", assignedDate: now(),
    statusId: seedSimple["new-opportunity-status"][1].id, statusName: "Pending",
    notes: "Awaiting technical evaluation.", ownerUserId: "u1",
    nextActionDate: new Date(Date.now() + 86400000).toISOString(),
    nextActionRemarks: "Tomorrow 11:00 AM scoping call", source: "Planned Engagement",
    createdFrom: "Direct", rescheduleHistory: [], executionLog: [],
  },
  {
    id: "o3", refNo: "OPP-2003", accountId: "a5", contactId: "c5",
    domainId: seedSimple.domain[6].id, solutionGroupId: seedSimple["solution-group"][7].id,
    opportunityTypeId: seedSimple["new-opportunity-type"][5].id,
    description: "eTMF demo and pilot proposal",
    assignedToUserId: "u1", assignedByUserId: "u2", assignedDate: now(),
    statusId: seedSimple["new-opportunity-status"][0].id, statusName: "Planned",
    notes: "Regulatory team interested.", ownerUserId: "u1",
    nextActionDate: new Date(Date.now() + 4 * 86400000).toISOString(),
    nextActionRemarks: "Friday 03:00 PM demo", source: "Direct Entry",
    createdFrom: "Direct", rescheduleHistory: [], executionLog: [],
  },
];

const seedBusinessOpenings: BusinessOpening[] = [
  {
    id: "bo1", boId: "BO-3001",
    accountId: "a4", contactId: "c4",
    boSourceId: seedSimple["bo-source"][5].id,
    boCreationDate: "2026-05-15T09:30:00.000Z",
    boStageId: seedSimple["bo-stage"][2].id,
    domainId: seedSimple.domain[5].id,
    solutionGroupId: seedSimple["solution-group"][5].id,
    skuIds: [seedSimple["sku-name"][5].id],
    boDetails: "End-to-end CTMS implementation for Phase III oncology trials portfolio.",
    boTypeId: seedSimple["bo-type"][0].id,
    boProbability: "High",
    expectedClosureDate: "2026-07-30",
    proposalDate: "2026-06-05",
    estimatedFirstYearValue: "₹ 1,20,00,000",
    totalContractValue: "₹ 3,50,00,000",
    boClosingDate: "",
    remarks: "Awaiting regulatory compliance sign-off before proposal finalization.",
    ownerUserId: "u1",
    sourceOpportunityId: "o2",
    sourceOpportunityRefNo: "OPP-2002",
    createdBy: "u2", createdDate: "2026-05-15T09:30:00.000Z",
    modifiedBy: "u2", modifiedDate: "2026-06-01T11:00:00.000Z",
    convertedBy: "u2", convertedDate: "2026-05-15T09:30:00.000Z",
    active: true,
  },
  {
    id: "bo2", boId: "BO-3002",
    accountId: "a2", contactId: "c2",
    boSourceId: seedSimple["bo-source"][3].id,
    boCreationDate: "2026-04-20T14:00:00.000Z",
    boStageId: seedSimple["bo-stage"][3].id,
    domainId: seedSimple.domain[1].id,
    solutionGroupId: seedSimple["solution-group"][1].id,
    skuIds: [seedSimple["sku-name"][1].id],
    boDetails: "Managed Security Operations Center (SOC) setup with 24x7 monitoring and quarterly threat assessments.",
    boTypeId: seedSimple["bo-type"][2].id,
    boProbability: "Medium",
    expectedClosureDate: "2026-06-15",
    proposalDate: "2026-05-10",
    estimatedFirstYearValue: "₹ 85,00,000",
    totalContractValue: "₹ 2,10,00,000",
    boClosingDate: "",
    remarks: "Pricing negotiation in progress; client benchmarking against incumbent vendor.",
    ownerUserId: "u2",
    createdBy: "u2", createdDate: "2026-04-20T14:00:00.000Z",
    modifiedBy: "u2", modifiedDate: "2026-05-25T16:30:00.000Z",
    active: true,
  },
  {
    id: "bo3", boId: "BO-3003",
    accountId: "a3", contactId: "c3",
    boSourceId: seedSimple["bo-source"][1].id,
    boCreationDate: "2026-03-10T10:15:00.000Z",
    boStageId: seedSimple["bo-stage"][3].id,
    domainId: seedSimple.domain[4].id,
    solutionGroupId: seedSimple["solution-group"][4].id,
    skuIds: [seedSimple["sku-name"][4].id],
    boDetails: "SD-WAN rollout across 120 retail stores with centralized policy management and zero-touch provisioning.",
    boTypeId: seedSimple["bo-type"][0].id,
    boProbability: "Very High",
    expectedClosureDate: "2026-05-30",
    proposalDate: "2026-04-15",
    estimatedFirstYearValue: "₹ 1,50,00,000",
    totalContractValue: "₹ 4,20,00,000",
    boClosingDate: "",
    remarks: "Pilot completed successfully at 3 locations; PO expected by month-end.",
    ownerUserId: "u3",
    createdBy: "u1", createdDate: "2026-03-10T10:15:00.000Z",
    modifiedBy: "u3", modifiedDate: "2026-05-28T09:00:00.000Z",
    active: true,
  },
  {
    id: "bo4", boId: "BO-3004",
    accountId: "a5", contactId: "c5",
    boSourceId: seedSimple["bo-source"][5].id,
    boCreationDate: "2026-05-01T11:45:00.000Z",
    boStageId: seedSimple["bo-stage"][0].id,
    domainId: seedSimple.domain[6].id,
    solutionGroupId: seedSimple["solution-group"][7].id,
    skuIds: [seedSimple["sku-name"][6].id],
    boDetails: "Electronic Trial Master File (eTMF) deployment for multi-site regulatory submissions.",
    boTypeId: seedSimple["bo-type"][1].id,
    boProbability: "High",
    expectedClosureDate: "2026-08-10",
    proposalDate: "2026-06-12",
    estimatedFirstYearValue: "₹ 95,00,000",
    totalContractValue: "₹ 2,60,00,000",
    boClosingDate: "",
    remarks: "RFP response submitted; awaiting technical evaluation committee feedback.",
    ownerUserId: "u1",
    sourceOpportunityId: "o3",
    sourceOpportunityRefNo: "OPP-2003",
    createdBy: "u2", createdDate: "2026-05-01T11:45:00.000Z",
    modifiedBy: "u1", modifiedDate: "2026-06-03T14:20:00.000Z",
    convertedBy: "u2", convertedDate: "2026-05-01T11:45:00.000Z",
    active: true,
  },
  {
    id: "bo5", boId: "BO-3005",
    accountId: "a1", contactId: "c1",
    boSourceId: seedSimple["bo-source"][4].id,
    boCreationDate: "2026-01-15T08:00:00.000Z",
    boStageId: seedSimple["bo-stage"][4].id,
    domainId: seedSimple.domain[0].id,
    solutionGroupId: seedSimple["solution-group"][0].id,
    skuIds: [seedSimple["sku-name"][0].id],
    boDetails: "AWS Landing Zone and foundational infrastructure modernization for manufacturing workloads.",
    boTypeId: seedSimple["bo-type"][1].id,
    boProbability: "Very High",
    expectedClosureDate: "2026-02-28",
    proposalDate: "2026-02-05",
    estimatedFirstYearValue: "₹ 2,00,00,000",
    totalContractValue: "₹ 5,00,00,000",
    boClosingDate: "2026-03-01",
    remarks: "Contract signed and kickoff scheduled for next week.",
    ownerUserId: "u2",
    createdBy: "u2", createdDate: "2026-01-15T08:00:00.000Z",
    modifiedBy: "u2", modifiedDate: "2026-03-01T10:00:00.000Z",
    active: true,
  },
];

// Generate additional dummy BOs to populate funnel: target distribution
// Lead=18, Qualification=5, Proposal=12, Pushing Over the Line=8, Won=3, Lost=2 (total 48)
// Existing seedBusinessOpenings contribute: Lead=1, Proposal=1, Pushing=2, Won=1.
const _BO_EXTRA_DIST: [number, number][] = [
  [0, 17], // Lead
  [1, 5],  // Qualification
  [2, 11], // Proposal
  [3, 6],  // Pushing Over the Line
  [4, 2],  // Won
  [5, 2],  // Lost
];
const _BO_ACC_POOL = ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "a10"];
const _BO_USER_POOL = ["u1", "u2", "u3", "u4"];
const _accContact: Record<string, string> = { a1: "c1", a2: "c2", a3: "c3", a4: "c4", a5: "c5" };
(function generateExtraBos() {
  let n = 3100;
  _BO_EXTRA_DIST.forEach(([stageIdx, count]) => {
    for (let i = 0; i < count; i++) {
      n += 1;
      const accId = _BO_ACC_POOL[(stageIdx * 7 + i) % _BO_ACC_POOL.length];
      const conId = _accContact[accId] ?? "c1";
      const userId = _BO_USER_POOL[(stageIdx + i) % _BO_USER_POOL.length];
      const sgIdx = (stageIdx + i) % seedSimple["solution-group"].length;
      const domIdx = (stageIdx + i) % seedSimple.domain.length;
      const skuIdx = (stageIdx + i) % seedSimple["sku-name"].length;
      const typeIdx = i % seedSimple["bo-type"].length;
      const srcIdx = (i + stageIdx) % seedSimple["bo-source"].length;
      const isClosed = stageIdx === 4 || stageIdx === 5;
      const probs: BOProbability[] = ["Low", "Medium", "High", "Very High"];
      const fy = (5 + ((i * 3 + stageIdx) % 16)) * 100000;
      const tcv = fy * (2 + ((i + stageIdx) % 3));
      const createdMonth = (i + stageIdx * 2) % 6; // Jan..Jun 2026
      const createdDay = ((i * 5 + stageIdx * 3) % 27) + 1;
      const createdIso = `2026-${String(createdMonth + 1).padStart(2, "0")}-${String(createdDay).padStart(2, "0")}T10:00:00.000Z`;
      const expCloseDay = ((createdDay + 14) % 27) + 1;
      const expCloseMonth = Math.min(createdMonth + 1, 11);
      seedBusinessOpenings.push({
        id: `bo${n}`, boId: `BO-${n}`,
        accountId: accId, contactId: conId,
        boSourceId: seedSimple["bo-source"][srcIdx].id,
        boCreationDate: createdIso,
        boStageId: seedSimple["bo-stage"][stageIdx].id,
        domainId: seedSimple.domain[domIdx].id,
        solutionGroupId: seedSimple["solution-group"][sgIdx].id,
        skuIds: [seedSimple["sku-name"][skuIdx].id],
        boDetails: `Auto-generated dummy BO for ${seedSimple["bo-stage"][stageIdx].name} stage (#${n}).`,
        boTypeId: seedSimple["bo-type"][typeIdx].id,
        boProbability: probs[(stageIdx + i) % probs.length],
        expectedClosureDate: `2026-${String(expCloseMonth + 1).padStart(2, "0")}-${String(expCloseDay).padStart(2, "0")}`,
        proposalDate: `2026-${String(createdMonth + 1).padStart(2, "0")}-${String(Math.min(createdDay + 3, 28)).padStart(2, "0")}`,
        estimatedFirstYearValue: `₹ ${fy.toLocaleString("en-IN")}`,
        totalContractValue: `₹ ${tcv.toLocaleString("en-IN")}`,
        boClosingDate: isClosed ? `2026-${String(expCloseMonth + 1).padStart(2, "0")}-${String(expCloseDay).padStart(2, "0")}` : "",
        remarks: isClosed ? (stageIdx === 4 ? "Closed Won — contract signed." : "Closed Lost — opportunity dropped.") : "In progress.",
        ownerUserId: userId,
        createdBy: userId, createdDate: createdIso,
        modifiedBy: userId, modifiedDate: createdIso,
        active: true,
      });
    }
  });
})();

const seedBoDocs: BODoc[] = [
  {
    id: "bd1", boId: "bo1",
    fileName: "CTMS_BO_Proposal_v2.pdf", fileType: "pdf",
    fileSize: Math.round(3.4 * 1024 * 1024),
    uploadedBy: "u2", uploadedDate: "2026-05-20T10:00:00.000Z",
    modifiedBy: "u2", modifiedDate: "2026-05-20T10:00:00.000Z",
  },
  {
    id: "bd2", boId: "bo1",
    fileName: "AcmePharma_Technical_SOW.docx", fileType: "docx",
    fileSize: Math.round(1.2 * 1024 * 1024),
    uploadedBy: "u1", uploadedDate: "2026-05-25T14:30:00.000Z",
    modifiedBy: "u1", modifiedDate: "2026-05-25T14:30:00.000Z",
  },
  {
    id: "bd3", boId: "bo2",
    fileName: "Zenith_SOC_Pricing.xlsx", fileType: "xlsx",
    fileSize: Math.round(0.9 * 1024 * 1024),
    uploadedBy: "u2", uploadedDate: "2026-05-12T09:15:00.000Z",
    modifiedBy: "u2", modifiedDate: "2026-05-12T09:15:00.000Z",
  },
  {
    id: "bd4", boId: "bo3",
    fileName: "Nova_SD-WAN_Pilot_Report.pptx", fileType: "pptx",
    fileSize: Math.round(6.7 * 1024 * 1024),
    uploadedBy: "u3", uploadedDate: "2026-04-20T11:00:00.000Z",
    modifiedBy: "u3", modifiedDate: "2026-04-20T11:00:00.000Z",
  },
  {
    id: "bd5", boId: "bo4",
    fileName: "MedLife_eTMF_RFP_Response.pdf", fileType: "pdf",
    fileSize: Math.round(4.8 * 1024 * 1024),
    uploadedBy: "u1", uploadedDate: "2026-06-02T16:45:00.000Z",
    modifiedBy: "u1", modifiedDate: "2026-06-02T16:45:00.000Z",
  },
  {
    id: "bd6", boId: "bo5",
    fileName: "Acme_AWS_Signed_Contract.pdf", fileType: "pdf",
    fileSize: Math.round(2.5 * 1024 * 1024),
    uploadedBy: "u2", uploadedDate: "2026-02-28T12:00:00.000Z",
    modifiedBy: "u2", modifiedDate: "2026-02-28T12:00:00.000Z",
  },
];

const seedKnowledgeDocs: KnowledgeDoc[] = [
  {
    id: "kd1",
    domainId: seedSimple.domain[5].id, solutionGroupId: seedSimple["solution-group"][5].id,
    skuId: seedSimple["sku-name"][5].id,
    documentTypeId: seedSimple["document-type"][6].id,
    fileName: "CTMS_Product_Brochure.pdf", fileType: "pdf",
    fileSize: Math.round(4.2 * 1024 * 1024),
    remarks: "Latest product brochure",
    uploadedBy: "admin", uploadedDate: now(), modifiedBy: "admin", modifiedDate: now(), active: true,
  },
  {
    id: "kd2",
    domainId: seedSimple.domain[6].id, solutionGroupId: seedSimple["solution-group"][6].id,
    skuId: seedSimple["sku-name"][6].id,
    documentTypeId: seedSimple["document-type"][5].id,
    fileName: "eTMF_Solution_Deck.pptx", fileType: "pptx",
    fileSize: Math.round(8.5 * 1024 * 1024),
    remarks: "Customer-facing solution deck",
    uploadedBy: "admin", uploadedDate: now(), modifiedBy: "admin", modifiedDate: now(), active: true,
  },
];

const seedClientDocs: ClientDoc[] = [
  {
    id: "cd1", accountId: "a4",
    documentTypeId: seedSimple["document-type"][7].id,
    fileName: "Acme_NDA.pdf", fileType: "pdf",
    fileSize: Math.round(2.1 * 1024 * 1024),
    remarks: "Signed NDA",
    uploadedBy: "rohan.sales", uploadedDate: now(), modifiedBy: "rohan.sales", modifiedDate: now(), active: true,
  },
  {
    id: "cd2", accountId: "a5",
    documentTypeId: seedSimple["document-type"][0].id,
    fileName: "MedLife_CTMS_Proposal.docx", fileType: "docx",
    fileSize: Math.round(1.8 * 1024 * 1024),
    remarks: "Initial proposal",
    uploadedBy: "priya.bdm", uploadedDate: now(), modifiedBy: "priya.bdm", modifiedDate: now(), active: true,
  },
];

function defaultMatrix(): ProfileMatrixEntry[] {
  return seedProfiles.map((p) => ({
    profileId: p.id,
    access: Object.fromEntries(MATRIX_MODULES.map((m) => [m.key, p.name === "Administrator"])),
  }));
}

// ---- Store ----
interface CrmState {
  currentUserId: string;
  setCurrentUserId: (id: string) => void;
  users: User[];
  profiles: Profile[];
  simple: Record<SimpleMasterKey, MasterRow[]>;
  matrix: ProfileMatrixEntry[];
  accounts: Account[];
  contacts: Contact[];
  engagements: Engagement[];
  opportunities: Opportunity[];
  history: AssignmentHistoryEntry[];
  knowledgeDocs: KnowledgeDoc[];
  clientDocs: ClientDoc[];
  businessOpenings: BusinessOpening[];
  boDocs: BODoc[];
  applicability: ProductApplicability[];
  oppComments: OppComment[];
  engagementPlans: EngagementPlan[];
  commentReads: Record<string, string>;

  setSimple: (key: SimpleMasterKey, rows: MasterRow[]) => void;
  upsertSimple: (key: SimpleMasterKey, row: MasterRow) => string | null;
  toggleSimpleActive: (key: SimpleMasterKey, id: string) => void;

  upsertUser: (u: User) => string | null;
  toggleUserActive: (id: string) => void;

  upsertProfile: (p: Profile) => string | null;
  toggleProfileActive: (id: string) => void;

  saveMatrix: (entry: ProfileMatrixEntry) => void;

  upsertAccount: (a: Account) => string | null;
  toggleAccountActive: (id: string) => void;

  upsertContact: (c: Contact) => string | null;
  toggleContactActive: (id: string) => void;

  addEngagement: (e: Engagement) => void;
  updateEngagement: (id: string, patch: Partial<Engagement>) => void;

  addOpportunity: (o: Opportunity) => void;
  updateOpportunity: (id: string, patch: Partial<Opportunity>) => void;

  addHistory: (h: Omit<AssignmentHistoryEntry, "id">) => void;

  addKnowledgeDoc: (d: KnowledgeDoc) => void;
  updateKnowledgeDoc: (id: string, patch: Partial<KnowledgeDoc>) => void;
  addClientDoc: (d: ClientDoc) => void;
  updateClientDoc: (id: string, patch: Partial<ClientDoc>) => void;

  addBusinessOpening: (bo: BusinessOpening) => void;
  updateBusinessOpening: (id: string, patch: Partial<BusinessOpening>) => void;
  addBoDoc: (d: BODoc) => void;

  upsertApplicability: (rows: ProductApplicability[]) => void;

  addOppComment: (opportunityId: string, text: string) => void;
  markOppCommentsRead: (opportunityId: string) => void;
  unreadOppCommentsCount: (opportunityId: string) => number;
  addEngagementPlan: (plan: Omit<EngagementPlan, "id" | "createdByUserId" | "createdAt">) => void;
  updateEngagementPlan: (id: string, patch: Partial<EngagementPlan>) => void;

  validateCredentials: (userName: string, password: string) => boolean;
}

const Ctx = createContext<CrmState | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState("u1");
  const [users, setUsers] = useState<User[]>(seedUsers);
  const [profiles, setProfiles] = useState<Profile[]>(seedProfiles);
  const [simple, setSimpleState] = useState<Record<SimpleMasterKey, MasterRow[]>>(seedSimple);
  const [matrix, setMatrix] = useState<ProfileMatrixEntry[]>(defaultMatrix());
  const [accounts, setAccounts] = useState<Account[]>(seedAccounts);
  const [contacts, setContacts] = useState<Contact[]>(seedContacts);
  const [engagements, setEngagements] = useState<Engagement[]>(seedEngagements);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(seedOpportunities);
  const [history, setHistory] = useState<AssignmentHistoryEntry[]>([]);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>(seedKnowledgeDocs);
  const [clientDocs, setClientDocs] = useState<ClientDoc[]>(seedClientDocs);
  const [businessOpenings, setBusinessOpenings] = useState<BusinessOpening[]>(seedBusinessOpenings);
  const [boDocs, setBoDocs] = useState<BODoc[]>(seedBoDocs);
  const [applicability, setApplicability] = useState<ProductApplicability[]>([]);
  const [oppComments, setOppComments] = useState<OppComment[]>([
    { id: uid(), opportunityId: "o1", userId: "u1", userName: "Aarav Sharma", at: "2026-06-05T10:15:00.000Z", text: "Customer asked for revised commercials." },
    { id: uid(), opportunityId: "o1", userId: "u3", userName: "Rohan Verma", at: "2026-06-06T14:00:00.000Z", text: "Shared updated proposal — awaiting response." },
    { id: uid(), opportunityId: "o2", userId: "u2", userName: "Priya Mehta", at: "2026-06-07T09:30:00.000Z", text: "Technical eval in progress with clinical ops." },
  ]);
  const [engagementPlans, setEngagementPlans] = useState<EngagementPlan[]>([
    { id: uid(), month: "2026-06", accountId: "a1", plannedCount: 8, remarks: "Monthly cadence", createdByUserId: "u1", createdAt: SEED_NOW },
    { id: uid(), month: "2026-06", accountId: "a4", plannedCount: 6, remarks: "Clinical follow-ups", createdByUserId: "u1", createdAt: SEED_NOW },
    { id: uid(), month: "2026-06", accountId: "a3", plannedCount: 4, remarks: "Pilot rollout reviews", createdByUserId: "u1", createdAt: SEED_NOW },
  ]);
  const [commentReads, setCommentReads] = useState<Record<string, string>>({});

  const currentUser = users.find((u) => u.id === currentUserId)!;
  const meName = currentUser?.userName ?? "system";

  const setSimple = useCallback((key: SimpleMasterKey, rows: MasterRow[]) => {
    setSimpleState((s) => ({ ...s, [key]: rows }));
  }, []);

  const upsertSimple = useCallback(
    (key: SimpleMasterKey, row: MasterRow): string | null => {
      let err: string | null = null;
      setSimpleState((s) => {
        const list = s[key];
        const dup = list.find((r) => r.id !== row.id && r.name.trim().toLowerCase() === row.name.trim().toLowerCase());
        if (dup) {
          err = "Duplicate name not allowed.";
          return s;
        }
        const exists = list.some((r) => r.id === row.id);
        const updated = exists
          ? list.map((r) => (r.id === row.id ? { ...row, modifiedBy: meName, modifiedDate: now() } : r))
          : [...list, { ...row, createdBy: meName, createdDate: now(), modifiedBy: meName, modifiedDate: now() }];
        return { ...s, [key]: updated };
      });
      return err;
    },
    [meName],
  );

  const toggleSimpleActive = useCallback(
    (key: SimpleMasterKey, id: string) => {
      setSimpleState((s) => ({
        ...s,
        [key]: s[key].map((r) => (r.id === id ? { ...r, active: !r.active, modifiedBy: meName, modifiedDate: now() } : r)),
      }));
    },
    [meName],
  );

  const upsertUser = useCallback(
    (u: User): string | null => {
      let err: string | null = null;
      setUsers((list) => {
        if (list.some((x) => x.id !== u.id && x.userName.toLowerCase() === u.userName.toLowerCase())) {
          err = "User Name must be unique.";
          return list;
        }
        if (list.some((x) => x.id !== u.id && x.email.toLowerCase() === u.email.toLowerCase())) {
          err = "Email must be unique.";
          return list;
        }
        const exists = list.some((x) => x.id === u.id);
        return exists
          ? list.map((x) => (x.id === u.id ? { ...u, modifiedBy: meName, modifiedDate: now() } : x))
          : [...list, { ...u, createdBy: meName, createdDate: now(), modifiedBy: meName, modifiedDate: now() }];
      });
      return err;
    },
    [meName],
  );

  const toggleUserActive = useCallback(
    (id: string) => setUsers((l) => l.map((u) => (u.id === id ? { ...u, active: !u.active, modifiedBy: meName, modifiedDate: now() } : u))),
    [meName],
  );

  const upsertProfile = useCallback(
    (p: Profile): string | null => {
      let err: string | null = null;
      setProfiles((list) => {
        if (list.some((x) => x.id !== p.id && x.name.trim().toLowerCase() === p.name.trim().toLowerCase())) {
          err = "Duplicate profile name not allowed.";
          return list;
        }
        const exists = list.some((x) => x.id === p.id);
        return exists
          ? list.map((x) => (x.id === p.id ? { ...p, modifiedBy: meName, modifiedDate: now() } : x))
          : [...list, { ...p, createdBy: meName, createdDate: now(), modifiedBy: meName, modifiedDate: now() }];
      });
      // ensure matrix entry exists
      setMatrix((m) => (m.find((x) => x.profileId === p.id) ? m : [...m, { profileId: p.id, access: Object.fromEntries(MATRIX_MODULES.map((mm) => [mm.key, false])) }]));
      return err;
    },
    [meName],
  );

  const toggleProfileActive = useCallback(
    (id: string) => setProfiles((l) => l.map((p) => (p.id === id ? { ...p, active: !p.active, modifiedBy: meName, modifiedDate: now() } : p))),
    [meName],
  );

  const saveMatrix = useCallback((entry: ProfileMatrixEntry) => {
    setMatrix((m) => {
      const exists = m.find((x) => x.profileId === entry.profileId);
      return exists ? m.map((x) => (x.profileId === entry.profileId ? entry : x)) : [...m, entry];
    });
  }, []);

  const upsertAccount = useCallback((a: Account): string | null => {
    let err: string | null = null;
    setAccounts((list) => {
      if (list.some((x) => x.id !== a.id && x.name.trim().toLowerCase() === a.name.trim().toLowerCase() && x.city.trim().toLowerCase() === a.city.trim().toLowerCase())) {
        err = "Duplicate account (Name + City) not allowed.";
        return list;
      }
      const exists = list.some((x) => x.id === a.id);
      return exists ? list.map((x) => (x.id === a.id ? a : x)) : [...list, a];
    });
    return err;
  }, []);

  const toggleAccountActive = useCallback(
    (id: string) => setAccounts((l) => l.map((a) => (a.id === id ? { ...a, active: !a.active } : a))),
    [],
  );

  const upsertContact = useCallback((c: Contact): string | null => {
    setContacts((list) => {
      const exists = list.some((x) => x.id === c.id);
      return exists ? list.map((x) => (x.id === c.id ? c : x)) : [...list, c];
    });
    return null;
  }, []);

  const toggleContactActive = useCallback(
    (id: string) => setContacts((l) => l.map((c) => (c.id === id ? { ...c, active: !c.active } : c))),
    [],
  );

  const addEngagement = useCallback((e: Engagement) => setEngagements((l) => [...l, e]), []);
  const updateEngagement = useCallback(
    (id: string, patch: Partial<Engagement>) => setEngagements((l) => l.map((e) => (e.id === id ? { ...e, ...patch } : e))),
    [],
  );

  const addOpportunity = useCallback((o: Opportunity) => setOpportunities((l) => [...l, o]), []);
  const updateOpportunity = useCallback(
    (id: string, patch: Partial<Opportunity>) => setOpportunities((l) => l.map((o) => (o.id === id ? { ...o, ...patch } : o))),
    [],
  );

  const addHistory = useCallback((h: Omit<AssignmentHistoryEntry, "id">) => {
    setHistory((l) => [{ ...h, id: uid() }, ...l]);
  }, []);

  const addKnowledgeDoc = useCallback((d: KnowledgeDoc) => setKnowledgeDocs((l) => [...l, d]), []);
  const updateKnowledgeDoc = useCallback(
    (id: string, patch: Partial<KnowledgeDoc>) => setKnowledgeDocs((l) => l.map((d) => (d.id === id ? { ...d, ...patch } : d))),
    [],
  );
  const addClientDoc = useCallback((d: ClientDoc) => setClientDocs((l) => [...l, d]), []);
  const updateClientDoc = useCallback(
    (id: string, patch: Partial<ClientDoc>) => setClientDocs((l) => l.map((d) => (d.id === id ? { ...d, ...patch } : d))),
    [],
  );

  const addBusinessOpening = useCallback((bo: BusinessOpening) => setBusinessOpenings((l) => [...l, bo]), []);
  const updateBusinessOpening = useCallback(
    (id: string, patch: Partial<BusinessOpening>) =>
      setBusinessOpenings((l) => l.map((b) => (b.id === id ? { ...b, ...patch, modifiedDate: now() } : b))),
    [],
  );
  const addBoDoc = useCallback((d: BODoc) => setBoDocs((l) => [...l, d]), []);

  const upsertApplicability = useCallback((rows: ProductApplicability[]) => {
    setApplicability((list) => {
      const next = [...list];
      rows.forEach((r) => {
        const idx = next.findIndex((x) => x.productId === r.productId && x.accountId === r.accountId);
        if (idx >= 0) next[idx] = r;
        else next.push(r);
      });
      return next;
    });
  }, []);

  const addOppComment = useCallback(
    (opportunityId: string, text: string) => {
      const u = users.find((x) => x.id === currentUserId);
      setOppComments((l) => [
        ...l,
        { id: uid(), opportunityId, userId: currentUserId, userName: u?.fullName ?? "Unknown", at: now(), text },
      ]);
    },
    [currentUserId, users],
  );

  const markOppCommentsRead = useCallback(
    (opportunityId: string) => {
      setCommentReads((r) => ({ ...r, [`${currentUserId}:${opportunityId}`]: now() }));
    },
    [currentUserId],
  );

  const unreadOppCommentsCount = useCallback(
    (opportunityId: string) => {
      const lastRead = commentReads[`${currentUserId}:${opportunityId}`];
      const lastReadTs = lastRead ? Date.parse(lastRead) : 0;
      return oppComments.filter(
        (c) => c.opportunityId === opportunityId && c.userId !== currentUserId && Date.parse(c.at) > lastReadTs,
      ).length;
    },
    [oppComments, commentReads, currentUserId],
  );

  const addEngagementPlan = useCallback(
    (plan: Omit<EngagementPlan, "id" | "createdByUserId" | "createdAt">) => {
      setEngagementPlans((l) => [
        ...l,
        { ...plan, id: uid(), createdByUserId: currentUserId, createdAt: now() },
      ]);
    },
    [currentUserId],
  );

  const updateEngagementPlan = useCallback(
    (id: string, patch: Partial<EngagementPlan>) =>
      setEngagementPlans((l) => l.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    [],
  );

  const validateCredentials = useCallback(
    (userName: string, password: string) => {
      const u = users.find((x) => x.userName === userName && x.password === password && x.active);
      return !!u;
    },
    [users],
  );

  const value: CrmState = {
    currentUserId, setCurrentUserId,
    users, profiles, simple, matrix, accounts, contacts, engagements, opportunities, history, knowledgeDocs, clientDocs,
    businessOpenings, boDocs,
    applicability,
    oppComments, engagementPlans, commentReads,
    setSimple, upsertSimple, toggleSimpleActive,
    upsertUser, toggleUserActive,
    upsertProfile, toggleProfileActive,
    saveMatrix,
    upsertAccount, toggleAccountActive,
    upsertContact, toggleContactActive,
    addEngagement, updateEngagement,
    addOpportunity, updateOpportunity,
    addHistory,
    addKnowledgeDoc, updateKnowledgeDoc, addClientDoc, updateClientDoc,
    addBusinessOpening, updateBusinessOpening, addBoDoc,
    upsertApplicability,
    addOppComment, markOppCommentsRead, unreadOppCommentsCount,
    addEngagementPlan, updateEngagementPlan,
    validateCredentials,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCrm() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCrm must be inside CrmProvider");
  return v;
}

export const newId = uid;
export const nowIso = now;

export function fmtDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  // Deterministic UTC format to avoid SSR/CSR locale & timezone hydration mismatches
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())}-${pad(d.getUTCMonth() + 1)}-${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function fmtDateOnly(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())}-${pad(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`;
}

export function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// Range helpers
export type RangeOption =
  | "Today" | "Yesterday"
  | "This Week" | "Current Week" | "Last Week" | "Next Week"
  | "This Month" | "Current Month" | "Last Month" | "Next Month"
  | "Current Year" | "Last Year"
  | "Last 7 Days" | "Last 15 Days" | "Last 30 Days" | "Last 90 Days" | "Last 180 Days"
  | "Next 7 Days" | "Next 15 Days" | "Next 30 Days"
  | "Last 3 Months" | "Last 6 Months"
  | "Custom";

export function rangeBounds(range: RangeOption, from?: string, to?: string): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  switch (range) {
    case "Today": return { start, end };
    case "Yesterday": {
      const s = addDays(start, -1); const e = addDays(start, -1); e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    case "This Week":
    case "Current Week": {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      return { start, end };
    }
    case "Last Week": {
      const day = start.getDay();
      const s = addDays(start, -day - 7);
      const e = addDays(s, 6); e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    case "Next Week": {
      const day = start.getDay();
      const s = addDays(start, 7 - day);
      const e = addDays(s, 6); e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    case "This Month":
    case "Current Month": {
      start.setDate(1); return { start, end };
    }
    case "Last Month": {
      const s = new Date(start.getFullYear(), start.getMonth() - 1, 1);
      const e = new Date(start.getFullYear(), start.getMonth(), 0); e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    case "Next Month": {
      const s = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      const e = new Date(start.getFullYear(), start.getMonth() + 2, 0); e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    case "Current Year": {
      const s = new Date(start.getFullYear(), 0, 1);
      const e = new Date(start.getFullYear(), 11, 31); e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    case "Last Year": {
      const s = new Date(start.getFullYear() - 1, 0, 1);
      const e = new Date(start.getFullYear() - 1, 11, 31); e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    case "Last 7 Days": return { start: addDays(start, -6), end };
    case "Last 15 Days": return { start: addDays(start, -14), end };
    case "Last 30 Days": return { start: addDays(start, -29), end };
    case "Last 90 Days": return { start: addDays(start, -89), end };
    case "Last 180 Days": return { start: addDays(start, -179), end };
    case "Next 7 Days": return { start, end: (() => { const e = addDays(start, 6); e.setHours(23,59,59,999); return e; })() };
    case "Next 15 Days": return { start, end: (() => { const e = addDays(start, 14); e.setHours(23,59,59,999); return e; })() };
    case "Next 30 Days": return { start, end: (() => { const e = addDays(start, 29); e.setHours(23,59,59,999); return e; })() };
    case "Last 3 Months":
      start.setMonth(start.getMonth() - 3); return { start, end };
    case "Last 6 Months":
      start.setMonth(start.getMonth() - 6); return { start, end };
    case "Custom":
      return { start: from ? new Date(from) : new Date(0), end: to ? new Date(to) : new Date() };
  }
  return { start, end };
}
