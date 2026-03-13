"use client";

import {
  Add01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format, isPast, isToday } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import { LeadFormDialog } from "@/components/lead-form-dialog";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { TaskCheckbox } from "@/components/task-checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LEAD_STATUSES,
  STATUS_COLORS,
  STATUS_LABELS,
  TASK_TYPE_LABELS,
} from "@/lib/constants";
import { useDashboard, useRescheduleTask, useToggleTask } from "@/lib/queries";
import { formatCents, getInitials } from "@/lib/utils";

const ACTIVE_STATUSES = LEAD_STATUSES.filter(
  (s) => s !== "converted" && s !== "lost" && s !== "churned"
);

export function DashboardClient() {
  const { data, isLoading } = useDashboard();
  const toggleTask = useToggleTask();
  const rescheduleTask = useRescheduleTask();
  const [showForm, setShowForm] = useState(false);

  if (isLoading || !data) {
    return null;
  }

  const { stats, pipelineCounts } = data;
  const recentLeads = data.recentLeads as Array<{
    id: string;
    name: string;
    email: string;
    company: string | null;
    status: string;
    value: number;
    assignedUser: { id: string; name: string } | null;
  }>;
  const allTasks = data.upcomingTasks as TaskItem[];

  const overdueTasks = allTasks.filter(
    (t) =>
      !t.completedAt && isPast(new Date(t.dueAt)) && !isToday(new Date(t.dueAt))
  );
  const todayTasks = allTasks.filter(
    (t) => !t.completedAt && isToday(new Date(t.dueAt))
  );
  const laterTasks = allTasks.filter(
    (t) =>
      !(
        t.completedAt ||
        isPast(new Date(t.dueAt)) ||
        isToday(new Date(t.dueAt))
      )
  );

  const maxCount = Math.max(
    1,
    ...ACTIVE_STATUSES.map((s) => pipelineCounts[s] ?? 0)
  );

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-semibold text-lg tracking-tight">Dashboard</h1>
            <div className="hidden items-center gap-4 text-xs sm:flex">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-blue-400" />
                <span className="font-mono text-foreground">
                  {stats.totalLeads}
                </span>
                <span className="text-muted-foreground">leads</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-400" />
                <span className="font-mono text-foreground">
                  {stats.qualified}
                </span>
                <span className="text-muted-foreground">qualified</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span className="font-mono text-foreground">
                  {stats.conversionRate}
                </span>
                <span className="text-muted-foreground">conv</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-violet-400" />
                <span className="font-mono text-foreground">
                  {formatCents(stats.revenue)}
                </span>
              </span>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)} size="sm">
            <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} />
            Add Lead
          </Button>
        </div>
      </PageHeader>

      <div className="min-h-0 flex-1">
        <div className="grid h-full lg:grid-cols-5">
          {/* Left — Tasks */}
          <div className="overflow-y-auto border-b p-5 lg:col-span-3 lg:border-r lg:border-b-0">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-sm">
                Your Tasks
                {overdueTasks.length > 0 && (
                  <span className="ml-2 rounded-sm bg-red-500/15 px-1.5 py-0.5 font-mono text-[10px] text-red-400">
                    {overdueTasks.length} overdue
                  </span>
                )}
              </h2>
              <Button render={<Link href="/tasks" />} size="sm" variant="ghost">
                All tasks
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={14}
                  strokeWidth={1.5}
                />
              </Button>
            </div>

            {allTasks.length === 0 && (
              <p className="py-12 text-center text-muted-foreground text-sm">
                No open tasks — you're all caught up
              </p>
            )}

            <div className="mt-3 space-y-4">
              <TaskSection
                label="Overdue"
                labelClass="text-red-400"
                onReschedule={rescheduleTask}
                onToggle={toggleTask}
                tasks={overdueTasks}
              />
              <TaskSection
                label="Today"
                labelClass="text-amber-400"
                onReschedule={rescheduleTask}
                onToggle={toggleTask}
                tasks={todayTasks}
              />
              <TaskSection
                label="Upcoming"
                onReschedule={rescheduleTask}
                onToggle={toggleTask}
                tasks={laterTasks}
              />
            </div>
          </div>

          {/* Right — Pipeline + Recent */}
          <div className="flex flex-col overflow-y-auto lg:col-span-2">
            {/* Pipeline breakdown */}
            <div className="border-b p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-sm">Pipeline</h2>
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
              </div>
              <div className="mt-3 space-y-1.5">
                {ACTIVE_STATUSES.map((status) => {
                  const c = pipelineCounts[status] ?? 0;
                  const pct = maxCount > 0 ? (c / maxCount) * 100 : 0;
                  return (
                    <Link
                      className="group flex items-center gap-3 rounded-sm px-1 py-1 transition-colors hover:bg-muted/40"
                      href={`/leads?status=${status}`}
                      key={status}
                    >
                      <span className="w-20 text-muted-foreground text-xs">
                        {STATUS_LABELS[status]}
                      </span>
                      <div className="flex-1 rounded-full bg-muted/50">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${STATUS_COLORS[status].split(" ")[0]} ${c === 0 ? "opacity-20" : ""}`}
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

              {/* Closed counts inline */}
              <div className="mt-3 flex items-center gap-4 border-t pt-3 text-xs">
                {(["converted", "lost", "churned"] as const).map((s) => (
                  <span className="text-muted-foreground" key={s}>
                    <span className={STATUS_COLORS[s].split(" ")[1]}>
                      {pipelineCounts[s] ?? 0}
                    </span>{" "}
                    {STATUS_LABELS[s].toLowerCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* Recent leads */}
            <div className="flex-1 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-sm">Recent Leads</h2>
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
              </div>
              <div className="mt-3 space-y-0.5">
                {recentLeads.length === 0 && (
                  <p className="py-6 text-center text-muted-foreground text-xs">
                    No leads yet
                  </p>
                )}
                {recentLeads.map((lead) => (
                  <Link
                    className="flex items-center gap-2.5 rounded-sm px-1 py-1.5 transition-colors hover:bg-muted/50"
                    href={`/leads/${lead.id}`}
                    key={lead.id}
                  >
                    <Avatar className="size-7">
                      <AvatarFallback className="bg-muted text-[9px] text-muted-foreground">
                        {getInitials(lead.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{lead.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {lead.company ?? lead.email}
                      </p>
                    </div>
                    <StatusBadge status={lead.status} />
                    {lead.assignedUser && (
                      <Avatar className="size-4">
                        <AvatarFallback className="bg-muted text-[6px] text-muted-foreground">
                          {getInitials(lead.assignedUser.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {lead.value > 0 && (
                      <span className="font-mono text-muted-foreground text-xs">
                        {formatCents(lead.value)}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <LeadFormDialog onOpenChange={setShowForm} open={showForm} />
    </div>
  );
}

// ---------------------------------------------------------------------------

interface TaskItem {
  completedAt: Date | null;
  dueAt: Date;
  id: string;
  lead: { id: string; name: string } | null;
  leadId: string;
  title: string;
  type: string;
}

function TaskSection({
  label,
  labelClass,
  tasks,
  onToggle,
  onReschedule,
}: {
  label: string;
  labelClass?: string;
  tasks: TaskItem[];
  onToggle: ReturnType<typeof useToggleTask>;
  onReschedule: ReturnType<typeof useRescheduleTask>;
}) {
  if (tasks.length === 0) {
    return null;
  }
  return (
    <div>
      <p
        className={`mb-1 font-medium text-[10px] uppercase tracking-wider ${labelClass ?? "text-muted-foreground"}`}
      >
        {label} ({tasks.length})
      </p>
      <div className="space-y-0.5">
        {tasks.map((t) => (
          <DashboardTaskRow
            key={t.id}
            onReschedule={onReschedule}
            onToggle={onToggle}
            task={t}
          />
        ))}
      </div>
    </div>
  );
}

function DashboardTaskRow({
  task: t,
  onToggle,
  onReschedule,
}: {
  task: TaskItem;
  onToggle: ReturnType<typeof useToggleTask>;
  onReschedule: ReturnType<typeof useRescheduleTask>;
}) {
  const overdue = isPast(new Date(t.dueAt)) && !isToday(new Date(t.dueAt));

  return (
    <div className="group flex items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/40">
      <TaskCheckbox
        checked={false}
        onChange={() =>
          onToggle.mutate({ id: t.id, isComplete: false, leadId: t.leadId })
        }
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-tight">{t.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {t.lead && (
            <Link
              className="text-muted-foreground text-xs transition-colors hover:text-foreground hover:underline"
              href={`/leads/${t.lead.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              {t.lead.name}
            </Link>
          )}
          <span className="rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground uppercase">
            {TASK_TYPE_LABELS[t.type] ?? t.type}
          </span>
          <span
            className={`text-[11px] ${overdue ? "text-red-400" : "text-muted-foreground"}`}
          >
            {format(new Date(t.dueAt), "MMM d, h:mm a")}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          onClick={() =>
            onReschedule.mutate({ id: t.id, days: 1, leadId: t.leadId })
          }
          size="icon-sm"
          title="+1 day"
          variant="ghost"
        >
          <HugeiconsIcon icon={Calendar01Icon} size={12} strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}
