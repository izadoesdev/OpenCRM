import type { ComponentType } from "react";

export interface RawComponentInput {
  type: string;
  [key: string]: unknown;
}

export interface BaseComponentProps {
  className?: string;
}

export interface ComponentDefinition<
  TInput extends Record<string, unknown>,
  TProps extends BaseComponentProps,
> {
  component: ComponentType<TProps>;
  transform: (input: TInput) => TProps;
  validate: (input: RawComponentInput) => input is RawComponentInput & TInput;
}

// biome-ignore lint/suspicious/noExplicitAny: registry stores heterogeneous component definitions
export type ComponentRegistry = Record<string, ComponentDefinition<any, any>>;

export type ContentSegment =
  | { type: "text"; content: string }
  | { type: "component"; content: RawComponentInput };

export interface ParsedSegments {
  segments: ContentSegment[];
}

// ── Data Table ──

export interface DataTableColumn {
  align?: "left" | "center" | "right";
  header: string;
  key: string;
}

export interface DataTableInput {
  columns: DataTableColumn[];
  description?: string;
  footer?: string;
  rows: Record<string, string | number | boolean | null>[];
  title?: string;
  type: "data-table";
  [key: string]: unknown;
}

// ── Lead List ──

export interface LeadListItem {
  company?: string | null;
  createdAt?: string;
  email: string;
  id: string;
  name: string;
  plan?: string | null;
  source?: string;
  status: string;
  value?: number;
  valueDollars?: number;
}

export interface LeadListInput {
  leads: LeadListItem[];
  title?: string;
  type: "lead-list";
  [key: string]: unknown;
}

// ── Lead Card ──

export interface LeadCardInput {
  company?: string | null;
  createdAt?: string;
  email: string;
  id: string;
  name: string;
  plan?: string | null;
  score?: number;
  scoreLabel?: string;
  source?: string;
  status: string;
  type: "lead-card";
  value?: number;
  valueDollars?: number;
  [key: string]: unknown;
}

// ── Email Preview ──

export interface EmailPreviewInput {
  bcc?: string;
  body: string;
  cc?: string;
  leadId: string;
  replyToMessageId?: string;
  subject: string;
  threadId?: string;
  to: string;
  type: "email-preview";
  [key: string]: unknown;
}

// ── Finance Overview ──

export interface FinanceOverviewInput {
  arrCents?: number;
  cashOnHandCents?: number;
  categoryBreakdown?: Record<string, number>;
  monthlyBurnCents?: number;
  mrrCents?: number;
  netBurnMonthlyCents?: number;
  runwayMonths?: number | null;
  type: "finance-overview";
  [key: string]: unknown;
}
