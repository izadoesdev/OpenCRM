import {
  Add01Icon,
  CallIcon,
  Delete02Icon,
  Edit02Icon,
  LinkSquare01Icon,
  Mail01Icon,
  RepeatIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DateTimePicker } from "@/components/date-time-picker";
import {
  MeetingDetail,
  MeetingLinkBadge,
  MeetingLinkPill,
} from "@/components/meeting-detail";
import { IconSelect, SectionHeader, UserAvatar } from "@/components/micro";
import { TaskCheckbox } from "@/components/task-checkbox";
import { TaskInlineEdit } from "@/components/task-inline-edit";
import {
  RecurrenceBadge,
  TaskTypeBadge,
  TaskTypePicker,
} from "@/components/task-type-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SelectItem } from "@/components/ui/select";
import { RECURRENCE_LABELS, TASK_RECURRENCES } from "@/lib/constants";
import dayjs from "@/lib/dayjs";
import { useCreateTask, useDeleteTask, useToggleTask } from "@/lib/queries";
import { isMeetingType } from "@/lib/utils";

export interface TeamMember {
  email: string;
  id: string;
  image: string | null;
  name: string;
}

export interface LeadTask {
  calendarEventId: string | null;
  completedAt: Date | null;
  description: string | null;
  dueAt: Date;
  id: string;
  meetingLink: string | null;
  recurrence: string | null;
  title: string;
  type: string;
  user: { id: string; name: string } | null;
}

