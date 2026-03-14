"use client";

import { useMemo, useState } from "react";
import { UserAvatar } from "@/components/micro";
import { SegmentedControl } from "@/components/segmented-control";
import { StatusBadge } from "@/components/status-badge";
import dayjs from "@/lib/dayjs";
import { useStatusChangeHistory } from "@/lib/queries";
import {
  ReportingCard,
  ReportingEmpty,
} from "../_components/reporting-primitives";

type AuditRange = "7d" | "30d" | "90d" | "all";

export function ActivityLog() {
  const [range, setRange] = useState<AuditRange>("30d");

  const opts = useMemo(() => {
    if (range === "all") {
      return undefined;
    }
    const now = dayjs();
    const daysMap = { "7d": 7, "30d": 30, "90d": 90 } as const;
    const from = now.subtract(daysMap[range as keyof typeof daysMap], "day");
    return { from: from.toISOString(), to: now.toISOString() };
  }, [range]);

  const { data: entries } = useStatusChangeHistory(opts);

  return (
    <ReportingCard
      action={
        <SegmentedControl
          onChange={setRange}
          segments={[
            { value: "7d" as const, label: "7d" },
            { value: "30d" as const, label: "30d" },
            { value: "90d" as const, label: "90d" },
            { value: "all" as const, label: "All" },
          ]}
          value={range}
        />
      }
      title="Activity Log"
    >
      <div className="max-h-80 space-y-px overflow-y-auto">
        {entries && entries.length === 0 && (
          <ReportingEmpty message="No status changes in this period" />
        )}
        {entries?.map((entry) => {
          const meta = entry.metadata as {
            oldStatus?: string;
            newStatus?: string;
          } | null;
          return (
            <div
              className="flex items-center gap-3 rounded-lg px-2 py-2 text-[13px] transition-colors hover:bg-muted/30"
              key={entry.id}
            >
              <span className="w-14 shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
                {dayjs(entry.createdAt).format("MMM D")}
              </span>
              {entry.lead && (
                <span className="min-w-0 flex-1 truncate font-medium text-[13px]">
                  {entry.lead.name}
                </span>
              )}
              <div className="flex shrink-0 items-center gap-1.5">
                {meta?.oldStatus && <StatusBadge status={meta.oldStatus} />}
                {meta?.oldStatus && meta?.newStatus && (
                  <span className="text-muted-foreground/40">→</span>
                )}
                {meta?.newStatus && <StatusBadge status={meta.newStatus} />}
              </div>
              {entry.user && (
                <UserAvatar
                  className="shrink-0"
                  name={(entry.user as { name: string }).name}
                  size="xs"
                />
              )}
            </div>
          );
        })}
      </div>
    </ReportingCard>
  );
}
