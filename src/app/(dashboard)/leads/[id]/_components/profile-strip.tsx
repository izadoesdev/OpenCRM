import { UserAvatar } from "@/components/micro";
import { StatusBadge } from "@/components/status-badge";
import { ScoreHoverCard, useLeadScore } from "./lead-score";

export function ProfileStrip({
  lead,
}: {
  lead: {
    name: string;
    status: string;
    value: number;
    activities?: unknown[];
    tasks?: unknown[];
    createdAt: Date;
    title: string | null;
    company: string | null;
    email: string;
  };
}) {
  const breakdown = useLeadScore(lead);
  return (
    <div className="shrink-0 border-b px-6 py-4">
      <div className="flex items-center gap-4">
        <UserAvatar name={lead.name} size="xl" />
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="truncate font-semibold text-lg tracking-tight">
              {lead.name}
            </h1>
            <StatusBadge status={lead.status} />
            <ScoreHoverCard breakdown={breakdown} />
          </div>
          <p className="truncate text-muted-foreground text-sm">
            {[lead.title, lead.company].filter(Boolean).join(" at ") ||
              lead.email}
          </p>
        </div>
      </div>
    </div>
  );
}
