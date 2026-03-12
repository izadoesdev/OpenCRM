"use client";

import {
  Calendar01Icon,
  Delete02Icon,
  Edit02Icon,
  MoreHorizontalIcon,
  Task01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { addDays, format, isPast, isToday, isTomorrow } from "date-fns";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
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
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  completeTask,
  deleteTask,
  rescheduleTask,
  uncompleteTask,
  updateTask,
} from "@/lib/actions/tasks";
import { STATUS_COLORS, STATUS_LABELS, TASK_TYPES } from "@/lib/constants";

interface TaskWithLead {
  completedAt: Date | null;
  description: string | null;
  dueAt: Date;
  id: string;
  lead: {
    id: string;
    name: string;
    status: string;
  } | null;
  leadId: string;
  title: string;
  type: string;
}

const TASK_TYPE_LABELS: Record<string, string> = {
  follow_up: "Follow-up",
  demo: "Demo",
  call: "Call",
  email: "Email",
  other: "Other",
};

const TYPE_FILTERS = [
  { value: "all", label: "All types" },
  ...TASK_TYPES.map((t) => ({
    value: t,
    label: TASK_TYPE_LABELS[t] ?? t,
  })),
];

type OptimisticAction =
  | { type: "toggle"; id: string; completed: boolean }
  | { type: "delete"; id: string }
  | { type: "update"; id: string; data: Partial<TaskWithLead> };

function optimisticReducer(
  tasks: TaskWithLead[],
  action: OptimisticAction
): TaskWithLead[] {
  switch (action.type) {
    case "toggle":
      return tasks.map((t) =>
        t.id === action.id
          ? {
              ...t,
              completedAt: action.completed ? new Date() : null,
            }
          : t
      );
    case "delete":
      return tasks.filter((t) => t.id !== action.id);
    case "update":
      return tasks.map((t) =>
        t.id === action.id ? { ...t, ...action.data } : t
      );
    default:
      return tasks;
  }
}

