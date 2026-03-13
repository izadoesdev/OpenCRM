"use client";

import {
  Add01Icon,
  ArrowLeft02Icon,
  Calendar01Icon,
  CallIcon,
  Delete02Icon,
  Edit02Icon,
  Globe02Icon,
  Link01Icon,
  LinkSquare01Icon,
  Mail01Icon,
  MoreHorizontalIcon,
  Note01Icon,
  RepeatIcon,
  SentIcon,
  Task01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DateTimePicker } from "@/components/date-time-picker";
import { EmailComposeDialog } from "@/components/email-compose-dialog";
import { LeadFormDialog } from "@/components/lead-form-dialog";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, StatusDot } from "@/components/status-badge";
import { TaskCheckbox } from "@/components/task-checkbox";
import {
  RecurrenceBadge,
  TaskTypeBadge,
  TaskTypePicker,
} from "@/components/task-type-picker";
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
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  LEAD_PLANS,
  LEAD_STATUSES,
  RECURRENCE_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
  TASK_RECURRENCES,
} from "@/lib/constants";
import dayjs from "@/lib/dayjs";
import {
  useAddNote,
  useAssignLead,
  useChangeLeadStatus,
  useCreateTask,
  useDeleteLead,
  useDeleteTask,
  useEmailTemplates,
  useGoogleConnection,
  useLead,
  useLeadEmails,
  useLogOutreach,
  useRescheduleTask,
  useTeamMembers,
  useToggleTask,
} from "@/lib/queries";
import { formatCents, formatWebsite, getInitials } from "@/lib/utils";

interface TeamMember {
  email: string;
  id: string;
  image: string | null;
  name: string;
}

const ACTIVITY_ICONS: Record<string, typeof Mail01Icon> = {
  email_sent: SentIcon,
  outreach_email: Mail01Icon,
  outreach_call: CallIcon,
  outreach_linkedin: LinkSquare01Icon,
  note: Note01Icon,
  status_change: Task01Icon,
};

