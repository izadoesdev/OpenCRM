import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { MeetingLinkPill } from "@/components/meeting-detail";
import { Pill, SectionHeader } from "@/components/micro";
import { EmptyState } from "@/components/page-skeleton";
import { TaskCheckbox } from "@/components/task-checkbox";
import { RecurrenceBadge, TaskTypeBadge } from "@/components/task-type-picker";
import { Button } from "@/components/ui/button";
import dayjs from "@/lib/dayjs";
import type { useToggleTask } from "@/lib/queries";
import { getDueLabel } from "@/lib/utils";

export interface DashTaskItem {
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

export function DashboardTasks({
  tasks,
  toggleTask,
}: {
  tasks: DashTaskItem[];
  toggleTask: ReturnType<typeof useToggleTask>;
}) {
  const overdue = tasks.filter(
    (t) =>
      !t.completedAt &&
      dayjs(t.dueAt).isBefore(dayjs(), "minute") &&
      !dayjs(t.dueAt).isToday()
  );
  const today = tasks.filter((t) => !t.completedAt && dayjs(t.dueAt).isToday());
  const later = tasks.filter(
    (t) =>
      !(
        t.completedAt ||
        dayjs(t.dueAt).isBefore(dayjs(), "minute") ||
        dayjs(t.dueAt).isToday()
      )
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-sm">
          Your Tasks
          {overdue.length > 0 && (
            <Pill className="ml-2" variant="danger">
              {overdue.length} overdue
            </Pill>
          )}
        </h2>
        <Button render={<Link href="/tasks" />} size="sm" variant="ghost">
          All tasks
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={1.5} />
        </Button>
      </div>

      {tasks.length === 0 && (
        <EmptyState message="No open tasks — you're all caught up" />
      )}

      <div className="mt-3 space-y-4">
        <TaskGroup
          label="Overdue"
          labelClass="text-red-600"
          onToggle={toggleTask}
          tasks={overdue}
        />
        <TaskGroup
          label="Today"
          labelClass="text-amber-600"
          onToggle={toggleTask}
          tasks={today}
        />
        <TaskGroup label="Upcoming" onToggle={toggleTask} tasks={later} />
      </div>
    </div>
  );
}

function TaskGroup({
  label,
  labelClass,
  tasks,
  onToggle,
}: {
  label: string;
  labelClass?: string;
  tasks: DashTaskItem[];
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
  task: DashTaskItem;
  onToggle: ReturnType<typeof useToggleTask>;
}) {
  const isComplete = !!t.completedAt;
  const due = getDueLabel(dayjs(t.dueAt).toDate(), isComplete);

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
