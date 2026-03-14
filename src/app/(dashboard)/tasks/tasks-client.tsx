"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Add01Icon,
  Delete02Icon,
  Edit02Icon,
  RepeatIcon,
  Task01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";
import { DateTimePicker } from "@/components/date-time-picker";
import {
  MeetingDetail,
  MeetingLinkBadge,
  MeetingLinkPill,
} from "@/components/meeting-detail";
import {
  IconSelect,
  Pill,
  SectionHeader,
  UserAvatar,
} from "@/components/micro";
import { PageHeader } from "@/components/page-header";
import { EmptyState, PageSkeleton } from "@/components/page-skeleton";
import { SegmentedControl } from "@/components/segmented-control";
import { StatusBadge } from "@/components/status-badge";
import { TaskCheckbox } from "@/components/task-checkbox";
import { TaskInlineEdit } from "@/components/task-inline-edit";
import {
  RecurrenceBadge,
  TaskTypeBadge,
  TaskTypePicker,
} from "@/components/task-type-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useSession } from "@/lib/auth-client";
import {
  RECURRENCE_LABELS,
  TASK_RECURRENCES,
  TASK_TYPE_LABELS,
  TASK_TYPES,
} from "@/lib/constants";
import dayjs from "@/lib/dayjs";
import {
  useCreateTask,
  useDeleteTask,
  useLeads,
  useTasks,
  useTeamMembers,
  useToggleTask,
} from "@/lib/queries";
import { getDueLabel, isMeetingType } from "@/lib/utils";

interface TaskUser {
  email: string;
  id: string;
  image: string | null;
  name: string;
}

interface TaskWithLead {
  calendarEventId: string | null;
  completedAt: Date | null;
  description: string | null;
  dueAt: Date;
  id: string;
  lead: { id: string; name: string; status: string } | null;
  leadId: string;
  meetingLink: string | null;
  recurrence: string | null;
  title: string;
  type: string;
  user: TaskUser | null;
  userId: string | null;
}

function emptyMessage(typeFilter: string, showCompleted: boolean): string {
  if (typeFilter !== "all") {
    return `No ${TASK_TYPE_LABELS[typeFilter]?.toLowerCase() ?? typeFilter} tasks`;
  }
  if (showCompleted) {
    return "No tasks at all";
  }
  return "All caught up";
}

const TYPE_FILTERS = [
  { value: "all", label: "All types" },
  ...TASK_TYPES.map((t) => ({
    value: t,
    label: TASK_TYPE_LABELS[t] ?? t,
  })),
];

