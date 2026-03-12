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
  "demo",
  "call",
  "email",
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
