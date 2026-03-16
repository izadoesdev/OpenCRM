"use client";

import { Add01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { LeadFormDialog } from "@/components/lead-form-dialog";
import { Pill } from "@/components/micro";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { SegmentedControl } from "@/components/segmented-control";
import { Button } from "@/components/ui/button";
import type { CalendarEvent } from "@/lib/actions/calendar";
import dayjs from "@/lib/dayjs";
import {
  useCalendarEvents,
  useDashboard,
  useFormatCents,
  useGoogleConnection,
  useToggleTask,
} from "@/lib/queries";
import { CalendarEvents } from "./_components/calendar-events";
import {
  DashboardTasks,
  type DashTaskItem,
} from "./_components/dashboard-tasks";
import { PipelineChart } from "./_components/pipeline-chart";
import { type RecentLead, RecentLeads } from "./_components/recent-leads";
import { ReportingCard } from "./reporting/_components/reporting-primitives";

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span
        className={`font-mono font-semibold text-sm tabular-nums ${accent ?? ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export function DashboardClient() {
  const fmtCents = useFormatCents();
  const [dateRange, setDateRange] = useState<
    "all" | "week" | "month" | "quarter"
  >("all");
  const dateOpts = useMemo(() => {
    if (dateRange === "all") {
      return undefined;
    }
    const now = dayjs();
    let from: ReturnType<typeof dayjs>;
    if (dateRange === "week") {
      from = now.subtract(7, "day");
    } else if (dateRange === "month") {
      from = now.subtract(1, "month");
    } else {
      from = now.subtract(3, "month");
    }
    return { from: from.toISOString(), to: now.toISOString() };
  }, [dateRange]);

  const { data, isLoading } = useDashboard(dateOpts);
  const toggleTask = useToggleTask();
  const { data: gConn } = useGoogleConnection();
  const { data: calEvents = [] as CalendarEvent[] } = useCalendarEvents({
    maxResults: 5,
  });
  const [showForm, setShowForm] = useState(false);

  if (isLoading || !data) {
    return <PageSkeleton header="Dashboard" />;
  }

  const { stats, pipelineCounts } = data;
  const recentLeads = data.recentLeads as RecentLead[];
  const allTasks = data.upcomingTasks as DashTaskItem[];
  const overdueCount = allTasks.filter(
    (t) =>
      !t.completedAt &&
      dayjs(t.dueAt).isBefore(dayjs(), "minute") &&
      !dayjs(t.dueAt).isToday()
  ).length;

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <div className="flex flex-1 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-lg tracking-tight">Dashboard</h1>
            <SegmentedControl
              onChange={setDateRange}
              segments={[
                { value: "all" as const, label: "All" },
                { value: "week" as const, label: "7d" },
                { value: "month" as const, label: "30d" },
                { value: "quarter" as const, label: "90d" },
              ]}
              value={dateRange}
            />
          </div>
          <div className="flex items-center gap-5">
            <Stat
              accent="text-blue-600"
              label="Leads"
              value={stats.totalLeads}
            />
            <Stat
              accent="text-amber-600"
              label="Qualified"
              value={stats.qualified}
            />
            <Stat
              accent="text-emerald-600"
              label="Conv"
              value={stats.conversionRate}
            />
            <Stat
              accent="text-violet-600"
              label="Revenue"
              value={fmtCents(stats.revenue)}
            />
            <Button onClick={() => setShowForm(true)} size="sm">
              <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
              Add Lead
            </Button>
          </div>
        </div>
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1400px] gap-4 p-4">
          {/* Main column */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <ReportingCard
              action={
                <div className="flex items-center gap-2">
                  {overdueCount > 0 && (
                    <Pill variant="danger">{overdueCount} overdue</Pill>
                  )}
                  <Button
                    render={<Link href="/tasks" />}
                    size="sm"
                    variant="ghost"
                  >
                    All tasks
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={14}
                      strokeWidth={1.5}
                    />
                  </Button>
                </div>
              }
              title="Your Tasks"
            >
              <DashboardTasks tasks={allTasks} toggleTask={toggleTask} />
            </ReportingCard>

            {gConn?.hasCalendar && calEvents.length > 0 && (
              <ReportingCard title="Upcoming Events">
                <CalendarEvents events={calEvents} />
              </ReportingCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-72 shrink-0">
            <div className="sticky top-4 flex flex-col gap-4">
              <ReportingCard
                action={
                  <Button
                    render={<Link href="/pipeline" />}
                    size="sm"
                    variant="ghost"
                  >
                    Board
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={14}
                      strokeWidth={1.5}
                    />
                  </Button>
                }
                title="Pipeline"
              >
                <PipelineChart counts={pipelineCounts} />
              </ReportingCard>

              <ReportingCard
                action={
                  <Button
                    render={<Link href="/leads" />}
                    size="sm"
                    variant="ghost"
                  >
                    All leads
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={14}
                      strokeWidth={1.5}
                    />
                  </Button>
                }
                title="Recent Leads"
              >
                <RecentLeads leads={recentLeads} />
              </ReportingCard>
            </div>
          </div>
        </div>
      </div>

      <LeadFormDialog onOpenChange={setShowForm} open={showForm} />
    </div>
  );
}
