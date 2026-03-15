"use client";

import {
  Add01Icon,
  ChartLineData03Icon,
  Contact01Icon,
  MoneyReceive01Icon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState } from "react";
import { LeadFormDialog } from "@/components/lead-form-dialog";
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
import { StatCard, StatCardRow } from "./_components/stat-cards";

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

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <div className="flex flex-1 items-center justify-between">
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
          <Button onClick={() => setShowForm(true)} size="sm">
            <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} />
            Add Lead
          </Button>
        </div>
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl space-y-6 p-5">
          {/* ── Stat cards ──────────────────────────────────── */}
          <StatCardRow>
            <StatCard
              color="bg-blue-500/10 text-blue-600"
              icon={Contact01Icon}
              label="Total Leads"
              value={stats.totalLeads}
            />
            <StatCard
              color="bg-amber-500/10 text-amber-600"
              icon={UserMultiple02Icon}
              label="Qualified"
              value={stats.qualified}
            />
            <StatCard
              color="bg-emerald-500/10 text-emerald-600"
              icon={ChartLineData03Icon}
              label="Conversion"
              value={stats.conversionRate}
            />
            <StatCard
              color="bg-violet-500/10 text-violet-600"
              icon={MoneyReceive01Icon}
              label="Revenue"
              value={fmtCents(stats.revenue)}
            />
          </StatCardRow>

          {/* ── Main content grid ───────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Left column — Tasks + Calendar */}
            <div className="space-y-6 lg:col-span-3">
              <div className="rounded-xl border p-5">
                <DashboardTasks tasks={allTasks} toggleTask={toggleTask} />
              </div>

              {gConn?.hasCalendar && calEvents.length > 0 && (
                <div className="rounded-xl border p-5">
                  <CalendarEvents events={calEvents} />
                </div>
              )}
            </div>

            {/* Right column — Pipeline + Recent Leads */}
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-xl border p-5">
                <PipelineChart counts={pipelineCounts} />
              </div>

              <div className="rounded-xl border p-5">
                <RecentLeads leads={recentLeads} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <LeadFormDialog onOpenChange={setShowForm} open={showForm} />
    </div>
  );
}