function getDueLabel(
  dueAt: Date,
  completed: boolean
): {
  text: string;
  className: string;
} {
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

export function TasksPageClient({
  initialTasks,
}: {
  initialTasks: TaskWithLead[];
}) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [optimisticTasks, dispatch] = useOptimistic(
    initialTasks,
    optimisticReducer
  );

  const [editingTask, setEditingTask] = useState<TaskWithLead | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDue, setEditDue] = useState("");
  const [editType, setEditType] = useState("follow_up");

  let tasks = optimisticTasks;
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

  function handleToggle(task: TaskWithLead) {
    const wasCompleted = !!task.completedAt;
    startTransition(async () => {
      dispatch({
        type: "toggle",
        id: task.id,
        completed: !wasCompleted,
      });
      if (wasCompleted) {
        await uncompleteTask(task.id);
        toast("Task reopened");
      } else {
        await completeTask(task.id);
        toast.success("Task completed");
      }
    });
  }

  function handleDelete(task: TaskWithLead) {
    startTransition(async () => {
      dispatch({ type: "delete", id: task.id });
      await deleteTask(task.id);
      toast("Task deleted");
    });
  }

  function handleReschedule(task: TaskWithLead, days: number) {
    const labels: Record<number, string> = {
      1: "tomorrow",
      3: "in 3 days",
      7: "in 1 week",
    };
    startTransition(async () => {
      const baseDate =
        new Date(task.dueAt) < new Date() ? new Date() : new Date(task.dueAt);
      dispatch({
        type: "update",
        id: task.id,
        data: { dueAt: addDays(baseDate, days) },
      });
      await rescheduleTask(task.id, days);
      toast(`Rescheduled ${labels[days] ?? `+${days}d`}`);
    });
  }

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
    const taskId = editingTask.id;
    startTransition(async () => {
      dispatch({
        type: "update",
        id: taskId,
        data: {
          title: editTitle,
          dueAt: new Date(editDue),
          type: editType,
        },
      });
      await updateTask(taskId, {
        title: editTitle,
        dueAt: new Date(editDue),
        type: editType,
      });
      setEditingTask(null);
      toast.success("Task updated");
    });
  }

  function handleEditTypeChange(v: string | null) {
    if (v) {
      setEditType(v);
    }
  }

  function handleTypeFilterChange(v: string | null) {
    if (v) {
      setTypeFilter(v);
    }
  }

  const openCount = optimisticTasks.filter((t) => !t.completedAt).length;
  const overdueCount = optimisticTasks.filter(
    (t) => !t.completedAt && isPast(new Date(t.dueAt))
  ).length;

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <Separator className="h-5" orientation="vertical" />
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
            <Select onValueChange={handleTypeFilterChange} value={typeFilter}>
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
      </header>

      <div className="flex-1 overflow-y-auto p-4">
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
            <div className="space-y-1.5">
              <label
                className="text-muted-foreground text-xs"
                htmlFor="edit-task-title"
              >
                Title
              </label>
              <Input
                autoFocus
                id="edit-task-title"
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveEdit();
                  }
                }}
                value={editTitle}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  className="text-muted-foreground text-xs"
                  htmlFor="edit-task-type"
                >
                  Type
                </label>
                <Select onValueChange={handleEditTypeChange} value={editType}>
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
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-muted-foreground text-xs"
                  htmlFor="edit-task-due"
                >
                  Due
                </label>
                <Input
                  id="edit-task-due"
                  onChange={(e) => setEditDue(e.target.value)}
                  type="datetime-local"
                  value={editDue}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button disabled={isPending} onClick={handleSaveEdit}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  function renderSection(title: string, items: TaskWithLead[], color?: string) {
    if (items.length === 0) {
      return null;
    }
    return (
      <div>
        <h3
          className={`mb-2 font-medium text-xs uppercase tracking-wider ${color ?? "text-muted-foreground"}`}
        >
          {title} <span className="font-mono">({items.length})</span>
        </h3>
        <div className="space-y-1">
          {items.map((t) => {
            const due = getDueLabel(new Date(t.dueAt), !!t.completedAt);
            const isComplete = !!t.completedAt;

            return (
              <div
                className={`group flex items-start gap-3 rounded-md border px-3 py-2.5 transition-colors hover:bg-muted/30 ${isComplete ? "opacity-50" : ""}`}
                key={t.id}
              >
                <button
                  className={`mt-0.5 flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border transition-colors ${
                    isComplete
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input hover:border-primary/50 hover:bg-primary/10"
                  }`}
                  onClick={() => handleToggle(t)}
                  type="button"
                >
                  {isComplete && (
                    <HugeiconsIcon
                      icon={Tick01Icon}
                      size={10}
                      strokeWidth={2.5}
                    />
                  )}
                </button>

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
                    {t.lead && (
                      <span
                        className={`rounded-sm px-1 py-0.5 text-[9px] uppercase tracking-wider ${STATUS_COLORS[t.lead.status]}`}
                      >
                        {STATUS_LABELS[t.lead.status]}
                      </span>
                    )}
                    <span className={`text-xs ${due.className}`}>
                      {due.text}
                    </span>
                    <span className="rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground uppercase">
                      {TASK_TYPE_LABELS[t.type] ?? t.type}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  {!isComplete && (
                    <>
                      <Button
                        onClick={() => handleReschedule(t, 1)}
                        size="icon-sm"
                        title="+1 day"
                        variant="ghost"
                      >
                        <span className="font-mono text-[9px]">+1d</span>
                      </Button>
                      <Button
                        onClick={() => handleReschedule(t, 3)}
                        size="icon-sm"
                        title="+3 days"
                        variant="ghost"
                      >
                        <span className="font-mono text-[9px]">+3d</span>
                      </Button>
                    </>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button size="icon-sm" variant="ghost" />}
                    >
                      <HugeiconsIcon
                        icon={MoreHorizontalIcon}
                        size={14}
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
                          <DropdownMenuItem
                            onClick={() => handleReschedule(t, 1)}
                          >
                            <HugeiconsIcon
                              icon={Calendar01Icon}
                              size={14}
                              strokeWidth={1.5}
                            />
                            Tomorrow
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleReschedule(t, 3)}
                          >
                            <HugeiconsIcon
                              icon={Calendar01Icon}
                              size={14}
                              strokeWidth={1.5}
                            />
                            +3 days
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleReschedule(t, 7)}
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
                        onClick={() => handleDelete(t)}
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
}
