export interface ScoringInput {
  activitiesCount: number;
  daysSinceCreated: number;
  status: string;
  tasksCount: number;
  value: number;
}

export interface ScoreFactor {
  description: string;
  maxPoints: number;
  name: string;
  points: number;
}

export interface ScoreBreakdown {
  factors: ScoreFactor[];
  label: string;
  total: number;
}

const STATUS_SCORES: Record<string, number> = {
  new: 5,
  contacted: 15,
  interested: 30,
  demo: 50,
  negotiating: 70,
  converted: 100,
  lost: 0,
  churned: 0,
};

const STATUS_STAGE_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  demo: "Demo",
  negotiating: "Negotiating",
  converted: "Converted",
  lost: "Lost",
  churned: "Churned",
};

export function computeLeadScore(input: ScoringInput): number {
  return computeLeadScoreBreakdown(input).total;
}

export function computeLeadScoreBreakdown(input: ScoringInput): ScoreBreakdown {
  const factors: ScoreFactor[] = [];

  const statusPoints = Math.round((STATUS_SCORES[input.status] ?? 0) * 0.4);
  factors.push({
    name: "Pipeline Stage",
    points: statusPoints,
    maxPoints: 40,
    description: `${STATUS_STAGE_LABELS[input.status] ?? input.status} stage`,
  });

  const valueCents = input.value;
  const valueK = valueCents / 100_000;
  const valuePoints = Math.round(Math.min(valueK / 50, 1) * 25);
  factors.push({
    name: "Deal Value",
    points: valuePoints,
    maxPoints: 25,
    description:
      valueCents > 0
        ? `$${(valueCents / 100).toLocaleString()} deal`
        : "No value set",
  });

  const engagement = input.activitiesCount + input.tasksCount;
  const engagementPoints = Math.round(Math.min(engagement / 10, 1) * 20);
  factors.push({
    name: "Engagement",
    points: engagementPoints,
    maxPoints: 20,
    description: `${input.activitiesCount} activities, ${input.tasksCount} tasks`,
  });

  let recencyPoints = 0;
  let recencyDesc: string;
  if (
    input.daysSinceCreated > 30 &&
    !["converted", "negotiating", "demo"].includes(input.status)
  ) {
    const staleDays = input.daysSinceCreated - 30;
    recencyPoints = -Math.min(Math.round(staleDays / 10), 15);
    recencyDesc = `${input.daysSinceCreated}d old, stale penalty`;
  } else if (input.daysSinceCreated > 30) {
    recencyDesc = `${input.daysSinceCreated}d old, no penalty (advanced stage)`;
  } else {
    recencyDesc = `${input.daysSinceCreated}d old`;
  }
  factors.push({
    name: "Recency",
    points: recencyPoints,
    maxPoints: 0,
    description: recencyDesc,
  });

  const raw = factors.reduce((sum, f) => sum + f.points, 0);
  const total = Math.max(0, Math.min(100, raw));

  return { total, label: getScoreLabel(total), factors };
}

export function getScoreColor(score: number): string {
  if (score >= 70) {
    return "text-emerald-300";
  }
  if (score >= 40) {
    return "text-amber-300";
  }
  return "text-red-300";
}

export function getScoreBgColor(score: number): string {
  if (score >= 70) {
    return "bg-emerald-500/20 text-emerald-300";
  }
  if (score >= 40) {
    return "bg-amber-500/20 text-amber-300";
  }
  return "bg-red-500/20 text-red-300";
}

export function getScoreLabel(score: number): string {
  if (score >= 70) {
    return "Hot";
  }
  if (score >= 40) {
    return "Warm";
  }
  return "Cold";
}