export function LeadDetailClient({ leadId }: { leadId: string }) {
  const router = useRouter();
  const { data: lead, isLoading, isError } = useLead(leadId);
  const { data: templates = [] } = useEmailTemplates();

  const changeStatus = useChangeLeadStatus();
  const addNote = useAddNote();
  const logOutreach = useLogOutreach();
  const deleteLeadMut = useDeleteLead();
  const createTask = useCreateTask();
  const toggleTask = useToggleTask();
  const deleteTaskMut = useDeleteTask();
  const rescheduleTask = useRescheduleTask();
  const assignLead = useAssignLead();
  const { data: teamMembers = [] as TeamMember[] } = useTeamMembers();
  const { data: gConn } = useGoogleConnection();
  const { data: leadEmails = [] } = useLeadEmails(lead?.email ?? null);

  const [showEdit, setShowEdit] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [leftTab, setLeftTab] = useState<"activity" | "emails">("activity");
  const [noteText, setNoteText] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDue, setNewTaskDue] = useState<Date | null>(null);
  const [newTaskType, setNewTaskType] = useState("follow_up");
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>("_self");
  const [newTaskRecurrence, setNewTaskRecurrence] = useState<string>("none");
  const [newTaskMeetingLink, setNewTaskMeetingLink] = useState("");
  const [newTaskSyncCalendar, setNewTaskSyncCalendar] = useState(true);

  if (isLoading) {
    return null;
  }

  if (isError || !lead) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader>
          <Button render={<Link href="/leads" />} size="sm" variant="ghost">
            <HugeiconsIcon icon={ArrowLeft02Icon} size={14} strokeWidth={2} />
            Leads
          </Button>
        </PageHeader>
        <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
          Lead not found
        </div>
      </div>
    );
  }

  const id = lead.id;
  const nextStatuses = LEAD_STATUSES.filter((s) => s !== lead.status);
  const openTasks = lead.tasks.filter((t) => !t.completedAt);
  const completedTasks = lead.tasks.filter((t) => !!t.completedAt);

  function handleStatusChange(status: string) {
    if (status === "converted") {
      setShowPlanPicker(true);
      return;
    }
    changeStatus.mutate({ leadId: id, status });
  }

  function handleConvertWithPlan(plan: string) {
    setShowPlanPicker(false);
    changeStatus.mutate({ leadId: id, status: "converted", opts: { plan } });
  }

  function handleAddNote() {
    if (!noteText.trim()) {
      return;
    }
    addNote.mutate({ leadId: id, content: noteText });
    setNoteText("");
  }

  function handleAddTask() {
    if (!(newTaskTitle.trim() && newTaskDue)) {
      return;
    }
    createTask.mutate({
      leadId: id,
      title: newTaskTitle,
      dueAt: newTaskDue,
      type: newTaskType,
      userId: newTaskAssignee === "_self" ? undefined : newTaskAssignee,
      recurrence: newTaskRecurrence === "none" ? null : newTaskRecurrence,
      meetingLink: newTaskMeetingLink.trim() || null,
      syncToCalendar:
        newTaskSyncCalendar &&
        (newTaskType === "meeting" || newTaskType === "demo"),
    });
    setNewTaskTitle("");
    setNewTaskDue(null);
    setNewTaskType("follow_up");
    setNewTaskAssignee("_self");
    setNewTaskRecurrence("none");
    setNewTaskMeetingLink("");
    setShowAddTask(false);
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <div className="flex flex-1 items-center justify-between">
          <Button render={<Link href="/leads" />} size="sm" variant="ghost">
            <HugeiconsIcon icon={ArrowLeft02Icon} size={14} strokeWidth={2} />
            Leads
          </Button>
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
                    <StatusDot status={s} />
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
                    logOutreach.mutate({
                      leadId: id,
                      type: "outreach_call",
                      content: "Logged a call",
                    })
                  }
                >
                  <HugeiconsIcon icon={CallIcon} size={14} strokeWidth={1.5} />
                  Log Call
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    logOutreach.mutate({
                      leadId: id,
                      type: "outreach_linkedin",
                      content: "Logged LinkedIn outreach",
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
                    deleteLeadMut.mutate(id, {
                      onSuccess: () => router.push("/leads"),
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
      </PageHeader>

      {/* Two-panel layout that fills viewport */}
      <div className="flex min-h-0 flex-1">
        {/* LEFT — Profile + Activity */}
        <div className="flex min-h-0 flex-1 flex-col border-r">
          {/* Profile strip */}
          <div className="shrink-0 border-b px-6 py-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-11">
                <AvatarFallback className="bg-muted font-medium text-base text-muted-foreground">
                  {getInitials(lead.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <h1 className="truncate font-semibold text-lg tracking-tight">
                    {lead.name}
                  </h1>
                  <StatusBadge status={lead.status} />
                </div>
                <p className="truncate text-muted-foreground text-sm">
                  {[lead.title, lead.company].filter(Boolean).join(" at ") ||
                    lead.email}
                </p>
              </div>
            </div>
          </div>

          {/* Note input */}
          <div className="shrink-0 border-b px-6 py-3">
            <div className="flex gap-2">
              <Textarea
                className="min-h-[40px] flex-1 resize-none text-sm"
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleAddNote();
                  }
                }}
                placeholder="Add a note... (⌘ Enter)"
                rows={1}
                value={noteText}
              />
              <Button
                className="shrink-0 self-end"
                disabled={addNote.isPending || !noteText.trim()}
                onClick={handleAddNote}
                size="sm"
                variant="outline"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex shrink-0 items-center gap-1 border-b px-6">
            <button
              className={`border-b-2 px-3 py-2 text-xs transition-colors ${
                leftTab === "activity"
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setLeftTab("activity")}
              type="button"
            >
              Activity ({lead.activities.length})
            </button>
            {gConn?.hasGmail && (
              <button
                className={`border-b-2 px-3 py-2 text-xs transition-colors ${
                  leftTab === "emails"
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setLeftTab("emails")}
                type="button"
              >
                Emails ({leadEmails.length})
              </button>
            )}
          </div>

          {/* Scrollable content */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {leftTab === "activity" && (
              <>
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
                            {dayjs(a.createdAt).fromNow()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {leftTab === "emails" && (
              <>
                {leadEmails.length === 0 && (
                  <p className="py-8 text-center text-muted-foreground text-xs">
                    No emails found
                  </p>
                )}
                <div className="space-y-2">
                  {leadEmails.map((email) => (
                    <div className="rounded-md border p-3" key={email.id}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-sm">
                            {email.subject || "(no subject)"}
                          </p>
                          <p className="mt-0.5 truncate text-muted-foreground text-xs">
                            {email.from}
                          </p>
                        </div>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {dayjs(Number(email.internalDate)).format(
                            "MMM D, h:mm A"
                          )}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-3 text-muted-foreground text-xs">
                        {email.snippet}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT — Details + Assigned To + Tasks sidebar */}
        <div className="flex w-80 shrink-0 flex-col lg:w-96">
          {/* Details section */}
          <div className="shrink-0 border-b px-5 py-4">
            <h3 className="mb-2.5 font-medium text-[10px] text-muted-foreground uppercase tracking-widest">
              Details
            </h3>
            <div className="space-y-2">
              <DetailRow href={`mailto:${lead.email}`} icon={Mail01Icon}>
                {lead.email}
              </DetailRow>
              {lead.phone && (
                <DetailRow href={`tel:${lead.phone}`} icon={CallIcon}>
                  {lead.phone}
                </DetailRow>
              )}
              {lead.website && (
                <DetailRow
                  external
                  href={
                    lead.website.startsWith("http")
                      ? lead.website
                      : `https://${lead.website}`
                  }
                  icon={Globe02Icon}
                >
                  {formatWebsite(lead.website)}
                </DetailRow>
              )}
              <div className="flex items-center gap-3 text-sm">
                <span className="w-16 shrink-0 text-muted-foreground text-xs">
                  Source
                </span>
                <span>{SOURCE_LABELS[lead.source] ?? lead.source}</span>
              </div>
              {lead.value > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-16 shrink-0 text-muted-foreground text-xs">
                    Value
                  </span>
                  <span className="font-mono">{formatCents(lead.value)}</span>
                </div>
              )}
              {lead.plan && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-16 shrink-0 text-muted-foreground text-xs">
                    Plan
                  </span>
                  <span className="rounded-sm bg-emerald-500/15 px-1.5 py-0.5 font-medium text-[10px] text-emerald-400 uppercase tracking-wider">
                    {lead.plan}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <span className="w-16 shrink-0 text-muted-foreground text-xs">
                  Added
                </span>
                <span className="text-muted-foreground">
                  {dayjs(lead.createdAt).format("MMM D, YYYY")}
                </span>
              </div>
            </div>
          </div>

          {/* Assigned To section */}
          <div className="shrink-0 border-b px-5 py-4">
            <h3 className="mb-2.5 font-medium text-[10px] text-muted-foreground uppercase tracking-widest">
              Assigned To
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    className="flex w-full items-center gap-3 rounded-md border border-transparent p-2 text-left transition-colors hover:border-border hover:bg-muted/40"
                    type="button"
                  />
                }
              >
                {lead.assignedUser ? (
                  <>
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(lead.assignedUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm">
                        {lead.assignedUser.name}
                      </p>
                      <p className="truncate text-muted-foreground text-xs">
                        {lead.assignedUser.email}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex size-8 items-center justify-center rounded-full border border-muted-foreground/30 border-dashed">
                      <HugeiconsIcon
                        className="text-muted-foreground/50"
                        icon={UserIcon}
                        size={14}
                        strokeWidth={1.5}
                      />
                    </div>
                    <span className="text-muted-foreground text-sm">
                      Click to assign
                    </span>
                  </>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {teamMembers.map((m: TeamMember) => (
                  <DropdownMenuItem
                    key={m.id}
                    onClick={() =>
                      assignLead.mutate({ leadId: id, assignedTo: m.id })
                    }
                  >
                    <Avatar className="size-6">
                      <AvatarFallback className="bg-muted text-[9px] text-muted-foreground">
                        {getInitials(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{m.name}</p>
                    </div>
                    {lead.assignedTo === m.id && (
                      <span className="shrink-0 rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                        current
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
                {lead.assignedTo && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        assignLead.mutate({ leadId: id, assignedTo: null })
                      }
                    >
                      Unassign
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Scrollable Tasks section */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-between px-5 pt-4 pb-2">
              <h3 className="font-medium text-[10px] text-muted-foreground uppercase tracking-widest">
                Tasks ({openTasks.length} open)
              </h3>
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
              <div className="mx-5 mb-3 shrink-0 space-y-2 rounded-md border p-3">
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
                  <TaskTypePicker
                    className="w-full"
                    onChange={setNewTaskType}
                    value={newTaskType}
                  />
                  <DateTimePicker onChange={setNewTaskDue} value={newTaskDue} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    onValueChange={(v) => v && setNewTaskAssignee(v)}
                    value={newTaskAssignee}
                  >
                    <SelectTrigger className="w-full text-xs">
                      <HugeiconsIcon
                        className="mr-1 shrink-0 text-muted-foreground"
                        icon={UserIcon}
                        size={12}
                        strokeWidth={1.5}
                      />
                      <span className="flex-1 truncate text-left">
                        {newTaskAssignee === "_self"
                          ? "Myself"
                          : ((teamMembers as TeamMember[]).find(
                              (m) => m.id === newTaskAssignee
                            )?.name ?? "Select...")}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_self">Myself</SelectItem>
                      {(teamMembers as TeamMember[]).map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    onValueChange={(v) => v && setNewTaskRecurrence(v)}
                    value={newTaskRecurrence}
                  >
                    <SelectTrigger className="w-full text-xs">
                      <HugeiconsIcon
                        className="mr-1 shrink-0 text-muted-foreground"
                        icon={RepeatIcon}
                        size={12}
                        strokeWidth={1.5}
                      />
                      <span className="flex-1 truncate text-left">
                        {newTaskRecurrence === "none"
                          ? "One-time"
                          : (RECURRENCE_LABELS[newTaskRecurrence] ??
                            newTaskRecurrence)}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">One-time</SelectItem>
                      {TASK_RECURRENCES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {RECURRENCE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(newTaskType === "meeting" || newTaskType === "demo") && (
                  <>
                    <Input
                      onChange={(e) => setNewTaskMeetingLink(e.target.value)}
                      placeholder="Meeting link (or leave empty to auto-generate Meet)"
                      value={newTaskMeetingLink}
                    />
                    <label className="flex items-center gap-2 text-muted-foreground text-xs">
                      <input
                        checked={newTaskSyncCalendar}
                        className="rounded border"
                        onChange={(e) =>
                          setNewTaskSyncCalendar(e.target.checked)
                        }
                        type="checkbox"
                      />
                      Create Google Calendar event with Meet link
                    </label>
                  </>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => setShowAddTask(false)}
                    size="sm"
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={
                      createTask.isPending ||
                      !newTaskTitle.trim() ||
                      !newTaskDue
                    }
                    onClick={handleAddTask}
                    size="sm"
                  >
                    Add Task
                  </Button>
                </div>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
              {openTasks.length === 0 && !showAddTask && (
                <p className="py-6 text-center text-muted-foreground text-xs">
                  No open tasks
                </p>
              )}
              <div className="space-y-0.5">
                {openTasks.map((t) => (
                  <TaskRow
                    key={t.id}
                    leadId={id}
                    onDelete={deleteTaskMut}
                    onReschedule={rescheduleTask}
                    onToggle={toggleTask}
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
                      <TaskRow
                        key={t.id}
                        leadId={id}
                        onDelete={deleteTaskMut}
                        onReschedule={rescheduleTask}
                        onToggle={toggleTask}
                        task={t}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <LeadFormDialog lead={lead} onOpenChange={setShowEdit} open={showEdit} />
      <EmailComposeDialog
        leadId={id}
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
    </div>
  );
}

function DetailRow({
  icon,
  href,
  external,
  children,
}: {
  icon: typeof Mail01Icon;
  href: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      className="flex items-center gap-3 text-muted-foreground text-sm transition-colors hover:text-foreground"
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <HugeiconsIcon
        className="shrink-0"
        icon={icon}
        size={14}
        strokeWidth={1.5}
      />
      <span className="truncate">{children}</span>
    </a>
  );
}

function TaskRow({
  task: t,
  leadId,
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
    recurrence?: string | null;
    meetingLink?: string | null;
  };
  leadId: string;
  onToggle: ReturnType<typeof useToggleTask>;
  onDelete: ReturnType<typeof useDeleteTask>;
  onReschedule: ReturnType<typeof useRescheduleTask>;
}) {
  const isComplete = !!t.completedAt;
  const overdue = !isComplete && dayjs(t.dueAt).isBefore(dayjs(), "minute");

  return (
    <div className="group flex items-start gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/40">
      <TaskCheckbox
        checked={isComplete}
        onChange={() => onToggle.mutate({ id: t.id, isComplete, leadId })}
      />
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-tight ${isComplete ? "text-muted-foreground line-through" : ""}`}
        >
          {t.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <TaskTypeBadge type={t.type} />
          <RecurrenceBadge recurrence={t.recurrence ?? null} />
          {t.meetingLink && (
            <a
              className="inline-flex items-center gap-0.5 rounded-md bg-cyan-500/15 px-1.5 py-0.5 text-[9px] text-cyan-400 uppercase transition-colors hover:bg-cyan-500/25"
              href={t.meetingLink}
              onClick={(e) => e.stopPropagation()}
              rel="noopener noreferrer"
              target="_blank"
            >
              <HugeiconsIcon icon={Link01Icon} size={8} strokeWidth={2} />
              Join
            </a>
          )}
          <span
            className={`text-[11px] ${overdue ? "text-red-400" : "text-muted-foreground"}`}
          >
            {dayjs(t.dueAt).format("MMM D")} · {dayjs(t.dueAt).fromNow()}
            {overdue && " · overdue"}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
        {!isComplete && (
          <Button
            onClick={() => onReschedule.mutate({ id: t.id, days: 1, leadId })}
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
                <DropdownMenuItem
                  onClick={() =>
                    onReschedule.mutate({ id: t.id, days: 1, leadId })
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
                    onReschedule.mutate({ id: t.id, days: 3, leadId })
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
                    onReschedule.mutate({ id: t.id, days: 7, leadId })
                  }
                >
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
              onClick={() => onDelete.mutate({ id: t.id, leadId })}
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
