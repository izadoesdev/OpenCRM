"use client";

import {
  Calendar01Icon,
  Delete02Icon,
  Edit02Icon,
  MoreHorizontalIcon,
  RepeatIcon,
  Task01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { TaskCheckbox } from "@/components/task-checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/lib/auth-client";
import {
  RECURRENCE_LABELS,
  TASK_TYPE_LABELS,
  TASK_TYPES,
} from "@/lib/constants";
import {
  useDeleteTask,
  useRescheduleTask,
  useTasks,
  useTeamMembers,
  useToggleTask,
  useUpdateTask,
} from "@/lib/queries";

interface TaskUser {
  email: string;
  id: string;
  image: string | null;
  name: string;
}

interface TaskWithLead {
  completedAt: Date | null;
  description: string | null;
  dueAt: Date;
  id: string;
  lead: { id: string; name: string; status: string } | null;
  leadId: string;
  recurrence: string | null;
  title: string;
  type: string;
  user: TaskUser | null;
  userId: string | null;
}

function getInitials(name?: string | null) {
  if (!name) {
    return "?";
  }
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
  if (isPast(dueAt)) {
    return {
      text: `Overdue · ${format(dueAt, "MMM d")}`,
      className: "text-red-400",
    };
  }
  if (isToday(dueAt)) {
    return {
      text: `Today · ${format(dueAt, "h:mm a")}`,
      className: "text-amber-400",
    };
  }
  if (isTomorrow(dueAt)) {
    return {
      text: `Tomorrow · ${format(dueAt, "h:mm a")}`,
      className: "text-blue-400",
    };
  }
  return {
    text: format(dueAt, "MMM d · h:mm a"),
    className: "text-muted-foreground",
  };
}

function getEmptyMessage(typeFilter: string, showCompleted: boolean): string {
  if (typeFilter !== "all") {
    const label = TASK_TYPE_LABELS[typeFilter]?.toLowerCase() ?? typeFilter;
    return `No ${label} tasks`;
  }
  return showCompleted ? "No tasks at all" : "All caught up";
}

export function TasksPageClient() {
  const session = useSession();
  const currentUserId = session.data?.user?.id;

  const [viewMode, setViewMode] = useState<"mine" | "all">("mine");
  const [userFilter, setUserFilter] = useState<string>("all");

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
  const rescheduleTaskMut = useRescheduleTask();
  const updateTaskMut = useUpdateTask();

  const [showCompleted, setShowCompleted] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [editingTask, setEditingTask] = useState<TaskWithLead | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDue, setEditDue] = useState("");
  const [editType, setEditType] = useState("follow_up");

  let tasks = allTasks as TaskWithLead[];
  if (!showCompleted) {
    tasks = tasks.filter((t) => !t.completedAt);
  }
  if (typeFilter !== "all") {
    tasks = tasks.filter((t) => t.type === typeFilter);
  }

  const overdue = tasks.filter(
    (t) => !t.completedAt && isPast(new Date(t.dueAt))
  );
  const today = tasks.filter(
    (t) => !t.completedAt && isToday(new Date(t.dueAt))
  );
  const upcoming = tasks.filter(
    (t) =>
      !(
        t.completedAt ||
        isPast(new Date(t.dueAt)) ||
        isToday(new Date(t.dueAt))
      )
  );
  const completed = tasks.filter((t) => !!t.completedAt);

  function openEdit(task: TaskWithLead) {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDue(format(new Date(task.dueAt), "yyyy-MM-dd'T'HH:mm"));
    setEditType(task.type);
  }

  function handleSaveEdit() {
    if (!(editingTask && editTitle.trim())) {
      return;
    }
    updateTaskMut.mutate({
      id: editingTask.id,
      data: { title: editTitle, dueAt: new Date(editDue), type: editType },
      leadId: editingTask.leadId,
    });
    setEditingTask(null);
  }

  const openCount = (allTasks as TaskWithLead[]).filter(
    (t) => !t.completedAt
  ).length;
  const overdueCount = (allTasks as TaskWithLead[]).filter(
    (t) => !t.completedAt && isPast(new Date(t.dueAt))
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
          {items.map((t) => {
            const isComplete = !!t.completedAt;
            const due = getDueLabel(new Date(t.dueAt), isComplete);
            const showAssignee = viewMode === "all" && t.user;
            return (
              <div
                className="group flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted/40"
                key={t.id}
              >
                <TaskCheckbox
                  checked={isComplete}
                  onChange={() =>
                    toggleTask.mutate({
                      id: t.id,
                      isComplete,
                      leadId: t.leadId,
                    })
                  }
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm leading-tight ${isComplete ? "text-muted-foreground line-through" : ""}`}
                  >
                    {t.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {t.lead && (
                      <Link
                        className="text-xs transition-colors hover:text-foreground hover:underline"
                        href={`/leads/${t.lead.id}`}
                      >
                        {t.lead.name}
                      </Link>
                    )}
                    {t.lead && <StatusBadge status={t.lead.status} />}
                    <span className="rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground uppercase">
                      {TASK_TYPE_LABELS[t.type] ?? t.type}
                    </span>
                    {t.recurrence && (
                      <span className="flex items-center gap-0.5 rounded bg-violet-500/15 px-1 py-0.5 text-[9px] text-violet-400 uppercase">
                        <HugeiconsIcon
                          icon={RepeatIcon}
                          size={8}
                          strokeWidth={2}
                        />
                        {RECURRENCE_LABELS[t.recurrence] ?? t.recurrence}
                      </span>
                    )}
                    <span className={`text-xs ${due.className}`}>
                      {due.text}
                    </span>
                  </div>
                </div>

                {showAssignee && t.user && (
                  <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                    <Avatar className="size-5">
                      <AvatarFallback className="bg-primary/10 text-[7px] text-primary">
                        {getInitials(t.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-muted-foreground text-xs lg:inline">
                      {t.user.name?.split(" ")[0]}
                    </span>
                  </div>
                )}

                <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
                  {!isComplete && (
                    <Button
                      onClick={() =>
                        rescheduleTaskMut.mutate({
                          id: t.id,
                          days: 1,
                          leadId: t.leadId,
                        })
                      }
                      size="icon-sm"
                      title="+1 day"
                      variant="ghost"
                    >
                      <span className="font-mono text-[9px]">+1d</span>
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button size="icon-sm" variant="ghost" />}
                    >
                      <HugeiconsIcon
                        icon={MoreHorizontalIcon}
                        size={12}
                        strokeWidth={1.5}
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(t)}>
                        <HugeiconsIcon
                          icon={Edit02Icon}
                          size={14}
                          strokeWidth={1.5}
                        />
                        Edit
                      </DropdownMenuItem>
                      {!isComplete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              rescheduleTaskMut.mutate({
                                id: t.id,
                                days: 1,
                                leadId: t.leadId,
                              })
                            }
                          >
                            <HugeiconsIcon
                              icon={Calendar01Icon}
                              size={14}
                              strokeWidth={1.5}
                            />
                            Tomorrow
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              rescheduleTaskMut.mutate({
                                id: t.id,
                                days: 3,
                                leadId: t.leadId,
                              })
                            }
                          >
                            <HugeiconsIcon
                              icon={Calendar01Icon}
                              size={14}
                              strokeWidth={1.5}
                            />
                            +3 days
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              rescheduleTaskMut.mutate({
                                id: t.id,
                                days: 7,
                                leadId: t.leadId,
                              })
                            }
                          >
                            <HugeiconsIcon
                              icon={Calendar01Icon}
                              size={14}
                              strokeWidth={1.5}
                            />
                            +1 week
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          deleteTaskMut.mutate({
                            id: t.id,
                            leadId: t.leadId,
                          })
                        }
                        variant="destructive"
                      >
                        <HugeiconsIcon
                          icon={Delete02Icon}
                          size={14}
                          strokeWidth={1.5}
                        />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
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
            {/* My / All toggle */}
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

            {/* User filter (only in All mode) */}
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
                  <SelectValue />
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
                <SelectValue />
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
            <p className="text-sm">
              {getEmptyMessage(typeFilter, showCompleted)}
            </p>
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

      {/* Edit dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setEditingTask(null);
          }
        }}
        open={!!editingTask}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              autoFocus
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSaveEdit();
                }
              }}
              placeholder="Task title"
              value={editTitle}
            />
            <Select onValueChange={(v) => v && setEditType(v)} value={editType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TASK_TYPE_LABELS[t] ?? t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              onChange={(e) => setEditDue(e.target.value)}
              type="datetime-local"
              value={editDue}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEdit} size="sm">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
