"use client";

import {
  Add01Icon,
  ArrowLeft02Icon,
  Calendar01Icon,
  CallIcon,
  Delete02Icon,
  Edit02Icon,
  Globe02Icon,
  LinkSquare01Icon,
  Mail01Icon,
  MoreHorizontalIcon,
  Note01Icon,
  SentIcon,
  Task01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { addDays, format, formatDistanceToNow, isPast } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { EmailComposeDialog } from "@/components/email-compose-dialog";
import { LeadFormDialog } from "@/components/lead-form-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { deleteLead } from "@/lib/actions/leads";
import { addNote, changeLeadStatus, logOutreach } from "@/lib/actions/status";
import {
  completeTask,
  createTask,
  deleteTask,
  rescheduleTask,
  uncompleteTask,
} from "@/lib/actions/tasks";
import {
  LEAD_PLANS,
  LEAD_STATUSES,
  SOURCE_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  TASK_TYPES,
} from "@/lib/constants";

interface LeadDetail {
  activities: Array<{
    id: string;
    type: string;
    content: string | null;
    metadata: unknown;
    createdAt: Date;
    user: { name: string; email: string } | null;
  }>;
  assignedTo: string | null;
  assignedUser: { name: string; email: string } | null;
  churnedAt: Date | null;
  company: string | null;
  convertedAt: Date | null;
  createdAt: Date;
  email: string;
  id: string;
  lostAt: Date | null;
  name: string;
  phone: string | null;
  plan: string | null;
  source: string;
  status: string;
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    dueAt: Date;
    completedAt: Date | null;
    type: string;
  }>;
  title: string | null;
  updatedAt: Date;
  value: number;
  website: string | null;
}

