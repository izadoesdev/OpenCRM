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
  new: "bg-blue-500/20 text-blue-300",
  contacted: "bg-violet-500/20 text-violet-300",
  interested: "bg-amber-500/20 text-amber-300",
  demo: "bg-cyan-500/20 text-cyan-300",
  negotiating: "bg-orange-500/20 text-orange-300",
  converted: "bg-emerald-500/20 text-emerald-300",
  lost: "bg-red-500/20 text-red-300",
  churned: "bg-zinc-500/20 text-zinc-300",
};

export const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  website: "Website",
  referral: "Referral",
  linkedin: "LinkedIn",
  cold_email: "Cold Email",
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
  follow_up: "bg-blue-500/20 text-blue-300",
  call: "bg-amber-500/20 text-amber-300",
  email: "bg-emerald-500/20 text-emerald-300",
  meeting: "bg-violet-500/20 text-violet-300",
  demo: "bg-cyan-500/20 text-cyan-300",
  linkedin: "bg-sky-500/20 text-sky-300",
  other: "bg-zinc-500/20 text-zinc-300",
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
  new: "text-blue-300",
  contacted: "text-violet-300",
  interested: "text-amber-300",
  demo: "text-cyan-300",
  negotiating: "text-orange-300",
  converted: "text-emerald-300",
  lost: "text-red-300",
  churned: "text-zinc-300",
};

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
