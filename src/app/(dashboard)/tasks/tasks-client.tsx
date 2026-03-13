"use client";

import {
  Cancel01Icon,
  CheckmarkCircle01Icon,
  ComputerVideoCallIcon,
  Delete02Icon,
  Edit02Icon,
  HelpCircleIcon,
  Link01Icon,
  Mail01Icon,
  Task01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";
import { DateTimePicker } from "@/components/date-time-picker";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { TaskCheckbox } from "@/components/task-checkbox";
import {
  RecurrenceBadge,
  TaskTypeBadge,
  TaskTypePicker,
} from "@/components/task-type-picker";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth-client";
import { TASK_TYPE_LABELS, TASK_TYPES } from "@/lib/constants";
import dayjs from "@/lib/dayjs";
import {
  useAddTaskAttendees,
  useCalendarEvent,
  useDeleteTask,
  useTasks,
  useTeamMembers,
  useToggleTask,
  useUpdateTask,
} from "@/lib/queries";
import { getInitials } from "@/lib/utils";

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

function getDueLabel(
  dueAt: Date,
  completed: boolean
): { text: string; className: string } {
  if (completed) {
    return { text: "Done", className: "text-muted-foreground" };
  }
  const d = dayjs(dueAt);
  const rel = d.fromNow();
  if (d.isToday()) {
    return {
      text: `Today · ${d.format("h:mm A")} · ${rel}`,
      className: "text-amber-400",
    };
  }
  if (d.isBefore(dayjs(), "minute")) {
    return {
      text: `Overdue · ${d.format("MMM D")} · ${rel}`,
      className: "text-red-400",
    };
  }
  if (d.isTomorrow()) {
    return {
      text: `Tomorrow · ${d.format("h:mm A")} · ${rel}`,
      className: "text-blue-400",
    };
  }
  return {
    text: `${d.format("MMM D · h:mm A")} · ${rel}`,
    className: "text-muted-foreground",
  };
}

const RSVP_CONFIG: Record<
  string,
  { icon: typeof CheckmarkCircle01Icon; label: string; className: string }
> = {
  accepted: {
    icon: CheckmarkCircle01Icon,
    label: "Accepted",
    className: "text-emerald-400",
  },
  declined: {
    icon: Cancel01Icon,
    label: "Declined",
    className: "text-red-400",
  },
  tentative: {
    icon: HelpCircleIcon,
    label: "Maybe",
    className: "text-amber-400",
  },
  needsAction: {
    icon: Mail01Icon,
    label: "Pending",
    className: "text-muted-foreground",
  },
};

// ---------------------------------------------------------------------------
// Meeting detail panel — fetches calendar event data for attendees
// ---------------------------------------------------------------------------
function MeetingDetail({
  calendarEventId,
  meetingLink,
  taskId,
  leadId,
}: {
  calendarEventId: string;
  meetingLink: string | null;
  taskId: string;
  leadId: string;
}) {
  const { data: event, isLoading } = useCalendarEvent(calendarEventId);
  const addAttendees = useAddTaskAttendees();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  function handleInvite() {
    if (!inviteEmail.trim()) {
      return;
    }
    addAttendees.mutate(
      {
        id: taskId,
        emails: [inviteEmail.trim()],
        calendarEventId,
        leadId,
      },
      {
        onSuccess: () => {
          setInviteEmail("");
          setShowInvite(false);
        },
      }
    );
  }

  const attendees = event?.attendees ?? [];

  return (
    <div className="space-y-3">
      {/* Meeting link */}
      {meetingLink && (
        <a
          className="inline-flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-1.5 text-emerald-400 text-xs transition-colors hover:bg-emerald-500/20"
          href={meetingLink}
          rel="noopener noreferrer"
          target="_blank"
        >
          <HugeiconsIcon
            icon={ComputerVideoCallIcon}
            size={14}
            strokeWidth={1.5}
          />
          Join Meeting
          <span className="text-emerald-400/60">
            {meetingLink.includes("meet.google") ? "Google Meet" : ""}
          </span>
        </a>
      )}

      {/* Attendees */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-widest">
            Attendees
            {!isLoading && ` (${attendees.length})`}
          </span>
          <button
            className="text-[11px] text-primary hover:underline"
            onClick={() => setShowInvite(!showInvite)}
            type="button"
          >
            + Invite
          </button>
        </div>

        {isLoading && <p className="text-muted-foreground text-xs">Loading…</p>}

        {!isLoading && attendees.length === 0 && (
          <p className="text-muted-foreground text-xs">No attendees yet</p>
        )}

        {attendees.length > 0 && (
          <div className="space-y-1">
            {attendees.map((a) => {
              const rsvp =
                RSVP_CONFIG[a.responseStatus ?? "needsAction"] ??
                RSVP_CONFIG.needsAction;
              const name = a.email.split("@")[0];
              return (
                <div
                  className="flex items-center gap-2 rounded-md px-1 py-0.5"
                  key={a.email}
                >
                  <Avatar className="size-5">
                    <AvatarFallback className="bg-muted text-[8px]">
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate text-xs">
                    {a.email}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-[10px] ${rsvp.className}`}
                  >
                    <HugeiconsIcon icon={rsvp.icon} size={10} strokeWidth={2} />
                    {rsvp.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {showInvite && (
          <div className="mt-2 flex items-center gap-2">
            <Input
              autoFocus
              className="h-7 flex-1 text-xs"
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleInvite();
                }
                if (e.key === "Escape") {
                  setShowInvite(false);
                }
              }}
              placeholder="email@example.com"
              type="email"
              value={inviteEmail}
            />
            <Button
              className="h-7 text-xs"
              disabled={!inviteEmail.trim() || addAttendees.isPending}
              onClick={handleInvite}
              size="sm"
            >
              {addAttendees.isPending ? "…" : "Send"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline edit panel (shown when task is expanded and user clicks Edit)
// ---------------------------------------------------------------------------
function InlineEditPanel({
  task: t,
  onClose,
}: {
  task: TaskWithLead;
  onClose: () => void;
}) {
  const updateTask = useUpdateTask();
  const [title, setTitle] = useState(t.title);
  const [description, setDescription] = useState(t.description ?? "");
  const [dueAt, setDueAt] = useState<Date | null>(new Date(t.dueAt));
  const [type, setType] = useState(t.type);

  function handleSave() {
    if (!(title.trim() && dueAt)) {
      return;
    }
    updateTask.mutate(
      {
        id: t.id,
        data: {
          title,
          description: description || undefined,
          dueAt,
          type,
        },
        leadId: t.leadId,
      },
      { onSuccess: onClose }
    );
  }

  return (
    <div className="space-y-2.5">
      <Input
        autoFocus
        className="text-sm"
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSave();
          }
        }}
        placeholder="Task title"
        value={title}
      />
      <Textarea
        className="min-h-[60px] text-xs"
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add a description…"
        value={description}
      />
      <div className="flex items-center gap-2">
        <TaskTypePicker className="flex-1" onChange={setType} value={type} />
        <DateTimePicker
          className="flex-1"
          onChange={(d) => setDueAt(d)}
          value={dueAt}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={onClose} size="sm" variant="ghost">
          Cancel
        </Button>
        <Button
          disabled={!(title.trim() && dueAt) || updateTask.isPending}
          onClick={handleSave}
          size="sm"
        >
          Save
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expanded detail panel for a single task
// ---------------------------------------------------------------------------
function TaskDetail({
  task: t,
  onDelete,
}: {
  task: TaskWithLead;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const isMeeting = t.type === "meeting" || t.type === "demo";

  if (editing) {
    return <InlineEditPanel onClose={() => setEditing(false)} task={t} />;
  }

  return (
    <div className="space-y-3">
      {/* Description */}
      {t.description && (
        <p className="text-muted-foreground text-xs">{t.description}</p>
      )}

      {/* Meeting detail */}
      {isMeeting && t.calendarEventId && (
        <MeetingDetail
          calendarEventId={t.calendarEventId}
          leadId={t.leadId}
          meetingLink={t.meetingLink}
          taskId={t.id}
        />
      )}

      {/* Non-calendar meeting link */}
      {isMeeting && !t.calendarEventId && t.meetingLink && (
        <a
          className="inline-flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-1.5 text-emerald-400 text-xs transition-colors hover:bg-emerald-500/20"
          href={t.meetingLink}
          rel="noopener noreferrer"
          target="_blank"
        >
          <HugeiconsIcon icon={Link01Icon} size={12} strokeWidth={1.5} />
          {t.meetingLink}
        </a>
      )}

      {/* Lead info */}
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

      {/* Assigned to */}
      {t.user && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Assigned:</span>
          <Avatar className="size-4">
            <AvatarFallback className="bg-primary/10 text-[7px] text-primary">
              {getInitials(t.user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs">{t.user.name}</span>
        </div>
      )}

      {/* Actions */}
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
  const isMeeting = t.type === "meeting" || t.type === "demo";
  const showJoin = isMeeting && t.meetingLink && !expanded;

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
              <a
                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 transition-colors hover:bg-emerald-500/20"
                href={t.meetingLink ?? ""}
                onClick={(e) => e.stopPropagation()}
                rel="noopener noreferrer"
                target="_blank"
              >
                <HugeiconsIcon
                  icon={ComputerVideoCallIcon}
                  size={10}
                  strokeWidth={2}
                />
                Join
              </a>
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
            <Avatar className="size-5">
              <AvatarFallback className="bg-primary/10 text-[7px] text-primary">
                {getInitials(t.user.name)}
              </AvatarFallback>
            </Avatar>
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

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export function TasksPageClient() {
  const session = useSession();
  const currentUserId = session.data?.user?.id;

  const [viewMode, setViewMode] = useState<"mine" | "all">("mine");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    return null;
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
        <h2
          className={`mb-1.5 flex items-center gap-2 font-medium text-[10px] uppercase tracking-widest ${labelClass ?? "text-muted-foreground"}`}
        >
          {title}
          <span className="font-mono">{items.length}</span>
          <span className="h-px flex-1 bg-border" />
        </h2>
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
            {openCount > 0 && (
              <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-muted-foreground text-xs">
                {openCount}
              </span>
            )}
            {overdueCount > 0 && (
              <span className="rounded-sm bg-red-500/15 px-1.5 py-0.5 font-mono text-red-400 text-xs">
                {overdueCount} overdue
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border bg-muted/30 p-0.5">
              <button
                className={`rounded-sm px-2.5 py-1 text-xs transition-all ${
                  viewMode === "mine"
                    ? "bg-background font-medium shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  setViewMode("mine");
                  setUserFilter("all");
                }}
                type="button"
              >
                My Tasks
              </button>
              <button
                className={`rounded-sm px-2.5 py-1 text-xs transition-all ${
                  viewMode === "all"
                    ? "bg-background font-medium shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setViewMode("all")}
                type="button"
              >
                All Tasks
              </button>
            </div>

            {viewMode === "all" && teamMembers.length > 1 && (
              <Select
                onValueChange={(v) => v && setUserFilter(v)}
                value={userFilter}
              >
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <HugeiconsIcon
                    className="mr-1 text-muted-foreground"
                    icon={UserIcon}
                    size={12}
                    strokeWidth={1.5}
                  />
                  <span className="flex-1 truncate text-left">
                    {userFilter === "all"
                      ? "Everyone"
                      : ((
                          teamMembers as Array<{ id: string; name: string }>
                        ).find((m) => m.id === userFilter)?.name ?? "Select…")}
                  </span>
                </SelectTrigger>
                <SelectContent>
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
                </SelectContent>
              </Select>
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
          </div>
        </div>
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <HugeiconsIcon
              className="mb-3 opacity-40"
              icon={Task01Icon}
              size={36}
              strokeWidth={1}
            />
            <p className="text-sm">{emptyMessage(typeFilter, showCompleted)}</p>
          </div>
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
