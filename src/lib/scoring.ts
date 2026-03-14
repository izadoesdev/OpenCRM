interface ScoringInput {
  activitiesCount: number;
  daysSinceCreated: number;
  status: string;
  tasksCount: number;
  value: number;
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

export function computeLeadScore(input: ScoringInput): number {
  let score = 0;

  // Status progression (0-40 points)
  score += Math.round((STATUS_SCORES[input.status] ?? 0) * 0.4);

  // Deal value (0-25 points) - cap at $50k
  const valueCents = input.value;
  const valueK = valueCents / 100_000; // convert cents to K
  score += Math.round(Math.min(valueK / 50, 1) * 25);

  // Engagement: activities + tasks (0-20 points)
  const engagement = input.activitiesCount + input.tasksCount;
  score += Math.round(Math.min(engagement / 10, 1) * 20);

  // Recency penalty: if created > 30 days ago and not converted/negotiating, penalize
  if (
    input.daysSinceCreated > 30 &&
    !["converted", "negotiating", "demo"].includes(input.status)
  ) {
    const staleDays = input.daysSinceCreated - 30;
    score -= Math.min(Math.round(staleDays / 10), 15);
  }

  return Math.max(0, Math.min(100, score));
}

export function getScoreColor(score: number): string {
  if (score >= 70) {
    return "text-emerald-400";
  }
  if (score >= 40) {
    return "text-amber-400";
  }
  return "text-red-400";
}

export function getScoreBgColor(score: number): string {
  if (score >= 70) {
    return "bg-emerald-500/15 text-emerald-400";
  }
  if (score >= 40) {
    return "bg-amber-500/15 text-amber-400";
  }
  return "bg-red-500/15 text-red-400";
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
