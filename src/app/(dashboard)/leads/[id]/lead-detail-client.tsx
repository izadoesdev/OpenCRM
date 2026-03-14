"use client";

import {
  ArrowLeft02Icon,
  CallIcon,
  Delete02Icon,
  Edit02Icon,
  Globe02Icon,
  Mail01Icon,
  MoreHorizontalIcon,
  Task01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmailComposeDialog } from "@/components/email-compose-dialog";
import { LeadFormDialog } from "@/components/lead-form-dialog";
import { LogActivityDialog } from "@/components/log-activity-dialog";
import {
  DetailField,
  Pill,
  SectionHeader,
  UserAvatar,
} from "@/components/micro";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { SegmentedControl } from "@/components/segmented-control";
import { StatusBadge, StatusDot } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth-client";
import { LEAD_STATUSES, SOURCE_LABELS, STATUS_LABELS } from "@/lib/constants";
import dayjs from "@/lib/dayjs";
import {
  useAddNote,
  useAssignLead,
  useChangeLeadStatus,
  useDeleteLead,
  useEmailTemplates,
  useGoogleConnection,
  useLead,
  useLeadEmails,
  useTeamMembers,
  useUpdateLead,
} from "@/lib/queries";
import { formatCents, formatWebsite } from "@/lib/utils";
import { ActivityTimeline } from "./_components/activity-timeline";
import { EmailThreadView } from "./_components/email-thread-view";
import { ScoreHoverCard, useLeadScore } from "./_components/lead-score";
import {
  LeadTasksSidebar,
  type TeamMember,
} from "./_components/lead-tasks-sidebar";

// ── Main orchestrator ───────────────────────────────────────────────────────
export function LeadDetailClient({ leadId }: { leadId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: lead, isLoading, isError } = useLead(leadId);
  const { data: templates = [] } = useEmailTemplates();

  const changeStatus = useChangeLeadStatus();
  const addNote = useAddNote();
  const deleteLeadMut = useDeleteLead();
  const updateLeadMut = useUpdateLead();
  const assignLead = useAssignLead();
  const { data: teamMembers = [] as TeamMember[] } = useTeamMembers();
  const { data: gConn } = useGoogleConnection();
  const { data: leadEmails = [] } = useLeadEmails(lead?.email ?? null);

  const [showEdit, setShowEdit] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showLogActivity, setShowLogActivity] = useState(false);
  const [leftTab, setLeftTab] = useState<"activity" | "emails">("activity");
  const [noteText, setNoteText] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [addingField, setAddingField] = useState(false);
  const [fieldKey, setFieldKey] = useState("");
  const [fieldValue, setFieldValue] = useState("");

  if (isLoading) {
    return <PageSkeleton />;
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

  function handleStatusChange(status: string) {
    if (status === "converted") {
      changeStatus.mutate({
        leadId: id,
        status: "converted",
        opts: { plan: "free" },
      });
      return;
    }
    changeStatus.mutate({ leadId: id, status });
  }

  function handleAddNote() {
    if (!noteText.trim()) {
      return;
    }
    addNote.mutate({ leadId: id, content: noteText });
    setNoteText("");
  }

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
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
                <DropdownMenuItem onClick={() => setShowLogActivity(true)}>
                  <HugeiconsIcon
                    icon={Task01Icon}
                    size={14}
                    strokeWidth={1.5}
                  />
                  Log Activity
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
                  Archive Lead
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </PageHeader>

      {/* ── Two-panel layout ── */}
      <div className="flex min-h-0 flex-1">
        {/* LEFT — Profile + Activity */}
        <div className="flex min-h-0 flex-1 flex-col border-r">
          <ProfileStrip lead={lead} />

          <NoteInput
            isPending={addNote.isPending}
            noteText={noteText}
            onAddNote={handleAddNote}
            setNoteText={setNoteText}
          />

          <div className="flex shrink-0 items-center gap-2 border-b px-6 py-2">
            <SegmentedControl
              onChange={setLeftTab}
              segments={[
                {
                  value: "activity" as const,
                  label: `Activity (${lead.activities.length})`,
                },
                ...(gConn?.hasGmail
                  ? [
                      {
                        value: "emails" as const,
                        label: `Emails (${leadEmails.length})`,
                      },
                    ]
                  : []),
              ]}
              value={leftTab}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {leftTab === "activity" && (
              <ActivityTimeline
                activities={lead.activities}
                activityFilter={activityFilter}
                setActivityFilter={setActivityFilter}
              />
            )}
            {leftTab === "emails" && (
              <EmailThreadView
                emails={leadEmails}
                leadEmail={lead.email}
                leadId={id}
                leadName={lead.name}
              />
            )}
          </div>
        </div>

        {/* RIGHT — Details + Tasks */}
        <div className="flex w-80 shrink-0 flex-col lg:w-96">
          <DetailsSidebar
            addingField={addingField}
            fieldKey={fieldKey}
            fieldValue={fieldValue}
            lead={lead}
            setAddingField={setAddingField}
            setFieldKey={setFieldKey}
            setFieldValue={setFieldValue}
            updateLeadMut={updateLeadMut}
          />

          <AssignedToSection
            assignLead={assignLead}
            lead={lead}
            leadId={id}
            teamMembers={teamMembers as TeamMember[]}
          />

          <LeadTasksSidebar
            currentUserId={session?.user?.id ?? undefined}
            leadId={id}
            leadPhone={lead.phone}
            tasks={lead.tasks}
            teamMembers={teamMembers as TeamMember[]}
          />
        </div>
      </div>

      {/* ── Dialogs ── */}
      <LeadFormDialog lead={lead} onOpenChange={setShowEdit} open={showEdit} />
      <LogActivityDialog
        leadId={id}
        onOpenChange={setShowLogActivity}
        open={showLogActivity}
      />
      <EmailComposeDialog
        leadId={id}
        leadName={lead.name}
        onOpenChange={setShowEmail}
        open={showEmail}
        templates={templates}
      />
    </div>
  );
}