interface Template {
  body: string;
  id: string;
  name: string;
  subject: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const ACTIVITY_ICONS: Record<string, typeof Mail01Icon> = {
  email_sent: SentIcon,
  outreach_email: Mail01Icon,
  outreach_call: CallIcon,
  outreach_linkedin: LinkSquare01Icon,
  note: Note01Icon,
  status_change: Task01Icon,
};

const TASK_TYPE_LABELS: Record<string, string> = {
  follow_up: "Follow-up",
  demo: "Demo",
  call: "Call",
  email: "Email",
  other: "Other",
};

function defaultDueDate(): string {
  return format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm");
}

const RE_PROTOCOL = /^https?:\/\/(www\.)?/;
const RE_TRAILING_SLASH = /\/$/;

function formatWebsite(url: string): string {
  return url.replace(RE_PROTOCOL, "").replace(RE_TRAILING_SLASH, "");
}

export function LeadDetailClient({
  lead,
  templates,
}: {
  lead: LeadDetail;
  templates: Template[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showEdit, setShowEdit] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDue, setNewTaskDue] = useState(defaultDueDate);
  const [newTaskType, setNewTaskType] = useState("follow_up");

  const nextStatuses = LEAD_STATUSES.filter((s) => s !== lead.status);
  const openTasks = lead.tasks.filter((t) => !t.completedAt);
  const completedTasks = lead.tasks.filter((t) => !!t.completedAt);

  function handleStatusChange(status: string) {
    if (status === "converted") {
      setShowPlanPicker(true);
      return;
    }
    startTransition(async () => {
      await changeLeadStatus(lead.id, status);
      toast.success(`Moved to ${STATUS_LABELS[status]}`);
    });
  }

  function handleConvertWithPlan(plan: string) {
    setShowPlanPicker(false);
    startTransition(async () => {
      await changeLeadStatus(lead.id, "converted", { plan });
      toast.success("Lead converted");
    });
  }

  function handleAddNote() {
    if (!noteText.trim()) {
      return;
    }
    const text = noteText;
    startTransition(async () => {
      await addNote(lead.id, text);
      setNoteText("");
      toast.success("Note added");
    });
  }

  function handleAddTask() {
    if (!(newTaskTitle.trim() && newTaskDue)) {
      return;
    }
    startTransition(async () => {
      await createTask({
        leadId: lead.id,
        title: newTaskTitle,
        dueAt: new Date(newTaskDue),
        type: newTaskType,
      });
      setNewTaskTitle("");
      setNewTaskDue(defaultDueDate());
      setNewTaskType("follow_up");
      setShowAddTask(false);
      toast.success("Task created");
    });
  }

  function handleToggleTask(taskId: string, wasCompleted: boolean) {
    startTransition(async () => {
      if (wasCompleted) {
        await uncompleteTask(taskId);
        toast("Task reopened");
      } else {
        await completeTask(taskId);
        toast.success("Task completed");
      }
    });
  }

  function handleDeleteTask(taskId: string) {
    startTransition(async () => {
      await deleteTask(taskId);
      toast("Task deleted");
    });
  }

  function handleRescheduleTask(taskId: string, days: number) {
    const labels: Record<number, string> = {
      1: "tomorrow",
      3: "in 3 days",
      7: "in 1 week",
    };
    startTransition(async () => {
      await rescheduleTask(taskId, days);
      toast(`Rescheduled ${labels[days] ?? `+${days}d`}`);
    });
  }

  function handleTaskTypeChange(v: string | null) {
    if (v) {
      setNewTaskType(v);
    }
  }

  return (
    <>
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <Separator className="h-5" orientation="vertical" />
        <Button render={<Link href="/leads" />} size="sm" variant="ghost">
          <HugeiconsIcon icon={ArrowLeft02Icon} size={14} strokeWidth={2} />
          Leads
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Profile strip */}
        <div className="border-b px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="size-12">
                <AvatarFallback className="bg-muted text-lg text-muted-foreground">
                  {getInitials(lead.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-semibold text-xl tracking-tight">
                    {lead.name}
                  </h1>
                  <span
                    className={`rounded-sm px-1.5 py-0.5 font-medium text-[10px] uppercase tracking-wider ${STATUS_COLORS[lead.status]}`}
                  >
                    {STATUS_LABELS[lead.status]}
                  </span>
                </div>
                <p className="mt-0.5 text-muted-foreground text-sm">
                  {[lead.title, lead.company].filter(Boolean).join(" at ") ||
                    "No title"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowEmail(true)}
                size="sm"
                variant="outline"
              >
                <HugeiconsIcon icon={Mail01Icon} size={14} strokeWidth={1.5} />
                Email
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button size="sm" />}>
                  Move to...
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {nextStatuses.map((s) => (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => handleStatusChange(s)}
                    >
                      <span
                        className={`inline-block size-2 rounded-full ${STATUS_COLORS[s].split(" ")[0]}`}
                      />
                      {STATUS_LABELS[s]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
                  <DropdownMenuItem onClick={() => setShowEdit(true)}>
                    <HugeiconsIcon
                      icon={Edit02Icon}
                      size={14}
                      strokeWidth={1.5}
                    />
                    Edit Lead
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      startTransition(async () => {
                        await logOutreach(
                          lead.id,
                          "outreach_call",
                          "Logged a call"
                        );
                        toast.success("Call logged");
                      })
                    }
                  >
                    <HugeiconsIcon
                      icon={CallIcon}
                      size={14}
                      strokeWidth={1.5}
                    />
                    Log Call
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      startTransition(async () => {
                        await logOutreach(
                          lead.id,
                          "outreach_linkedin",
                          "Logged LinkedIn outreach"
                        );
                        toast.success("LinkedIn outreach logged");
                      })
                    }
                  >
                    <HugeiconsIcon
                      icon={LinkSquare01Icon}
                      size={14}
                      strokeWidth={1.5}
                    />
                    Log LinkedIn
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      startTransition(async () => {
                        await deleteLead(lead.id);
                        router.push("/leads");
                        toast("Lead deleted");
                      })
                    }
                    variant="destructive"
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      size={14}
                      strokeWidth={1.5}
                    />
                    Delete Lead
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Contact info chips */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <a
              className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              href={`mailto:${lead.email}`}
            >
              <HugeiconsIcon icon={Mail01Icon} size={13} strokeWidth={1.5} />
              {lead.email}
            </a>
            {lead.phone && (
              <a
                className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                href={`tel:${lead.phone}`}
              >
                <HugeiconsIcon icon={CallIcon} size={13} strokeWidth={1.5} />
                {lead.phone}
              </a>
            )}
            {lead.website && (
              <a
                className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                href={
                  lead.website.startsWith("http")
                    ? lead.website
                    : `https://${lead.website}`
                }
                rel="noopener noreferrer"
                target="_blank"
              >
                <HugeiconsIcon icon={Globe02Icon} size={13} strokeWidth={1.5} />
                {formatWebsite(lead.website)}
              </a>
            )}
            <span className="text-muted-foreground/60">·</span>
            <span className="text-muted-foreground text-xs">
              {SOURCE_LABELS[lead.source] ?? lead.source}
            </span>
            {lead.value > 0 && (
              <>
                <span className="text-muted-foreground/60">·</span>
                <span className="font-mono text-sm">
                  ${(lead.value / 100).toLocaleString()}
                </span>
              </>
            )}
            {lead.plan && (
              <>
                <span className="text-muted-foreground/60">·</span>
                <span className="rounded-sm bg-emerald-500/15 px-1.5 py-0.5 font-medium text-[10px] text-emerald-400 uppercase tracking-wider">
                  {lead.plan}
                </span>
              </>
            )}
            <span className="text-muted-foreground/60">·</span>
            <span className="text-muted-foreground text-xs">
              Added {format(new Date(lead.createdAt), "MMM d, yyyy")}
            </span>
            {lead.assignedUser && (
              <>
                <span className="text-muted-foreground/60">·</span>
                <span className="text-muted-foreground text-xs">
                  {lead.assignedUser.name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="grid gap-0 lg:grid-cols-5">
          {/* Left — Activity + Notes (3/5) */}
          <div className="border-r-0 p-5 lg:col-span-3 lg:border-r">
            {/* Note input */}
            <div className="mb-5">
              <Textarea
                className="min-h-[72px] resize-none"
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleAddNote();
                  }
                }}
                placeholder="Add a note..."
                value={noteText}
              />
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Cmd+Enter to save
                </span>
                <Button
                  disabled={isPending || !noteText.trim()}
                  onClick={handleAddNote}
                  size="sm"
                  variant="outline"
                >
                  Add Note
                </Button>
              </div>
            </div>

            {/* Activity timeline */}
            <div>
              <h3 className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                Activity ({lead.activities.length})
              </h3>
              {lead.activities.length === 0 && (
                <p className="py-8 text-center text-muted-foreground text-xs">
                  No activity yet
                </p>
              )}
              <div className="space-y-0">
                {lead.activities.map((a, i) => {
                  const Icon = ACTIVITY_ICONS[a.type] ?? Note01Icon;
                  const isLast = i === lead.activities.length - 1;
                  return (
                    <div
                      className={`relative flex gap-3 pb-4 pl-6 ${isLast ? "" : "border-muted-foreground/20 border-l"}`}
                      key={a.id}
                      style={{ marginLeft: "11px" }}
                    >
                      <div className="absolute top-0 -left-[12px] flex size-6 items-center justify-center rounded-full border bg-background">
                        <HugeiconsIcon
                          className="text-muted-foreground"
                          icon={Icon}
                          size={12}
                          strokeWidth={1.5}
                        />
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-sm">{a.content}</p>
                        <p className="mt-0.5 text-muted-foreground text-xs">
                          {a.user?.name ?? "System"} ·{" "}
                          {formatDistanceToNow(new Date(a.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right — Tasks (2/5) */}
          <div className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                Tasks ({openTasks.length})
              </h3>
              <Button
                onClick={() => {
                  setShowAddTask(!showAddTask);
                  if (!showAddTask) {
                    setNewTaskDue(defaultDueDate());
                  }
                }}
                size="icon-sm"
                variant="ghost"
              >
                <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
              </Button>
            </div>

            {/* Add task form */}
            {showAddTask && (
              <div className="mt-3 space-y-2 rounded-md border p-3">
                <Input
                  autoFocus
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTask();
                    }
                  }}
                  placeholder="Task title..."
                  value={newTaskTitle}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    onValueChange={handleTaskTypeChange}
                    value={newTaskType}
                  >
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
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    type="datetime-local"
                    value={newTaskDue}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    Enter to save
                  </span>
                  <Button
                    disabled={isPending}
                    onClick={handleAddTask}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}

            {/* Open tasks */}
            <div className="mt-3 space-y-1">
              {openTasks.length === 0 && !showAddTask && (
                <p className="py-6 text-center text-muted-foreground text-xs">
                  No open tasks
                </p>
              )}
              {openTasks.map((t) => (
                <TaskRow
                  key={t.id}
                  onDelete={handleDeleteTask}
                  onReschedule={handleRescheduleTask}
                  onToggle={handleToggleTask}
                  task={t}
                />
              ))}
            </div>

            {/* Completed tasks */}
            {completedTasks.length > 0 && (
              <div className="mt-5">
                <h3 className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Completed ({completedTasks.length})
                </h3>
                <div className="space-y-1">
                  {completedTasks.map((t) => (
                    <TaskRow
                      key={t.id}
                      onDelete={handleDeleteTask}
                      onReschedule={handleRescheduleTask}
                      onToggle={handleToggleTask}
                      task={t}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <LeadFormDialog lead={lead} onOpenChange={setShowEdit} open={showEdit} />
      <EmailComposeDialog
        leadId={lead.id}
        leadName={lead.name}
        onOpenChange={setShowEmail}
        open={showEmail}
        templates={templates}
      />
      <Dialog onOpenChange={setShowPlanPicker} open={showPlanPicker}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Select Plan</DialogTitle>
            <DialogDescription>
              Choose the plan for this converted lead.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {LEAD_PLANS.map((p) => (
              <Button
                key={p}
                onClick={() => handleConvertWithPlan(p)}
                variant="outline"
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TaskRow({
  task: t,
  onToggle,
  onDelete,
  onReschedule,
}: {
  task: {
    id: string;
    title: string;
    dueAt: Date;
    completedAt: Date | null;
    type: string;
  };
  onToggle: (id: string, wasCompleted: boolean) => void;
  onDelete: (id: string) => void;
  onReschedule: (id: string, days: number) => void;
}) {
  const isComplete = !!t.completedAt;
  const overdue = !isComplete && isPast(new Date(t.dueAt));

  return (
    <div className="group flex items-start gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-muted/40">
      <button
        className={`mt-0.5 flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border transition-colors ${
          isComplete
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input hover:border-primary/50 hover:bg-primary/10"
        }`}
        onClick={() => onToggle(t.id, isComplete)}
        type="button"
      >
        {isComplete && (
          <HugeiconsIcon icon={Tick01Icon} size={10} strokeWidth={2.5} />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-tight ${isComplete ? "text-muted-foreground line-through" : ""}`}
        >
          {t.title}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground uppercase">
            {TASK_TYPE_LABELS[t.type] ?? t.type}
          </span>
          <span
            className={`text-xs ${overdue ? "text-red-400" : "text-muted-foreground"}`}
          >
            {format(new Date(t.dueAt), "MMM d")}
            {overdue && " · overdue"}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
        {!isComplete && (
          <Button
            onClick={() => onReschedule(t.id, 1)}
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
            {!isComplete && (
              <>
                <DropdownMenuItem onClick={() => onReschedule(t.id, 1)}>
                  <HugeiconsIcon
                    icon={Calendar01Icon}
                    size={14}
                    strokeWidth={1.5}
                  />
                  Tomorrow
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onReschedule(t.id, 3)}>
                  <HugeiconsIcon
                    icon={Calendar01Icon}
                    size={14}
                    strokeWidth={1.5}
                  />
                  +3 days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onReschedule(t.id, 7)}>
                  <HugeiconsIcon
                    icon={Calendar01Icon}
                    size={14}
                    strokeWidth={1.5}
                  />
                  +1 week
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={() => onDelete(t.id)}
              variant="destructive"
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.5} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
