import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LEAD_STATUSES,
  STATUS_DOT_COLORS,
  STATUS_LABELS,
  STATUS_TEXT_COLORS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

const ACTIVE_STATUSES = LEAD_STATUSES.filter(
  (s) => s !== "converted" && s !== "lost" && s !== "churned"
);

export function PipelineChart({ counts }: { counts: Record<string, number> }) {
  const maxCount = Math.max(1, ...ACTIVE_STATUSES.map((s) => counts[s] ?? 0));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-sm">Pipeline</h2>
        <Button render={<Link href="/pipeline" />} size="sm" variant="ghost">
          Board
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={1.5} />
        </Button>
      </div>

      <div className="mt-3 space-y-1.5">
        {ACTIVE_STATUSES.map((status) => {
          const c = counts[status] ?? 0;
          const pct = maxCount > 0 ? (c / maxCount) * 100 : 0;
          return (
            <Link
              className="group flex items-center gap-3 rounded-md px-1 py-1 transition-colors hover:bg-muted/40"
              href={`/leads?status=${status}`}
              key={status}
            >
              <span className="w-20 text-muted-foreground text-xs">
                {STATUS_LABELS[status]}
              </span>
              <div className="flex-1 rounded-full bg-muted/50">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    STATUS_DOT_COLORS[status],
                    c === 0 && "opacity-20"
                  )}
                  style={{ width: `${Math.max(pct, 4)}%` }}
                />
              </div>
              <span className="w-6 text-right font-mono text-muted-foreground text-xs">
                {c}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 border-t pt-3 text-xs">
        {(["converted", "lost", "churned"] as const).map((s) => (
          <span className="text-muted-foreground" key={s}>
            <span className={STATUS_TEXT_COLORS[s]}>{counts[s] ?? 0}</span>{" "}
            {STATUS_LABELS[s].toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  );
}
