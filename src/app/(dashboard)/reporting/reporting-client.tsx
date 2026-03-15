"use client";

import { Pill } from "@/components/micro";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import {
  ACTIVE_LEAD_STATUSES,
  SOURCE_LABELS,
  STATUS_DOT_COLORS,
  STATUS_LABELS,
  STATUS_TEXT_COLORS,
} from "@/lib/constants";
import { usePipelineVelocity, useReportingData } from "@/lib/queries";
import { cn } from "@/lib/utils";
import {
  FunnelRow,
  MetricRow,
  ReportingCard,
  ReportingEmpty,
  StatCard,
} from "./_components/reporting-primitives";
import { ActivityLog } from "./_sections/activity-log";

function convBarColor(rate: number): string {
  if (rate > 20) {
    return "bg-emerald-500/60";
  }
  if (rate > 0) {
    return "bg-amber-500/60";
  }
  return "bg-muted";
}

function convVariant(rate: number): "success" | "primary" | "muted" {
  if (rate > 20) {
    return "success";
  }
  if (rate > 0) {
    return "primary";
  }
  return "muted";
}

export function ReportingClient() {
  const { data, isLoading } = useReportingData();
  const { data: velocity } = usePipelineVelocity();

  if (isLoading || !data) {
    return <PageSkeleton header="Reporting" />;
  }

  const funnelMap: Record<string, number> = {};
  for (const f of data.funnelCounts) {
    funnelMap[f.status] = f.count;
  }
  const totalLeads = Object.values(funnelMap).reduce((a, b) => a + b, 0);
  const convertedCount = funnelMap.converted ?? 0;
  const convRate =
    totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(1) : "0";
  const maxFunnel = Math.max(1, ...Object.values(funnelMap));
  const maxMonthly = Math.max(1, ...data.monthlyLeads.map((m) => m.count));
  const maxSource = Math.max(1, ...data.bySource.map((s) => s.count));

  const velocityEntries = ACTIVE_LEAD_STATUSES.filter(
    (s) => velocity?.[s]
  ) as string[];
  const avgVelocity =
    velocityEntries.length > 0
      ? (
          velocityEntries.reduce(
            (sum, s) => sum + (velocity?.[s]?.avg ?? 0),
            0
          ) / velocityEntries.length
        ).toFixed(1)
      : null;

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <div className="flex flex-1 items-center justify-between">
          <h1 className="font-semibold text-lg tracking-tight">Reporting</h1>
          <div className="hidden items-center gap-4 text-xs sm:flex">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-blue-400" />
              <span className="font-mono text-foreground">{totalLeads}</span>
              <span className="text-muted-foreground">total</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span className="font-mono text-foreground">{convRate}%</span>
              <span className="text-muted-foreground">conv</span>
            </span>
            {avgVelocity && (
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-400" />
                <span className="font-mono text-foreground">
                  {avgVelocity}d
                </span>
                <span className="text-muted-foreground">avg cycle</span>
              </span>
            )}
          </div>
        </div>
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20">
        <div className="mx-auto max-w-6xl space-y-5 p-5">
          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              accent="text-blue-600"
              label="Total Leads"
              value={totalLeads}
            />
            <StatCard
              accent="text-emerald-600"
              label="Converted"
              sub={`${convRate}% conversion rate`}
              value={convertedCount}
            />
            <StatCard
              accent="text-amber-600"
              label="In Pipeline"
              sub="active stages"
              value={
                ACTIVE_LEAD_STATUSES.filter(
                  (s) =>
                    !["converted", "lost"].includes(s) &&
                    (funnelMap[s] ?? 0) > 0
                ).length
              }
            />
            <StatCard
              accent="text-red-600"
              label="Lost"
              sub={
                totalLeads > 0
                  ? `${(((funnelMap.lost ?? 0) / totalLeads) * 100).toFixed(0)}% loss rate`
                  : undefined
              }
              value={funnelMap.lost ?? 0}
            />
          </div>

          {/* ── Main grid ── */}
          <div className="grid gap-5 lg:grid-cols-5">
            {/* Left: funnel + timeline */}
            <div className="space-y-5 lg:col-span-3">
              <ReportingCard title="Pipeline Funnel">
                <div className="space-y-0.5">
                  {ACTIVE_LEAD_STATUSES.map((s) => (
                    <FunnelRow
                      barColor={STATUS_DOT_COLORS[s]}
                      key={s}
                      label={STATUS_LABELS[s]}
                      max={maxFunnel}
                      value={funnelMap[s] ?? 0}
                    />
                  ))}
                </div>
              </ReportingCard>

              <ReportingCard
                description="Last 6 months"
                title="Leads Over Time"
              >
                {data.monthlyLeads.length === 0 ? (
                  <ReportingEmpty message="No data yet" />
                ) : (
                  <div className="flex items-end gap-2" style={{ height: 160 }}>
                    {data.monthlyLeads.map((m) => {
                      const barH = (m.count / maxMonthly) * 100;
                      return (
                        <div
                          className="group flex flex-1 flex-col items-center justify-end gap-1.5"
                          key={m.month}
                          style={{ height: "100%" }}
                        >
                          <span className="font-mono text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                            {m.count}
                          </span>
                          <div
                            className="w-full rounded-md bg-primary/15 transition-all duration-500 group-hover:bg-primary/30"
                            style={{ height: `${Math.max(barH, 3)}%` }}
                          />
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            {m.month.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ReportingCard>
            </div>

            {/* Right: sources + velocity */}
            <div className="space-y-5 lg:col-span-2">
              <ReportingCard title="By Source">
                {data.bySource.length === 0 ? (
                  <ReportingEmpty message="No data" />
                ) : (
                  <div className="space-y-0.5">
                    {data.bySource.map((s) => (
                      <MetricRow
                        barClass="bg-primary/40"
                        key={s.source}
                        label={SOURCE_LABELS[s.source] ?? s.source}
                        max={maxSource}
                        value={s.count}
                      />
                    ))}
                  </div>
                )}
              </ReportingCard>

              <ReportingCard description="By source" title="Conversion Rate">
                {data.convBySource.length === 0 ? (
                  <ReportingEmpty message="No data" />
                ) : (
                  <div className="space-y-1.5">
                    {data.convBySource.map((s) => (
                      <div
                        className="flex items-center gap-3 py-1"
                        key={s.source}
                      >
                        <span className="w-20 shrink-0 text-[13px] text-muted-foreground">
                          {SOURCE_LABELS[s.source] ?? s.source}
                        </span>
                        <div className="h-1.5 flex-1 rounded-full bg-muted/50">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              convBarColor(s.rate)
                            )}
                            style={{
                              width: `${Math.max(s.rate, 2)}%`,
                              minWidth: s.rate > 0 ? "6px" : undefined,
                            }}
                          />
                        </div>
                        <Pill variant={convVariant(s.rate)}>{s.rate}%</Pill>
                      </div>
                    ))}
                  </div>
                )}
              </ReportingCard>

              <ReportingCard
                description="Avg days per stage"
                title="Stage Duration"
              >
                {velocity && velocityEntries.length > 0 ? (
                  <div className="space-y-1">
                    {velocityEntries.map((s) => {
                      const v = velocity[s];
                      if (!v) {
                        return null;
                      }
                      return (
                        <div
                          className="flex items-center justify-between py-1.5"
                          key={s}
                        >
                          <span className="text-[13px] text-muted-foreground">
                            {STATUS_LABELS[s]}
                          </span>
                          <div className="flex items-baseline gap-2">
                            <span
                              className={cn(
                                "font-mono font-semibold text-sm",
                                STATUS_TEXT_COLORS[s]
                              )}
                            >
                              {v.avg}d
                            </span>
                            <span className="text-[11px] text-muted-foreground/50 tabular-nums">
                              {v.count} leads
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <ReportingEmpty message="Not enough data" />
                )}
              </ReportingCard>
            </div>
          </div>

          {/* ── Activity log ── */}
          <ActivityLog />
        </div>
      </div>
    </div>
  );
}