// ── Profile strip ───────────────────────────────────────────────────────────
function ProfileStrip({
  lead,
}: {
  lead: {
    name: string;
    status: string;
    value: number;
    activities?: unknown[];
    tasks?: unknown[];
    createdAt: Date;
    title: string | null;
    company: string | null;
    email: string;
  };
}) {
  const breakdown = useLeadScore(lead);
  return (
    <div className="shrink-0 border-b px-6 py-4">
      <div className="flex items-center gap-4">
        <UserAvatar name={lead.name} size="xl" />
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="truncate font-semibold text-lg tracking-tight">
              {lead.name}
            </h1>
            <StatusBadge status={lead.status} />
            <ScoreHoverCard breakdown={breakdown} />
          </div>
          <p className="truncate text-muted-foreground text-sm">
            {[lead.title, lead.company].filter(Boolean).join(" at ") ||
              lead.email}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Note input ──────────────────────────────────────────────────────────────
function NoteInput({
  noteText,
  setNoteText,
  onAddNote,
  isPending,
}: {
  noteText: string;
  setNoteText: (v: string) => void;
  onAddNote: () => void;
  isPending: boolean;
}) {
  return (
    <div className="shrink-0 border-b px-6 py-3">
      <div className="flex gap-2">
        <Textarea
          className="min-h-[40px] flex-1 resize-none text-sm"
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onAddNote();
            }
          }}
          placeholder="Add a note... (⌘ Enter)"
          rows={1}
          value={noteText}
        />
        <Button
          className="shrink-0 self-end"
          disabled={isPending || !noteText.trim()}
          onClick={onAddNote}
          size="sm"
          variant="outline"
        >
          Add
        </Button>
      </div>
    </div>
  );
}

// ── Detail row (contact info link) ──────────────────────────────────────────
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

