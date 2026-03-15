"use client";

import {
  ArrowRight01Icon,
  CallIcon,
  Cancel01Icon,
  Delete02Icon,
  Edit02Icon,
  Globe02Icon,
  Mail01Icon,
  Note01Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LeadFormDialog } from "@/components/lead-form-dialog";
import { SectionHeader, UserAvatar } from "@/components/micro";
import { StatusBadge, StatusDot } from "@/components/status-badge";
import { TaskCheckbox } from "@/components/task-checkbox";
import { RecurrenceBadge, TaskTypeBadge } from "@/components/task-type-picker";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { LEAD_STATUSES, SOURCE_LABELS, STATUS_LABELS } from "@/lib/constants";
import dayjs from "@/lib/dayjs";
import {
  useAddNote,
  useChangeLeadStatus,
  useDeleteLead,
  useLead,
  useToggleTask,
} from "@/lib/queries";
import {
  computeLeadScoreBreakdown,
  getScoreBgColor,
  getScoreColor,
} from "@/lib/scoring";
import { getShortTimezoneLabel } from "@/lib/timezones";
import { cn, formatCents, formatWebsite, getDueLabel } from "@/lib/utils";

export function LeadPreviewPanel({
  leadId,
  onClose,
}: {
  leadId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { data: lead, isLoading } = useLead(leadId);
  const changeStatus = useChangeLeadStatus();
  const addNote = useAddNote();
  const deleteLead = useDeleteLead();
  const toggleTask = useToggleTask();

  const [showEdit, setShowEdit] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showArchive, setShowArchive] = useState(false);

  function handleAddNote() {
    if (!noteText.trim()) {
      return;
    }
    addNote.mutate({ leadId, content: noteText });
    setNoteText("");
  }

  return (
    <>
      {/* biome-ignore lint/a11y: backdrop click to close */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 z-50 flex h-full w-[440px] flex-col border-l bg-background">
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            Lead Preview
          </span>
          <Button onClick={onClose} size="icon-sm" variant="ghost">
            <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
          </Button>
        </div>

        {isLoading || !lead ? (
          <PreviewSkeleton />
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* ── Profile + Score ── */}
              <ProfileSection lead={lead} />

              {/* ── Quick actions ── */}
              <div className="flex items-center gap-1.5 border-b px-5 py-3">
                <Button
                  className="flex-1"
                  onClick={() => router.push(`/leads/${leadId}`)}
                  size="sm"
                  variant="outline"
                >
                  Open
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={12}
                    strokeWidth={2}
                  />
                </Button>
                <Button
                  onClick={() => setShowEdit(true)}
                  size="icon-sm"
                  variant="outline"
                >
                  <HugeiconsIcon
                    icon={Edit02Icon}
                    size={13}
                    strokeWidth={1.5}
                  />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button size="sm" variant="outline" />}
                  >
                    Move to...
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {LEAD_STATUSES.filter((s) => s !== lead.status).map((s) => (
                      <DropdownMenuItem
                        key={s}
                        onClick={() =>
                          changeStatus.mutate({ leadId, status: s })
                        }
                      >
                        <StatusDot status={s} />
                        {STATUS_LABELS[s]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  className="text-red-600 hover:bg-red-500/10 hover:text-red-600"
                  onClick={() => setShowArchive(true)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    size={13}
                    strokeWidth={1.5}
                  />
                </Button>
              </div>

              {/* ── Contact details ── */}
              <ContactSection lead={lead} />

              {/* ── Quick note ── */}
              <div className="border-b px-5 py-3">
                <SectionHeader>Quick Note</SectionHeader>
                <div className="mt-1.5 flex gap-2">
                  <Textarea
                    className="min-h-[36px] flex-1 resize-none text-xs"
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

              {/* ── Tasks ── */}
              <TasksSection
                leadId={leadId}
                leadTimezone={lead.timezone}
                tasks={lead.tasks}
                toggleTask={toggleTask}
              />

              {/* ── Activity ── */}
              <ActivitySection activities={lead.activities} />

              {/* ── Custom fields ── */}
              <CustomFieldsSection customFields={lead.customFields} />
            </div>

            {/* ── Footer ── */}
            <div className="border-t px-5 py-3">
              <Button
                className="w-full"
                onClick={() => router.push(`/leads/${leadId}`)}
                size="sm"
              >
                View Full Detail
              </Button>
            </div>

            <LeadFormDialog
              lead={lead}
              onOpenChange={setShowEdit}
              open={showEdit}
            />
            <ConfirmDialog
              confirmLabel="Archive"
              description={`${lead.name} will be moved to the archive.`}
              icon={Delete02Icon}
              onConfirm={() => {
                deleteLead.mutate(leadId);
                onClose();
              }}
              onOpenChange={setShowArchive}
              open={showArchive}
              title="Archive this lead?"
              variant="danger"
            />
          </>
        )}
      </div>
    </>
  );
}

// ── Profile section ──────────────────────────────────────────────────────────

function ProfileSection({
  lead,
}: {
  lead: {
    name: string;
    email: string;
    status: string;
    value: number;
    company: string | null;
    title: string | null;
    createdAt: Date;
    assignedUser: { name: string } | null;
    activities?: unknown[];
    tasks?: unknown[];
  };
}) {
  const bd = computeLeadScoreBreakdown({
    value: lead.value,
    status: lead.status,
    activitiesCount: (lead.activities as unknown[])?.length ?? 0,
    tasksCount: (lead.tasks as unknown[])?.length ?? 0,
    daysSinceCreated: dayjs().diff(dayjs(lead.createdAt), "day"),
  });

  return (
    <div className="border-b px-5 py-4">
      <div className="flex items-start gap-3.5">
        <UserAvatar name={lead.name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-base leading-tight">
            {lead.name}
          </p>
          <p className="mt-0.5 truncate text-muted-foreground text-xs">
            {[lead.title, lead.company].filter(Boolean).join(" at ") ||
              lead.email}
          </p>
        </div>
        <StatusBadge status={lead.status} />
      </div>

      {/* Stats row */}
      <div className="mt-3 flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 font-mono text-[10px]",
              getScoreBgColor(bd.total)
            )}
          >
            {bd.total}
          </span>
          <span
            className={cn("font-mono text-[10px]", getScoreColor(bd.total))}
          >
            {bd.label}
          </span>
        </div>
        <span className="h-3 w-px bg-border" />
        <span className="font-mono text-muted-foreground">
          {formatCents(lead.value)}
        </span>
        {lead.assignedUser && (
          <>
            <span className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <UserAvatar name={lead.assignedUser.name} size="xs" />
              <span className="text-muted-foreground">
                {lead.assignedUser.name}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Contact details ──────────────────────────────────────────────────────────

function ContactSection({
  lead,
}: {
  lead: {
    email: string;
    phone: string | null;
    website: string | null;
    country: string | null;
    timezone: string | null;
    source: string;
    createdAt: Date;
  };
}) {
  return (
    <div className="border-b px-5 py-3">
      <SectionHeader>Contact</SectionHeader>
      <div className="mt-1.5 space-y-1.5">
        <ContactRow href={`mailto:${lead.email}`} icon={Mail01Icon}>
          {lead.email}
        </ContactRow>
        {lead.phone && (
          <ContactRow href={`tel:${lead.phone}`} icon={CallIcon}>
            {lead.phone}
          </ContactRow>
        )}
        {lead.website && (
          <ContactRow
            external
            href={
              lead.website.startsWith("http")
                ? lead.website
                : `https://${lead.website}`
            }
            icon={Globe02Icon}
          >
            {formatWebsite(lead.website)}
          </ContactRow>
        )}
        <div className="flex items-center justify-between pt-1 text-[11px]">
          <span className="text-muted-foreground">Source</span>
          <span>{SOURCE_LABELS[lead.source] ?? lead.source}</span>
        </div>
        {(lead.country || lead.timezone) && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Location</span>
            <span>
              {[
                lead.country,
                lead.timezone && getShortTimezoneLabel(lead.timezone),
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
        )}
        {lead.timezone && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Their time</span>
            <span className="font-mono">
              {dayjs().tz(lead.timezone).format("h:mm A")}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Added</span>
          <span>
            {dayjs(lead.createdAt).format("MMM D, YYYY")} (
            {dayjs(lead.createdAt).fromNow()})
          </span>
        </div>
      </div>
    </div>
  );
}

function ContactRow({
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
      className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/40"
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <HugeiconsIcon
        className="shrink-0 text-muted-foreground"
        icon={icon}
        size={13}
        strokeWidth={1.5}
      />
      <span className="truncate">{children}</span>
    </a>
  );
}

// ── Tasks section ────────────────────────────────────────────────────────────

function TasksSection({
  leadId,
  leadTimezone,
  tasks,
  toggleTask,
}: {
  leadId: string;
  leadTimezone?: string | null;
  tasks?: Array<{
    id: string;
    title: string;
    type: string;
    dueAt: Date;
    completedAt: Date | null;
    recurrence: string | null;
    user: { name: string } | null;
  }>;
  toggleTask: ReturnType<typeof useToggleTask>;
}) {
  if (!tasks || tasks.length === 0) {
    return null;
  }

  const open = tasks.filter((t) => !t.completedAt);
  const done = tasks.filter((t) => !!t.completedAt);

  return (
    <div className="border-b px-5 py-3">
      <SectionHeader count={open.length}>Tasks</SectionHeader>
      <div className="mt-1.5 space-y-0.5">
        {open.slice(0, 5).map((t) => {
          const due = getDueLabel(t.dueAt, false);
          return (
            <div
              className="flex items-start gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/30"
              key={t.id}
            >
              {/* biome-ignore lint/a11y: wrapper captures clicks */}
              <span
                className="pt-0.5"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                  }
                }}
                role="presentation"
              >
                <TaskCheckbox
                  checked={false}
                  onChange={() =>
                    toggleTask.mutate({ id: t.id, isComplete: false, leadId })
                  }
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-tight">{t.title}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <TaskTypeBadge type={t.type} />
                  <RecurrenceBadge recurrence={t.recurrence} />
                  <span className={cn("text-[10px]", due.className)}>
                    {due.text}
                    {leadTimezone && (
                      <span className="text-muted-foreground/60">
                        {" "}
                        / {dayjs(t.dueAt).tz(leadTimezone).format("h:mm A")}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {open.length > 5 && (
          <p className="px-2 text-[11px] text-muted-foreground">
            +{open.length - 5} more open
          </p>
        )}
        {done.length > 0 && (
          <p className="px-2 pt-1 text-[10px] text-muted-foreground/60">
            {done.length} completed
          </p>
        )}
      </div>
    </div>
  );
}

// ── Activity section ─────────────────────────────────────────────────────────

const ACTIVITY_ICONS: Record<string, typeof Note01Icon> = {
  note: Note01Icon,
  email_sent: Mail01Icon,
  outreach_email: Mail01Icon,
  outreach_call: CallIcon,
  task_created: Task01Icon,
  task_completed: Task01Icon,
};

function ActivitySection({
  activities,
}: {
  activities?: Array<{
    id: string;
    type: string;
    content: string | null;
    createdAt: Date;
    user: { name: string } | null;
  }>;
}) {
  if (!activities || activities.length === 0) {
    return null;
  }

  const recent = activities.slice(0, 6);

  return (
    <div className="border-b px-5 py-3">
      <SectionHeader count={activities.length}>Activity</SectionHeader>
      <div className="mt-1.5 space-y-0">
        {recent.map((a, i) => {
          const icon = ACTIVITY_ICONS[a.type] ?? Note01Icon;
          const isLast = i === recent.length - 1;
          return (
            <div
              className={cn(
                "relative flex gap-2.5 pb-3 pl-5",
                !isLast && "border-border/40 border-l"
              )}
              key={a.id}
              style={{ marginLeft: "7px" }}
            >
              <div className="absolute top-0.5 -left-[7px] flex size-[14px] items-center justify-center rounded-full bg-muted">
                <HugeiconsIcon
                  className="text-muted-foreground"
                  icon={icon}
                  size={8}
                  strokeWidth={2}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs leading-relaxed">
                  {a.content || a.type.replace(/_/g, " ")}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                  {a.user?.name ?? "System"} · {dayjs(a.createdAt).fromNow()}
                </p>
              </div>
            </div>
          );
        })}
        {activities.length > 6 && (
          <p className="pl-5 text-[10px] text-muted-foreground/60">
            +{activities.length - 6} more
          </p>
        )}
      </div>
    </div>
  );
}

// ── Custom fields ────────────────────────────────────────────────────────────

function CustomFieldsSection({ customFields }: { customFields: unknown }) {
  const cf = customFields as Record<string, string> | null;
  if (!cf || Object.keys(cf).length === 0) {
    return null;
  }
  return (
    <div className="px-5 py-3">
      <SectionHeader>Custom Fields</SectionHeader>
      <div className="mt-1.5 space-y-1.5">
        {Object.entries(cf).map(([k, v]) => (
          <div
            className="flex items-center justify-between text-[11px]"
            key={k}
          >
            <span className="text-muted-foreground">{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function PreviewSkeleton() {
  return (
    <div className="flex-1 p-6">
      <div className="flex items-center gap-3">
        <div className="size-10 animate-pulse rounded-full bg-muted/60" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted/60" />
          <div className="h-3 w-24 animate-pulse rounded bg-muted/40" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-8 flex-1 animate-pulse rounded-md bg-muted/40" />
        <div className="h-8 w-8 animate-pulse rounded-md bg-muted/40" />
        <div className="size-8 animate-pulse rounded-md bg-muted/40" />
      </div>
      <div className="mt-5 space-y-3">
        <div className="h-3 w-full animate-pulse rounded bg-muted/40" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-muted/40" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted/40" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted/40" />
      </div>
    </div>
  );
}