export function LeadTasksSidebar({
  leadId,
  leadPhone,
  tasks,
  teamMembers,
  currentUserId,
}: {
  leadId: string;
  leadPhone?: string | null;
  tasks: LeadTask[];
  teamMembers: TeamMember[];
  currentUserId?: string;
}) {
  const others = currentUserId
    ? teamMembers.filter((m) => m.id !== currentUserId)
    : teamMembers;
  const openTasks = tasks.filter((t) => !t.completedAt);
  const completedTasks = tasks.filter((t) => !!t.completedAt);
  const createTask = useCreateTask();
  const toggleTask = useToggleTask();
  const deleteTaskMut = useDeleteTask();

  const [showAddTask, setShowAddTask] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDue, setNewTaskDue] = useState<Date | null>(null);
  const [newTaskType, setNewTaskType] = useState("follow_up");
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>("_self");
  const [newTaskRecurrence, setNewTaskRecurrence] = useState<string>("none");
  const [newTaskMeetingLink, setNewTaskMeetingLink] = useState("");
  const [newTaskSyncCalendar, setNewTaskSyncCalendar] = useState(true);

  useEffect(() => {
    if (newTaskType !== "follow_up" && newTaskType !== "call") {
      setNewTaskRecurrence("none");
    }
  }, [newTaskType]);

  function handleAddTask() {
    if (!(newTaskTitle.trim() && newTaskDue)) {
      return;
    }
    const isMeeting = isMeetingType(newTaskType);
    createTask.mutate(
      {
        leadId,
        title: newTaskTitle,
        dueAt: newTaskDue,
        type: newTaskType,
        userId: newTaskAssignee === "_self" ? undefined : newTaskAssignee,
        recurrence: newTaskRecurrence === "none" ? null : newTaskRecurrence,
        meetingLink: newTaskMeetingLink.trim() || null,
        syncToCalendar: newTaskSyncCalendar && isMeeting,
      },
      {
        onSuccess: () => {
          setNewTaskTitle("");
          setNewTaskDue(null);
          setNewTaskType("follow_up");
          setNewTaskAssignee("_self");
          setNewTaskRecurrence("none");
          setNewTaskMeetingLink("");
          setShowAddTask(false);
        },
      }
    );
  }

  const showMeetingFields = isMeetingType(newTaskType);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between px-5 pt-4 pb-2">
        <SectionHeader count={openTasks.length}>Tasks</SectionHeader>
        <Button
          onClick={() => {
            setShowAddTask(!showAddTask);
            if (!showAddTask) {
              setNewTaskDue(null);
            }
          }}
          size="icon-sm"
          variant="ghost"
        >
          <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
        </Button>
      </div>

      {showAddTask && (
        <AddTaskForm
          createTask={createTask}
          newTaskAssignee={newTaskAssignee}
          newTaskDue={newTaskDue}
          newTaskMeetingLink={newTaskMeetingLink}
          newTaskRecurrence={newTaskRecurrence}
          newTaskSyncCalendar={newTaskSyncCalendar}
          newTaskTitle={newTaskTitle}
          newTaskType={newTaskType}
          onSubmit={handleAddTask}
          others={others}
          setNewTaskAssignee={setNewTaskAssignee}
          setNewTaskDue={setNewTaskDue}
          setNewTaskMeetingLink={setNewTaskMeetingLink}
          setNewTaskRecurrence={setNewTaskRecurrence}
          setNewTaskSyncCalendar={setNewTaskSyncCalendar}
          setNewTaskTitle={setNewTaskTitle}
          setNewTaskType={setNewTaskType}
          setShowAddTask={setShowAddTask}
          showMeetingFields={showMeetingFields}
          teamMembers={teamMembers}
        />
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {openTasks.length === 0 && !showAddTask && (
          <p className="py-6 text-center text-muted-foreground text-xs">
            No open tasks
          </p>
        )}
        <div className="space-y-0.5">
          {openTasks.map((t) => (
            <LeadTaskRow
              expanded={expandedTaskId === t.id}
              key={t.id}
              leadId={leadId}
              leadPhone={leadPhone}
              onDelete={deleteTaskMut}
              onToggle={toggleTask}
              onToggleExpand={() =>
                setExpandedTaskId(expandedTaskId === t.id ? null : t.id)
              }
              task={t}
            />
          ))}
        </div>

        {completedTasks.length > 0 && (
          <div className="mt-4">
            <p className="mb-1 px-2 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
              Completed ({completedTasks.length})
            </p>
            <div className="space-y-0.5">
              {completedTasks.map((t) => (
                <LeadTaskRow
                  expanded={expandedTaskId === t.id}
                  key={t.id}
                  leadId={leadId}
                  leadPhone={leadPhone}
                  onDelete={deleteTaskMut}
                  onToggle={toggleTask}
                  onToggleExpand={() =>
                    setExpandedTaskId(expandedTaskId === t.id ? null : t.id)
                  }
                  task={t}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add task form ───────────────────────────────────────────────────────────
function AddTaskForm({
  newTaskTitle,
  setNewTaskTitle,
  onSubmit,
  newTaskType,
  setNewTaskType,
  newTaskDue,
  setNewTaskDue,
  newTaskAssignee,
  setNewTaskAssignee,
  newTaskRecurrence,
  setNewTaskRecurrence,
  newTaskMeetingLink,
  setNewTaskMeetingLink,
  newTaskSyncCalendar,
  setNewTaskSyncCalendar,
  showMeetingFields,
  teamMembers,
  others,
  createTask,
  setShowAddTask,
}: {
  newTaskTitle: string;
  setNewTaskTitle: (v: string) => void;
  onSubmit: () => void;
  newTaskType: string;
  setNewTaskType: (v: string) => void;
  newTaskDue: Date | null;
  setNewTaskDue: (v: Date | null) => void;
  newTaskAssignee: string;
  setNewTaskAssignee: (v: string) => void;
  newTaskRecurrence: string;
  setNewTaskRecurrence: (v: string) => void;
  newTaskMeetingLink: string;
  setNewTaskMeetingLink: (v: string) => void;
  newTaskSyncCalendar: boolean;
  setNewTaskSyncCalendar: (v: boolean) => void;
  showMeetingFields: boolean;
  teamMembers: TeamMember[];
  others: TeamMember[];
  createTask: { isPending: boolean };
  setShowAddTask: (v: boolean) => void;
}) {
  return (
    <div className="mx-5 mb-3 shrink-0 space-y-2 rounded-md border p-3">
      <Input
        autoFocus
        onChange={(e) => setNewTaskTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Task title..."
        value={newTaskTitle}
      />
      <div className="grid grid-cols-2 gap-2">
        <TaskTypePicker
          className="w-full"
          onChange={setNewTaskType}
          value={newTaskType}
        />
        <DateTimePicker onChange={setNewTaskDue} value={newTaskDue} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <IconSelect
          displayValue={
            newTaskAssignee === "_self"
              ? "Myself"
              : (teamMembers.find((m) => m.id === newTaskAssignee)?.name ??
                "Select...")
          }
          icon={UserIcon}
          onValueChange={setNewTaskAssignee}
          value={newTaskAssignee}
        >
          <SelectItem value="_self">Myself</SelectItem>
          {others.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </IconSelect>
        {(newTaskType === "follow_up" || newTaskType === "call") && (
          <IconSelect
            displayValue={
              newTaskRecurrence === "none"
                ? "One-time"
                : (RECURRENCE_LABELS[newTaskRecurrence] ?? newTaskRecurrence)
            }
            icon={RepeatIcon}
            onValueChange={setNewTaskRecurrence}
            value={newTaskRecurrence}
          >
            <SelectItem value="none">One-time</SelectItem>
            {TASK_RECURRENCES.map((r) => (
              <SelectItem key={r} value={r}>
                {RECURRENCE_LABELS[r]}
              </SelectItem>
            ))}
          </IconSelect>
        )}
      </div>
      {showMeetingFields && (
        <>
          <Input
            onChange={(e) => setNewTaskMeetingLink(e.target.value)}
            placeholder="Meeting link (or leave empty for Meet)"
            value={newTaskMeetingLink}
          />
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Checkbox
              checked={newTaskSyncCalendar}
              id="sync-cal-lead"
              onCheckedChange={(checked) => setNewTaskSyncCalendar(checked)}
            />
            <label className="cursor-pointer" htmlFor="sync-cal-lead">
              Create Google Calendar event with Meet link
            </label>
          </div>
        </>
      )}
      <div className="flex justify-end gap-2">
        <Button onClick={() => setShowAddTask(false)} size="sm" variant="ghost">
          Cancel
        </Button>
        <Button
          disabled={createTask.isPending || !newTaskTitle.trim() || !newTaskDue}
          onClick={onSubmit}
          size="sm"
        >
          Add Task
        </Button>
      </div>
    </div>
  );
}

// ── Task row ────────────────────────────────────────────────────────────────
function LeadTaskRow({
  task: t,
  leadId,
  leadPhone,
  expanded,
  onToggleExpand,
  onToggle,
  onDelete,
}: {
  task: LeadTask;
  leadId: string;
  leadPhone?: string | null;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggle: ReturnType<typeof useToggleTask>;
  onDelete: ReturnType<typeof useDeleteTask>;
}) {
  const isComplete = !!t.completedAt;
  const overdue = !isComplete && dayjs(t.dueAt).isBefore(dayjs(), "minute");
  const showJoin = isMeetingType(t.type) && t.meetingLink && !expanded;

  return (
    <div
      className={`rounded-lg transition-colors ${
        expanded ? "bg-muted/50" : "hover:bg-muted/30"
      }`}
    >
      <button
        className="flex w-full cursor-pointer items-start gap-2 px-2 py-1.5 text-left"
        onClick={onToggleExpand}
        type="button"
      >
        {/* biome-ignore lint/a11y: checkbox handles its own a11y */}
        <span className="pt-0.5" onClick={(e) => e.stopPropagation()}>
          <TaskCheckbox
            checked={isComplete}
            onChange={() => onToggle.mutate({ id: t.id, isComplete, leadId })}
          />
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
            <TaskQuickActions
              expanded={expanded}
              leadId={leadId}
              leadPhone={leadPhone}
              type={t.type}
            />
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-1">
            <TaskTypeBadge type={t.type} />
            <RecurrenceBadge recurrence={t.recurrence} />
            <span
              className={`text-[11px] ${overdue ? "text-red-600" : "text-muted-foreground"}`}
            >
              {dayjs(t.dueAt).format("h:mm A")} · {dayjs(t.dueAt).fromNow()}
            </span>
          </span>
        </span>
      </button>

      {expanded && (
        <div className="border-border/50 border-t px-2 pt-2 pb-2 pl-8">
          <LeadTaskDetail
            leadId={leadId}
            leadPhone={leadPhone}
            onDelete={() => onDelete.mutate({ id: t.id, leadId })}
            task={t}
          />
        </div>
      )}
    </div>
  );
}

// ── Quick action pills on task row ──────────────────────────────────────────
function TaskQuickActions({
  type,
  expanded,
  leadPhone,
  leadId,
}: {
  type: string;
  expanded: boolean;
  leadPhone?: string | null;
  leadId: string;
}) {
  if (expanded) {
    return null;
  }
  return (
    <>
      {type === "call" && leadPhone && (
        <a
          className="shrink-0 rounded-sm bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700 transition-colors hover:bg-blue-100"
          href={`tel:${leadPhone}`}
          onClick={(e) => e.stopPropagation()}
        >
          Call
        </a>
      )}
      {type === "email" && (
        <Link
          className="shrink-0 rounded-sm bg-violet-50 px-1.5 py-0.5 text-[10px] text-violet-700 transition-colors hover:bg-violet-100"
          href={`/leads/${leadId}`}
          onClick={(e) => e.stopPropagation()}
        >
          Email
        </Link>
      )}
      {type === "linkedin" && (
        <a
          className="shrink-0 rounded-sm bg-sky-50 px-1.5 py-0.5 text-[10px] text-sky-700 transition-colors hover:bg-sky-100"
          href="https://linkedin.com"
          onClick={(e) => e.stopPropagation()}
          rel="noopener noreferrer"
          target="_blank"
        >
          LinkedIn
        </a>
      )}
    </>
  );
}

// ── Task detail (expanded) ──────────────────────────────────────────────────
function LeadTaskDetail({
  task: t,
  leadId,
  leadPhone,
  onDelete,
}: {
  task: LeadTask;
  leadId: string;
  leadPhone?: string | null;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <TaskInlineEdit
        leadId={leadId}
        onClose={() => setEditing(false)}
        task={t}
      />
    );
  }

  return (
    <div className="space-y-2">
      {t.description && (
        <p className="text-muted-foreground text-xs">{t.description}</p>
      )}

      {isMeetingType(t.type) && t.calendarEventId && (
        <MeetingDetail
          calendarEventId={t.calendarEventId}
          leadId={leadId}
          meetingLink={t.meetingLink}
          taskId={t.id}
        />
      )}

      {isMeetingType(t.type) && !t.calendarEventId && t.meetingLink && (
        <MeetingLinkBadge href={t.meetingLink} />
      )}

      {t.user && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Assigned:</span>
          <UserAvatar name={t.user.name} size="xs" />
          <span className="text-xs">{t.user.name}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {t.type === "call" && leadPhone && (
          <a
            className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted/50"
            href={`tel:${leadPhone}`}
            onClick={(e) => e.stopPropagation()}
          >
            <HugeiconsIcon icon={CallIcon} size={12} strokeWidth={1.5} />
            Call
          </a>
        )}
        {t.type === "email" && (
          <Link
            className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted/50"
            href={`/leads/${leadId}`}
            onClick={(e) => e.stopPropagation()}
          >
            <HugeiconsIcon icon={Mail01Icon} size={12} strokeWidth={1.5} />
            Send Email
          </Link>
        )}
        {t.type === "linkedin" && (
          <a
            className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted/50"
            href="https://linkedin.com"
            onClick={(e) => e.stopPropagation()}
            rel="noopener noreferrer"
            target="_blank"
          >
            <HugeiconsIcon
              icon={LinkSquare01Icon}
              size={12}
              strokeWidth={1.5}
            />
            Open LinkedIn
          </a>
        )}
      </div>

      <div className="flex items-center gap-2 border-t pt-2">
        <Button onClick={() => setEditing(true)} size="sm" variant="outline">
          <HugeiconsIcon icon={Edit02Icon} size={12} strokeWidth={1.5} />
          Edit
        </Button>
        <Button
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
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