function TaskDetail({
  task: t,
  onDelete,
}: {
  task: TaskWithLead;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <TaskInlineEdit
        leadId={t.leadId}
        onClose={() => setEditing(false)}
        task={t}
      />
    );
  }

  return (
    <div className="space-y-3">
      {t.description && (
        <p className="text-muted-foreground text-xs">{t.description}</p>
      )}

      {isMeetingType(t.type) && t.calendarEventId && (
        <MeetingDetail
          calendarEventId={t.calendarEventId}
          leadId={t.leadId}
          meetingLink={t.meetingLink}
          taskId={t.id}
        />
      )}

      {isMeetingType(t.type) && !t.calendarEventId && t.meetingLink && (
        <MeetingLinkBadge href={t.meetingLink} />
      )}

      {t.lead && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Lead:</span>
          <Link
            className="text-primary text-xs hover:underline"
            href={`/leads/${t.lead.id}`}
          >
            {t.lead.name}
          </Link>
          <StatusBadge status={t.lead.status} />
        </div>
      )}

      {t.user && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Assigned:</span>
          <UserAvatar name={t.user.name} size="xs" />
          <span className="text-xs">{t.user.name}</span>
        </div>
      )}

      <div className="flex items-center gap-2 border-t pt-2">
        <Button onClick={() => setEditing(true)} size="sm" variant="outline">
          <HugeiconsIcon icon={Edit02Icon} size={12} strokeWidth={1.5} />
          Edit
        </Button>
        <Button
          className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
          onClick={onDelete}
          size="sm"
          variant="ghost"
        >
          <HugeiconsIcon icon={Delete02Icon} size={12} strokeWidth={1.5} />
          Delete
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single task row — clickable to expand
// ---------------------------------------------------------------------------
function TaskRow({
  task: t,
  expanded,
  onToggleExpand,
  onToggleComplete,
  onDelete,
  showAssignee,
}: {
  task: TaskWithLead;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
  showAssignee: boolean;
}) {
  const isComplete = !!t.completedAt;
  const due = getDueLabel(new Date(t.dueAt), isComplete);
  const showJoin = isMeetingType(t.type) && t.meetingLink && !expanded;

  return (
    <div
      className={`rounded-lg transition-colors ${
        expanded ? "bg-muted/50" : "hover:bg-muted/30"
      }`}
    >
      <button
        className="flex w-full cursor-pointer items-start gap-3 px-3 py-2.5 text-left"
        onClick={onToggleExpand}
        type="button"
      >
        {/* biome-ignore lint/a11y: checkbox handles its own a11y */}
        <span className="pt-0.5" onClick={(e) => e.stopPropagation()}>
          <TaskCheckbox checked={isComplete} onChange={onToggleComplete} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span
              className={`flex-1 text-sm leading-tight ${isComplete ? "text-muted-foreground line-through" : ""}`}
            >
              {t.title}
            </span>
            {showJoin && (
              <MeetingLinkPill
                href={t.meetingLink ?? ""}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <TaskTypeBadge type={t.type} />
            <RecurrenceBadge recurrence={t.recurrence} />
            {t.lead && (
              <Link
                className="text-muted-foreground text-xs transition-colors hover:text-foreground hover:underline"
                href={`/leads/${t.lead.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                {t.lead.name}
              </Link>
            )}
            <span className={`text-[11px] ${due.className}`}>{due.text}</span>
          </span>
        </span>

        {showAssignee && t.user && (
          <span className="flex shrink-0 items-center gap-1.5 pt-1">
            <UserAvatar name={t.user.name} size="sm" />
          </span>
        )}
      </button>

      {expanded && (
        <div className="border-border/50 border-t px-3 pt-2 pb-3 pl-[42px]">
          <TaskDetail onDelete={onDelete} task={t} />
        </div>
      )}
    </div>
  );
}

function AddTaskForm({
  teamMembers,
  onClose,
}: {
  teamMembers: Array<{ id: string; name: string; email: string }>;
  onClose: () => void;
}) {
  const { data: leads = [] } = useLeads();
  const createTask = useCreateTask();
  const [title, setTitle] = useState("");
  const [leadId, setLeadId] = useState<string>("");
  const [dueAt, setDueAt] = useState<Date | null>(null);
  const [type, setType] = useState("follow_up");
  const [assignee, setAssignee] = useState("_self");
  const [recurrence, setRecurrence] = useState("none");
  const [meetingLink, setMeetingLink] = useState("");
  const [syncCalendar, setSyncCalendar] = useState(true);

  const showMeetingFields = isMeetingType(type);

  function handleSubmit() {
    if (!(title.trim() && dueAt && leadId)) {
      return;
    }
    createTask.mutate(
      {
        leadId,
        title: title.trim(),
        dueAt,
        type,
        userId: assignee === "_self" ? undefined : assignee,
        recurrence: recurrence === "none" ? null : recurrence,
        meetingLink: meetingLink.trim() || null,
        syncToCalendar: syncCalendar && showMeetingFields,
      },
      { onSuccess: onClose }
    );
  }

  return (
    <div className="mx-auto mb-4 max-w-2xl space-y-2.5 rounded-lg border bg-muted/20 p-4">
      <Input
        autoFocus
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
          }
          if (e.key === "Escape") {
            onClose();
          }
        }}
        placeholder="Task title…"
        value={title}
      />
      <div className="grid grid-cols-2 gap-2">
        <Select onValueChange={(v) => v && setLeadId(v)} value={leadId}>
          <SelectTrigger className="w-full text-xs">
            <span className="flex-1 truncate text-left">
              {leadId
                ? ((leads as Array<{ id: string; name: string }>).find(
                    (l) => l.id === leadId
                  )?.name ?? "Select lead…")
                : "Select lead…"}
            </span>
          </SelectTrigger>
          <SelectContent>
            {(leads as Array<{ id: string; name: string }>).map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <TaskTypePicker className="w-full" onChange={setType} value={type} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <DateTimePicker onChange={setDueAt} value={dueAt} />
        <IconSelect
          displayValue={
            assignee === "_self"
              ? "Myself"
              : (teamMembers.find((m) => m.id === assignee)?.name ?? "Select…")
          }
          icon={UserIcon}
          onValueChange={setAssignee}
          value={assignee}
        >
          <SelectItem value="_self">Myself</SelectItem>
          {teamMembers.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </IconSelect>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <IconSelect
          displayValue={
            recurrence === "none"
              ? "One-time"
              : (RECURRENCE_LABELS[recurrence] ?? recurrence)
          }
          icon={RepeatIcon}
          onValueChange={setRecurrence}
          value={recurrence}
        >
          <SelectItem value="none">One-time</SelectItem>
          {TASK_RECURRENCES.map((r) => (
            <SelectItem key={r} value={r}>
              {RECURRENCE_LABELS[r]}
            </SelectItem>
          ))}
        </IconSelect>
        {showMeetingFields && (
          <Input
            onChange={(e) => setMeetingLink(e.target.value)}
            placeholder="Meeting link (optional)"
            value={meetingLink}
          />
        )}
      </div>
      {showMeetingFields && (
        <label className="flex items-center gap-2 text-muted-foreground text-xs">
          <input
            checked={syncCalendar}
            className="rounded border"
            onChange={(e) => setSyncCalendar(e.target.checked)}
            type="checkbox"
          />
          Create Google Calendar event with Meet link
        </label>
      )}
      <div className="flex justify-end gap-2">
        <Button onClick={onClose} size="sm" variant="ghost">
          Cancel
        </Button>
        <Button
          disabled={createTask.isPending || !title.trim() || !dueAt || !leadId}
          onClick={handleSubmit}
          size="sm"
        >
          Add Task
        </Button>
      </div>
    </div>
  );
}

export function TasksPageClient() {
  const session = useSession();
  const currentUserId = session.data?.user?.id;

  const [viewMode, setViewMode] = useState<"mine" | "all">("mine");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);

  let effectiveUserId: string | undefined;
  if (viewMode === "mine") {
    effectiveUserId = currentUserId;
  } else if (userFilter !== "all") {
    effectiveUserId = userFilter;
  }

  const { data: allTasks = [], isLoading } = useTasks({
    userId: effectiveUserId ?? null,
  });
  const { data: teamMembers = [] } = useTeamMembers();
  const toggleTask = useToggleTask();
  const deleteTaskMut = useDeleteTask();

  const [showCompleted, setShowCompleted] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");

  let tasks = allTasks as TaskWithLead[];
  if (!showCompleted) {
    tasks = tasks.filter((t) => !t.completedAt);
  }
  if (typeFilter !== "all") {
    tasks = tasks.filter((t) => t.type === typeFilter);
  }

  const overdue = tasks.filter(
    (t) => !t.completedAt && dayjs(t.dueAt).isBefore(dayjs(), "minute")
  );
  const today = tasks.filter((t) => !t.completedAt && dayjs(t.dueAt).isToday());
  const upcoming = tasks.filter(
    (t) =>
      !(
        t.completedAt ||
        dayjs(t.dueAt).isBefore(dayjs(), "minute") ||
        dayjs(t.dueAt).isToday()
      )
  );
  const completed = tasks.filter((t) => !!t.completedAt);

  const openCount = (allTasks as TaskWithLead[]).filter(
    (t) => !t.completedAt
  ).length;
  const overdueCount = (allTasks as TaskWithLead[]).filter(
    (t) => !t.completedAt && dayjs(t.dueAt).isBefore(dayjs(), "minute")
  ).length;

  if (isLoading) {
    return <PageSkeleton header="Tasks" />;
  }

  function renderSection(
    title: string,
    items: TaskWithLead[],
    labelClass?: string
  ) {
    if (items.length === 0) {
      return null;
    }
    return (
      <div>
        <SectionHeader className={labelClass} count={items.length} divider>
          {title}
        </SectionHeader>
        <div className="space-y-0.5">
          {items.map((t) => (
            <TaskRow
              expanded={expandedId === t.id}
              key={t.id}
              onDelete={() =>
                deleteTaskMut.mutate({ id: t.id, leadId: t.leadId })
              }
              onToggleComplete={() =>
                toggleTask.mutate({
                  id: t.id,
                  isComplete: !!t.completedAt,
                  leadId: t.leadId,
                })
              }
              onToggleExpand={() =>
                setExpandedId(expandedId === t.id ? null : t.id)
              }
              showAssignee={viewMode === "all"}
              task={t}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h1 className="font-semibold text-lg tracking-tight">Tasks</h1>
            {openCount > 0 && <Pill>{openCount}</Pill>}
            {overdueCount > 0 && (
              <Pill variant="danger">{overdueCount} overdue</Pill>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SegmentedControl
              onChange={(v) => {
                setViewMode(v);
                if (v === "mine") {
                  setUserFilter("all");
                }
              }}
              segments={[
                { value: "mine" as const, label: "My Tasks" },
                { value: "all" as const, label: "All Tasks" },
              ]}
              value={viewMode}
            />

            {viewMode === "all" && teamMembers.length > 1 && (
              <IconSelect
                className="h-8 w-[140px]"
                displayValue={
                  userFilter === "all"
                    ? "Everyone"
                    : ((
                        teamMembers as Array<{ id: string; name: string }>
                      ).find((m) => m.id === userFilter)?.name ?? "Select…")
                }
                icon={UserIcon}
                onValueChange={setUserFilter}
                value={userFilter}
              >
                <SelectItem value="all">Everyone</SelectItem>
                {(
                  teamMembers as Array<{
                    id: string;
                    name: string;
                    email: string;
                  }>
                ).map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </IconSelect>
            )}

            <Select
              onValueChange={(v) => v && setTypeFilter(v)}
              value={typeFilter}
            >
              <SelectTrigger className="h-8 w-[120px] text-xs">
                <span className="flex-1 truncate text-left">
                  {TYPE_FILTERS.find((f) => f.value === typeFilter)?.label ??
                    "All types"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {TYPE_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => setShowCompleted(!showCompleted)}
              size="sm"
              variant="outline"
            >
              {showCompleted ? "Hide Done" : "Show Done"}
            </Button>
            <Button onClick={() => setShowAddTask(!showAddTask)} size="sm">
              <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
              Add Task
            </Button>
          </div>
        </div>
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {showAddTask && (
          <AddTaskForm
            onClose={() => setShowAddTask(false)}
            teamMembers={
              teamMembers as Array<{
                id: string;
                name: string;
                email: string;
              }>
            }
          />
        )}

        {tasks.length === 0 && !showAddTask && (
          <EmptyState
            className="py-20"
            icon={<HugeiconsIcon icon={Task01Icon} size={36} strokeWidth={1} />}
            message={emptyMessage(typeFilter, showCompleted)}
          />
        )}

        <div className="mx-auto max-w-2xl space-y-6">
          {renderSection("Overdue", overdue, "text-red-400")}
          {renderSection("Today", today, "text-amber-400")}
          {renderSection("Upcoming", upcoming)}
          {showCompleted &&
            renderSection("Completed", completed, "text-muted-foreground")}
        </div>
      </div>
    </div>
  );
}
