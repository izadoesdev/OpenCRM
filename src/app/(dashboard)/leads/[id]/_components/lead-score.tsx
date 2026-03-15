import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import dayjs from "@/lib/dayjs";
import {
  computeLeadScoreBreakdown,
  getScoreBgColor,
  getScoreColor,
  type ScoreBreakdown,
} from "@/lib/scoring";
import { cn } from "@/lib/utils";

function scoreBarColor(score: number): string {
  if (score >= 70) {
    return "bg-emerald-400";
  }
  if (score >= 40) {
    return "bg-amber-400";
  }
  return "bg-red-400";
}

export function ScoreHoverCard({ breakdown }: { breakdown: ScoreBreakdown }) {
  const { total, label, factors } = breakdown;
  return (
    <HoverCard>
      <HoverCardTrigger
        render={
          <button
            className={cn(
              "cursor-default rounded-md px-2 py-0.5 font-mono text-xs",
              getScoreBgColor(total)
            )}
            type="button"
          />
        }
      >
        {total} {label}
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-72 p-0" side="bottom">
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Lead Score</span>
            <span
              className={cn(
                "font-mono font-semibold text-lg",
                getScoreColor(total)
              )}
            >
              {total}
              <span className="ml-1 font-normal text-muted-foreground text-xs">
                / 100
              </span>
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                scoreBarColor(total)
              )}
              style={{ width: `${total}%` }}
            />
          </div>
        </div>
        <div className="divide-y divide-border/50">
          {factors.map((f) => (
            <div className="px-4 py-2.5" key={f.name}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs">{f.name}</span>
                <span className="font-mono text-xs">
                  {f.points > 0 && "+"}
                  {f.points}
                  {f.maxPoints > 0 && (
                    <span className="text-muted-foreground">
                      /{f.maxPoints}
                    </span>
                  )}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {f.description}
              </p>
              {f.maxPoints > 0 && (
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground/30"
                    style={{
                      width: `${Math.max(0, (f.points / f.maxPoints) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export function useLeadScore(lead: {
  value: number;
  status: string;
  activities?: unknown[];
  tasks?: unknown[];
  createdAt: Date;
}) {
  return computeLeadScoreBreakdown({
    value: lead.value,
    status: lead.status,
    activitiesCount: lead.activities?.length ?? 0,
    tasksCount: lead.tasks?.length ?? 0,
    daysSinceCreated: dayjs().diff(dayjs(lead.createdAt), "day"),
  });
}
