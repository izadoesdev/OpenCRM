"use client";

import {
  Add01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";
import { LeadFormDialog } from "@/components/lead-form-dialog";
import { MeetingLinkPill } from "@/components/meeting-detail";
import { Pill, SectionHeader, UserAvatar } from "@/components/micro";
import { PageHeader } from "@/components/page-header";
import { EmptyState, PageSkeleton } from "@/components/page-skeleton";
import { StatusBadge } from "@/components/status-badge";
import { TaskCheckbox } from "@/components/task-checkbox";
import { RecurrenceBadge, TaskTypeBadge } from "@/components/task-type-picker";
import { Button } from "@/components/ui/button";
import type { CalendarEvent } from "@/lib/actions/calendar";
import {
  LEAD_STATUSES,
  STATUS_DOT_COLORS,
  STATUS_LABELS,
  STATUS_TEXT_COLORS,
} from "@/lib/constants";
import dayjs from "@/lib/dayjs";
import {
  useCalendarEvents,
  useDashboard,
  useGoogleConnection,
  useToggleTask,
} from "@/lib/queries";
import { formatCents, getDueLabel } from "@/lib/utils";

const ACTIVE_STATUSES = LEAD_STATUSES.filter(
  (s) => s !== "converted" && s !== "lost" && s !== "churned"
);

export function DashboardClient() {
  const { data, isLoading } = useDashboard();
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
      !t.completedAt &&
      dayjs(t.dueAt).isBefore(dayjs(), "minute") &&
      !dayjs(t.dueAt).isToday()
  );
  const todayTasks = allTasks.filter(
    (t) => !t.completedAt && dayjs(t.dueAt).isToday()
  );
  const laterTasks = allTasks.filter(
    (t) =>
      !(
        t.completedAt ||
        dayjs(t.dueAt).isBefore(dayjs(), "minute") ||
        dayjs(t.dueAt).isToday()
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
                  <Pill className="ml-2" variant="danger">
                    {overdueTasks.length} overdue
                  </Pill>
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
              <EmptyState message="No open tasks — you're all caught up" />
            )}

            <div className="mt-3 space-y-4">
              <TaskSection
                label="Overdue"
                labelClass="text-red-400"
                onToggle={toggleTask}
                tasks={overdueTasks}
              />
              <TaskSection
                label="Today"
                labelClass="text-amber-400"
                onToggle={toggleTask}
                tasks={todayTasks}
              />
              <TaskSection
                label="Upcoming"
                onToggle={toggleTask}
                tasks={laterTasks}
              />
            </div>

            {gConn?.hasCalendar && calEvents.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon
                    className="text-muted-foreground"
                    icon={Calendar01Icon}
                    size={14}
                    strokeWidth={1.5}
                  />
                  <h2 className="font-medium text-sm">Upcoming Events</h2>
                </div>
                <div className="mt-2 space-y-1">
                  {calEvents.map((ev) => (
                    <a
                      className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/40"
                      href={ev.htmlLink}
                      key={ev.id}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <div className="flex shrink-0 flex-col items-end">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {dayjs(ev.start.dateTime).format("h:mm A")}
                        </span>
                        <span className="text-[9px] text-muted-foreground/70">
                          {dayjs(ev.start.dateTime).fromNow()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-sm">
                          {ev.summary}
                        </span>
                        {(ev.attendees?.length ?? 0) > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {ev.attendees?.length} attendee
                            {ev.attendees?.length === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                      {ev.hangoutLink && <Pill variant="success">Meet</Pill>}
                    </a>
                  ))}
                </div>
              </div>
            )}
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
                          className={`h-1.5 rounded-full transition-all duration-300 ${STATUS_DOT_COLORS[status]} ${c === 0 ? "opacity-20" : ""}`}
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
                    <span className={STATUS_TEXT_COLORS[s]}>
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
                  <EmptyState className="py-6" message="No leads yet" />
                )}
                {recentLeads.map((lead) => (
                  <Link
                    className="flex items-center gap-2.5 rounded-sm px-1 py-1.5 transition-colors hover:bg-muted/50"
                    href={`/leads/${lead.id}`}
                    key={lead.id}
                  >
                    <UserAvatar name={lead.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{lead.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {lead.company ?? lead.email}
                      </p>
                    </div>
                    <StatusBadge status={lead.status} />
                    {lead.assignedUser && (
                      <UserAvatar name={lead.assignedUser.name} size="xs" />
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
  meetingLink: string | null;
  recurrence: string | null;
  title: string;
  type: string;
}

function TaskSection({
  label,
  labelClass,
  tasks,
  onToggle,
}: {
  label: string;
  labelClass?: string;
  tasks: TaskItem[];
  onToggle: ReturnType<typeof useToggleTask>;
}) {
  if (tasks.length === 0) {
    return null;
  }
  return (
    <div>
      <SectionHeader className={labelClass} count={tasks.length}>
        {label}
      </SectionHeader>
      <div className="space-y-0.5">
        {tasks.map((t) => (
          <DashboardTaskRow key={t.id} onToggle={onToggle} task={t} />
        ))}
      </div>
    </div>
  );
}

function DashboardTaskRow({
  task: t,
  onToggle,
}: {
  task: TaskItem;
  onToggle: ReturnType<typeof useToggleTask>;
}) {
  const isComplete = !!t.completedAt;
  const due = getDueLabel(new Date(t.dueAt), isComplete);

  return (
    <Link
      className="group flex items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/40"
      href="/tasks"
    >
      {/* biome-ignore lint/a11y: checkbox handles its own a11y */}
      <span onClick={(e) => e.stopPropagation()}>
        <TaskCheckbox
          checked={isComplete}
          onChange={() =>
            onToggle.mutate({ id: t.id, isComplete, leadId: t.leadId })
          }
        />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-tight ${isComplete ? "text-muted-foreground line-through" : ""}`}
        >
          {t.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {t.lead && (
            <span className="text-muted-foreground text-xs">{t.lead.name}</span>
          )}
          <TaskTypeBadge type={t.type} />
          <RecurrenceBadge recurrence={t.recurrence} />
          <span className={`text-[11px] ${due.className}`}>{due.text}</span>
        </div>
      </div>
      {t.meetingLink && (
        <MeetingLinkPill
          href={t.meetingLink}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </Link>
  );
}
