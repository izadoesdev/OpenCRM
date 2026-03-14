"use client";

import { useMemo, useState } from "react";
import { Pill, UserAvatar } from "@/components/micro";
import { PageHeader } from "@/components/page-header";
import { EmptyState, PageSkeleton } from "@/components/page-skeleton";
import { SegmentedControl } from "@/components/segmented-control";
import { StatusBadge } from "@/components/status-badge";
import {
  ACTIVE_LEAD_STATUSES,
  SOURCE_LABELS,
  STATUS_DOT_COLORS,
  STATUS_LABELS,
  STATUS_TEXT_COLORS,
} from "@/lib/constants";
import dayjs from "@/lib/dayjs";
import {
  usePipelineVelocity,
  useReportingData,
  useStatusChangeHistory,
} from "@/lib/queries";

type AuditRange = "7d" | "30d" | "90d" | "all";

function getConversionVariant(rate: number): "success" | "primary" | "muted" {
  if (rate > 20) {
    return "success";
  }
  if (rate > 0) {
    return "primary";
  }
  return "muted";
}

function convBarColor(rate: number): string {
  if (rate > 20) {
    return "bg-emerald-500/60";
  }
  if (rate > 0) {
    return "bg-amber-500/60";
  }
  return "bg-muted";
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-4">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={`font-mono font-semibold text-xl ${accent ?? ""}`}>
        {value}
      </span>
      {sub && (
        <span className="text-[10px] text-muted-foreground/60">{sub}</span>
      )}
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  barClass,
  suffix,
}: {
  label: string;
  value: number;
  max: number;
  barClass?: string;
  suffix?: React.ReactNode;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="group flex items-center gap-3 rounded-sm px-1 py-1 transition-colors hover:bg-muted/30">
      <span className="w-20 shrink-0 text-muted-foreground text-xs">
        {label}
      </span>
      <div className="flex-1 rounded-full bg-muted/40">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${barClass ?? "bg-primary/50"}`}
          style={{
            width: `${Math.max(pct, 3)}%`,
            minWidth: value > 0 ? "8px" : undefined,
          }}
        />
      </div>
      <span className="w-8 text-right font-mono text-muted-foreground text-xs">
        {value}
      </span>
      {suffix}
    </div>
  );
}

export function ReportingClient() {
  const [auditRange, setAuditRange] = useState<AuditRange>("30d");
  const { data, isLoading } = useReportingData();
  const { data: velocity } = usePipelineVelocity();

  const auditOpts = useMemo(() => {
    if (auditRange === "all") {
      return undefined;
    }
    const now = dayjs();
    const daysMap = { "7d": 7, "30d": 30, "90d": 90 } as const;
    const from = now.subtract(
      daysMap[auditRange as keyof typeof daysMap],
      "day"
    );
    return { from: from.toISOString(), to: now.toISOString() };
  }, [auditRange]);

  const { data: auditData } = useStatusChangeHistory(auditOpts);

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

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl space-y-0">
          {/* Top stat cards */}
          <div className="grid grid-cols-2 gap-px border-b bg-border sm:grid-cols-4">
            <div className="bg-background p-5">
              <StatCard
                accent="text-blue-400"
                label="Total Leads"
                value={totalLeads}
              />
            </div>
            <div className="bg-background p-5">
              <StatCard
                accent="text-emerald-400"
                label="Converted"
                sub={`${convRate}% conversion rate`}
                value={convertedCount}
              />
            </div>
            <div className="bg-background p-5">
              <StatCard
                accent="text-amber-400"
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
            </div>
            <div className="bg-background p-5">
              <StatCard
                accent="text-red-400"
                label="Lost"
                sub={
                  totalLeads > 0
                    ? `${(((funnelMap.lost ?? 0) / totalLeads) * 100).toFixed(0)}% loss rate`
                    : undefined
                }
                value={funnelMap.lost ?? 0}
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-5">
            {/* Left column — main charts */}
            <div className="space-y-0 border-b lg:col-span-3 lg:border-r lg:border-b-0">
              {/* Funnel */}
              <div className="border-b p-5">
                <h2 className="font-medium text-sm">Pipeline Funnel</h2>
                <div className="mt-4 space-y-1">
                  {ACTIVE_LEAD_STATUSES.map((s) => {
                    const c = funnelMap[s] ?? 0;
                    const pct = (c / maxFunnel) * 100;
                    return (
                      <div
                        className="group flex items-center gap-3 rounded-sm px-1 py-1 transition-colors hover:bg-muted/30"
                        key={s}
                      >
                        <span className="w-24 text-muted-foreground text-xs">
                          {STATUS_LABELS[s]}
                        </span>
                        <div className="flex-1 rounded-full bg-muted/40">
                          <div
                            className={`h-4 rounded-full ${STATUS_DOT_COLORS[s]} flex items-center justify-end pr-2 transition-all duration-500`}
                            style={{
                              width: `${Math.max(pct, 3)}%`,
                              minWidth: c > 0 ? "28px" : undefined,
                            }}
                          >
                            {c > 0 && (
                              <span className="font-mono text-[9px] text-white mix-blend-difference">
                                {c}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Leads Over Time */}
              <div className="border-b p-5">
                <h2 className="font-medium text-sm">Leads Over Time</h2>
                {data.monthlyLeads.length === 0 ? (
                  <EmptyState className="py-6" message="No data yet" />
                ) : (
                  <div
                    className="mt-4 flex items-end gap-1.5 sm:gap-3"
                    style={{ height: "140px" }}
                  >
                    {data.monthlyLeads.map((m) => {
                      const barH = (m.count / maxMonthly) * 100;
                      return (
                        <div
                          className="group flex flex-1 flex-col items-center justify-end gap-1"
                          key={m.month}
                          style={{ height: "100%" }}
                        >
                          <span className="font-mono text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                            {m.count}
                          </span>
                          <div
                            className="w-full rounded-t-sm bg-primary/20 transition-all duration-500 group-hover:bg-primary/40"
                            style={{
                              height: `${Math.max(barH, 2)}%`,
                            }}
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {m.month.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Activity Log */}
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-medium text-sm">Activity Log</h2>
                  <SegmentedControl
                    onChange={setAuditRange}
                    segments={[
                      { value: "7d" as const, label: "7d" },
                      { value: "30d" as const, label: "30d" },
                      { value: "90d" as const, label: "90d" },
                      { value: "all" as const, label: "All" },
                    ]}
                    value={auditRange}
                  />
                </div>
                <div className="mt-3 max-h-72 space-y-0.5 overflow-y-auto">
                  {auditData && auditData.length === 0 && (
                    <EmptyState
                      className="py-6"
                      message="No status changes in this period"
                    />
                  )}
                  {auditData?.map((entry) => {
                    const meta = entry.metadata as {
                      oldStatus?: string;
                      newStatus?: string;
                    } | null;
                    return (
                      <div
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-muted/30"
                        key={entry.id}
                      >
                        <span className="w-16 shrink-0 font-mono text-[10px] text-muted-foreground">
                          {dayjs(entry.createdAt).format("MMM D")}
                        </span>
                        {entry.lead && (
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {entry.lead.name}
                          </span>
                        )}
                        <div className="flex shrink-0 items-center gap-1.5">
                          {meta?.oldStatus && (
                            <StatusBadge status={meta.oldStatus} />
                          )}
                          {meta?.oldStatus && meta?.newStatus && (
                            <span className="text-muted-foreground/50">→</span>
                          )}
                          {meta?.newStatus && (
                            <StatusBadge status={meta.newStatus} />
                          )}
                        </div>
                        {entry.user && (
                          <UserAvatar
                            className="ml-1 shrink-0"
                            name={(entry.user as { name: string }).name}
                            size="xs"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right column — sidebar metrics */}
            <div className="flex flex-col lg:col-span-2">
              {/* By Source */}
              <div className="border-b p-5">
                <h2 className="font-medium text-sm">By Source</h2>
                <div className="mt-3 space-y-1">
                  {data.bySource.map((s) => (
                    <BarRow
                      barClass="bg-primary/40"
                      key={s.source}
                      label={SOURCE_LABELS[s.source] ?? s.source}
                      max={maxSource}
                      value={s.count}
                    />
                  ))}
                  {data.bySource.length === 0 && (
                    <EmptyState className="py-4" message="No data" />
                  )}
                </div>
              </div>

              {/* Conversion by Source */}
              <div className="border-b p-5">
                <h2 className="font-medium text-sm">Conversion Rate</h2>
                <div className="mt-3 space-y-2">
                  {data.convBySource.map((s) => (
                    <div
                      className="flex items-center gap-3 rounded-sm px-1 py-1"
                      key={s.source}
                    >
                      <span className="w-20 shrink-0 text-muted-foreground text-xs">
                        {SOURCE_LABELS[s.source] ?? s.source}
                      </span>
                      <div className="flex flex-1 items-center gap-2">
                        <div className="flex-1 rounded-full bg-muted/40">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${convBarColor(s.rate)}`}
                            style={{
                              width: `${Math.max(s.rate, 3)}%`,
                              minWidth: s.rate > 0 ? "6px" : undefined,
                            }}
                          />
                        </div>
                        <Pill variant={getConversionVariant(s.rate)}>
                          {s.rate}%
                        </Pill>
                      </div>
                    </div>
                  ))}
                  {data.convBySource.length === 0 && (
                    <EmptyState className="py-4" message="No data" />
                  )}
                </div>
              </div>

              {/* Velocity */}
              <div className="flex-1 p-5">
                <h2 className="font-medium text-sm">Stage Duration</h2>
                <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                  Avg days per stage
                </p>
                {velocity && velocityEntries.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {velocityEntries.map((s) => {
                      const v = velocity[s];
                      if (!v) {
                        return null;
                      }
                      return (
                        <div
                          className="flex items-center justify-between rounded-sm px-1 py-1"
                          key={s}
                        >
                          <span className="text-muted-foreground text-xs">
                            {STATUS_LABELS[s]}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium font-mono text-sm ${STATUS_TEXT_COLORS[s] ?? ""}`}
                            >
                              {v.avg}d
                            </span>
                            <span className="text-[10px] text-muted-foreground/50">
                              {v.count} leads
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState className="py-6" message="Not enough data" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
