import { type DataTableProps, DataTableRenderer } from "./renderers/data-table";
import {
  type EmailPreviewProps,
  EmailPreviewRenderer,
} from "./renderers/email-preview";
import {
  type FinanceOverviewProps,
  FinanceOverviewRenderer,
} from "./renderers/finance-overview";
import { type LeadCardProps, LeadCardRenderer } from "./renderers/lead-card";
import { type LeadListProps, LeadListRenderer } from "./renderers/lead-list";
import type {
  ComponentRegistry,
  DataTableInput,
  EmailPreviewInput,
  FinanceOverviewInput,
  LeadCardInput,
  LeadListInput,
  RawComponentInput,
} from "./types";

// ── Validators ──

function isDataTableInput(
  input: RawComponentInput
): input is RawComponentInput & DataTableInput {
  if (input.type !== "data-table") {
    return false;
  }
  return Array.isArray(input.columns) && Array.isArray(input.rows);
}

function isLeadListInput(
  input: RawComponentInput
): input is RawComponentInput & LeadListInput {
  if (input.type !== "lead-list") {
    return false;
  }
  return Array.isArray(input.leads);
}

function isLeadCardInput(
  input: RawComponentInput
): input is RawComponentInput & LeadCardInput {
  if (input.type !== "lead-card") {
    return false;
  }
  return (
    typeof input.id === "string" &&
    typeof input.name === "string" &&
    typeof input.status === "string"
  );
}

function isEmailPreviewInput(
  input: RawComponentInput
): input is RawComponentInput & EmailPreviewInput {
  if (input.type !== "email-preview") {
    return false;
  }
  return (
    typeof input.leadId === "string" &&
    typeof input.to === "string" &&
    typeof input.subject === "string" &&
    typeof input.body === "string"
  );
}

function isFinanceOverviewInput(
  input: RawComponentInput
): input is RawComponentInput & FinanceOverviewInput {
  return input.type === "finance-overview";
}

// ── Transformers ──

function toDataTableProps(input: DataTableInput): DataTableProps {
  return {
    title: input.title,
    description: input.description,
    columns: input.columns,
    rows: input.rows,
    footer: input.footer,
  };
}

function toLeadListProps(input: LeadListInput): LeadListProps {
  return {
    title: input.title,
    leads: input.leads,
  };
}

function toLeadCardProps(input: LeadCardInput): LeadCardProps {
  return {
    id: input.id,
    name: input.name,
    email: input.email,
    company: input.company,
    status: input.status,
    value: input.value,
    valueDollars: input.valueDollars,
    source: input.source,
    plan: input.plan,
    score: input.score,
    scoreLabel: input.scoreLabel,
    createdAt: input.createdAt,
  };
}

function toEmailPreviewProps(input: EmailPreviewInput): EmailPreviewProps {
  return {
    leadId: input.leadId,
    to: input.to,
    subject: input.subject,
    body: input.body,
    cc: input.cc,
    bcc: input.bcc,
    threadId: input.threadId,
    replyToMessageId: input.replyToMessageId,
  };
}

function toFinanceOverviewProps(
  input: FinanceOverviewInput
): FinanceOverviewProps {
  return {
    mrrCents: input.mrrCents,
    arrCents: input.arrCents,
    monthlyBurnCents: input.monthlyBurnCents,
    netBurnMonthlyCents: input.netBurnMonthlyCents,
    cashOnHandCents: input.cashOnHandCents,
    runwayMonths: input.runwayMonths,
    categoryBreakdown: input.categoryBreakdown,
  };
}

// ── Registry ──

export const componentRegistry = {
  "data-table": {
    validate: isDataTableInput,
    transform: toDataTableProps,
    component: DataTableRenderer,
  },

  "lead-list": {
    validate: isLeadListInput,
    transform: toLeadListProps,
    component: LeadListRenderer,
  },

  "lead-card": {
    validate: isLeadCardInput,
    transform: toLeadCardProps,
    component: LeadCardRenderer,
  },

  "email-preview": {
    validate: isEmailPreviewInput,
    transform: toEmailPreviewProps,
    component: EmailPreviewRenderer,
  },

  "finance-overview": {
    validate: isFinanceOverviewInput,
    transform: toFinanceOverviewProps,
    component: FinanceOverviewRenderer,
  },
} satisfies ComponentRegistry;

export function hasComponent(type: string): boolean {
  return type in componentRegistry;
}

export function getComponent(type: string) {
  return (componentRegistry as ComponentRegistry)[type];
}