// ── Details sidebar ─────────────────────────────────────────────────────────
function DetailsSidebar({
  lead,
  updateLeadMut,
  addingField,
  setAddingField,
  fieldKey,
  setFieldKey,
  fieldValue,
  setFieldValue,
}: {
  lead: {
    id: string;
    email: string;
    phone: string | null;
    website: string | null;
    source: string;
    value: number;
    plan: string | null;
    createdAt: Date;
    customFields: unknown;
  };
  updateLeadMut: ReturnType<typeof useUpdateLead>;
  addingField: boolean;
  setAddingField: (v: boolean) => void;
  fieldKey: string;
  setFieldKey: (v: string) => void;
  fieldValue: string;
  setFieldValue: (v: string) => void;
}) {
  return (
    <div className="shrink-0 border-b px-5 py-4">
      <SectionHeader>Details</SectionHeader>
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
        <DetailField label="Source">
          {SOURCE_LABELS[lead.source] ?? lead.source}
        </DetailField>
        {lead.value > 0 && (
          <DetailField label="Value">
            <span className="font-mono">{formatCents(lead.value)}</span>
          </DetailField>
        )}
        {lead.plan && (
          <DetailField label="Plan">
            <Pill
              className="font-medium uppercase tracking-wider"
              variant="success"
            >
              {lead.plan}
            </Pill>
          </DetailField>
        )}
        <DetailField label="Added">
          <span className="text-muted-foreground">
            {dayjs(lead.createdAt).format("MMM D, YYYY")}
          </span>
        </DetailField>
        {(() => {
          const cf = lead.customFields as Record<string, string> | null;
          if (!cf || Object.keys(cf).length === 0) {
            return null;
          }
          return Object.entries(cf).map(([key, val]) => (
            <DetailField key={key} label={key}>
              {val}
            </DetailField>
          ));
        })()}
        <div className="mt-2">
          {addingField ? (
            <div className="flex items-center gap-2">
              <Input
                className="h-7 w-24 text-xs"
                onChange={(e) => setFieldKey(e.target.value)}
                placeholder="Field name"
                value={fieldKey}
              />
              <Input
                className="h-7 flex-1 text-xs"
                onChange={(e) => setFieldValue(e.target.value)}
                placeholder="Value"
                value={fieldValue}
              />
              <Button
                disabled={!(fieldKey.trim() && fieldValue.trim())}
                onClick={() => {
                  const current = (lead.customFields ?? {}) as Record<
                    string,
                    string
                  >;
                  updateLeadMut.mutate({
                    id: lead.id,
                    data: {
                      customFields: {
                        ...current,
                        [fieldKey.trim()]: fieldValue.trim(),
                      },
                    },
                  });
                  setFieldKey("");
                  setFieldValue("");
                  setAddingField(false);
                }}
                size="sm"
                variant="ghost"
              >
                Save
              </Button>
              <Button
                onClick={() => setAddingField(false)}
                size="sm"
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <button
              className="text-muted-foreground text-xs hover:text-foreground"
              onClick={() => setAddingField(true)}
              type="button"
            >
              + Add field
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Assigned To ─────────────────────────────────────────────────────────────
function AssignedToSection({
  lead,
  leadId,
  teamMembers,
  assignLead,
}: {
  lead: {
    assignedTo: string | null;
    assignedUser: { name: string; email: string } | null;
  };
  leadId: string;
  teamMembers: TeamMember[];
  assignLead: ReturnType<typeof useAssignLead>;
}) {
  return (
    <div className="shrink-0 border-b px-5 py-4">
      <SectionHeader>Assigned To</SectionHeader>
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
              <UserAvatar name={lead.assignedUser.name} size="lg" />
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
          {teamMembers.map((m) => (
            <DropdownMenuItem
              key={m.id}
              onClick={() => assignLead.mutate({ leadId, assignedTo: m.id })}
            >
              <UserAvatar name={m.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{m.name}</p>
              </div>
              {lead.assignedTo === m.id && (
                <Pill variant="primary">current</Pill>
              )}
            </DropdownMenuItem>
          ))}
          {lead.assignedTo && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => assignLead.mutate({ leadId, assignedTo: null })}
              >
                Unassign
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
