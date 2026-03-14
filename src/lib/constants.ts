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
  new: "bg-blue-500/15 text-blue-400",
  contacted: "bg-violet-500/15 text-violet-400",
  interested: "bg-amber-500/15 text-amber-400",
  demo: "bg-cyan-500/15 text-cyan-400",
  negotiating: "bg-orange-500/15 text-orange-400",
  converted: "bg-emerald-500/15 text-emerald-400",
  lost: "bg-red-500/15 text-red-400",
  churned: "bg-zinc-500/15 text-zinc-400",
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
  follow_up: "bg-blue-500/15 text-blue-400",
  call: "bg-amber-500/15 text-amber-400",
  email: "bg-emerald-500/15 text-emerald-400",
  meeting: "bg-violet-500/15 text-violet-400",
  demo: "bg-cyan-500/15 text-cyan-400",
  linkedin: "bg-sky-500/15 text-sky-400",
  other: "bg-zinc-500/15 text-zinc-400",
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
  new: "text-blue-400",
  contacted: "text-violet-400",
  interested: "text-amber-400",
  demo: "text-cyan-400",
  negotiating: "text-orange-400",
  converted: "text-emerald-400",
  lost: "text-red-400",
  churned: "text-zinc-400",
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
