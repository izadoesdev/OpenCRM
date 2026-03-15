export const LEAD_STATUSES = [
  "new",
  "contacted",
  "interested",
  "demo",
  "negotiating",
  "converted",
  "lost",
  "churned",
] as const;

export const ACTIVE_LEAD_STATUSES = LEAD_STATUSES.filter(
  (s) => s !== "churned"
) as readonly string[];

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = [
  "manual",
  "website",
  "referral",
  "linkedin",
  "cold_email",
  "api",
  "other",
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_PLANS = ["free", "pro", "enterprise"] as const;

export type LeadPlan = (typeof LEAD_PLANS)[number];

export const TASK_TYPES = [
  "follow_up",
  "call",
  "email",
  "meeting",
  "demo",
  "linkedin",
  "other",
] as const;

export const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  demo: "Demo",
  negotiating: "Negotiating",
  converted: "Converted",
  lost: "Lost",
  churned: "Churned",
};

export const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-50 text-blue-700",
  contacted: "bg-violet-50 text-violet-700",
  interested: "bg-amber-50 text-amber-700",
  demo: "bg-cyan-50 text-cyan-700",
  negotiating: "bg-orange-50 text-orange-700",
  converted: "bg-emerald-50 text-emerald-700",
  lost: "bg-red-50 text-red-700",
  churned: "bg-zinc-100 text-zinc-500",
};

export const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  website: "Website",
  referral: "Referral",
  linkedin: "LinkedIn",
  cold_email: "Cold Email",
  api: "API",
  other: "Other",
};

export const TASK_TYPE_LABELS: Record<string, string> = {
  follow_up: "Follow-up",
  call: "Call",
  email: "Send Email",
  meeting: "Meeting",
  demo: "Demo",
  linkedin: "LinkedIn",
  other: "Other",
};

export const TASK_TYPE_COLORS: Record<string, string> = {
  follow_up: "bg-blue-50 text-blue-700",
  call: "bg-amber-50 text-amber-700",
  email: "bg-emerald-50 text-emerald-700",
  meeting: "bg-violet-50 text-violet-700",
  demo: "bg-cyan-50 text-cyan-700",
  linkedin: "bg-sky-50 text-sky-700",
  other: "bg-zinc-100 text-zinc-600",
};

export const STATUS_DOT_COLORS: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-violet-500",
  interested: "bg-amber-500",
  demo: "bg-cyan-500",
  negotiating: "bg-orange-500",
  converted: "bg-emerald-500",
  lost: "bg-red-500",
  churned: "bg-zinc-500",
};

export const STATUS_TEXT_COLORS: Record<string, string> = {
  new: "text-blue-600",
  contacted: "text-violet-600",
  interested: "text-amber-600",
  demo: "text-cyan-600",
  negotiating: "text-orange-600",
  converted: "text-emerald-600",
  lost: "text-red-600",
  churned: "text-zinc-500",
};

// ── Finances ──

export const EXPENSE_TYPES = ["subscription", "payroll", "one_time"] as const;

export type ExpenseType = (typeof EXPENSE_TYPES)[number];

export const EXPENSE_TYPE_LABELS: Record<string, string> = {
  subscription: "Subscription",
  payroll: "Payroll",
  one_time: "One-time",
};

export const BILLING_PERIODS = ["monthly", "yearly"] as const;

export type BillingPeriod = (typeof BILLING_PERIODS)[number];

export const BILLING_PERIOD_LABELS: Record<string, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
};

export const EXPENSE_CATEGORIES = [
  "Infrastructure",
  "Tools",
  "Marketing",
  "Legal",
  "Finance",
  "Office",
  "Payroll",
  "Other",
] as const;

export const TASK_RECURRENCES = [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
] as const;

export type TaskRecurrence = (typeof TASK_RECURRENCES)[number];

export const RECURRENCE_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
};
