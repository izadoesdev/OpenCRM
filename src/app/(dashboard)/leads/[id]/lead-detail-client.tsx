"use client";

import {
  ArrowLeft02Icon,
  Delete02Icon,
  Edit02Icon,
  Mail01Icon,
  MoreHorizontalIcon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmailComposeDialog } from "@/components/email-compose-dialog";
import { LeadFormDialog } from "@/components/lead-form-dialog";
import { LogActivityDialog } from "@/components/log-activity-dialog";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { SegmentedControl } from "@/components/segmented-control";
import { StatusDot } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/lib/auth-client";
import { LEAD_STATUSES, STATUS_LABELS } from "@/lib/constants";
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
import { ActivityTimeline } from "./_components/activity-timeline";
import {
  AssignedToSection,
  DetailsSidebar,
} from "./_components/details-sidebar";
import { EmailThreadView } from "./_components/email-thread-view";
import {
  LeadTasksSidebar,
  type TeamMember,
} from "./_components/lead-tasks-sidebar";
import { NoteInput } from "./_components/note-input";
import { ProfileStrip } from "./_components/profile-strip";

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
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

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
                  onClick={() => setShowArchiveConfirm(true)}
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
            leadTimezone={lead.timezone}
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
      <ConfirmDialog
        confirmLabel="Archive"
        description={`${lead.name} will be moved to the archive. You can restore them later from settings.`}
        icon={Delete02Icon}
        onConfirm={() =>
          deleteLeadMut.mutate(id, { onSuccess: () => router.push("/leads") })
        }
        onOpenChange={setShowArchiveConfirm}
        open={showArchiveConfirm}
        title="Archive this lead?"
        variant="danger"
      />
    </div>
  );
}
