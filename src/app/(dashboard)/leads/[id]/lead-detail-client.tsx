"use client";

import {
  Add01Icon,
  ArrowLeft02Icon,
  CallIcon,
  Delete02Icon,
  Edit02Icon,
  Globe02Icon,
  LinkSquare01Icon,
  Mail01Icon,
  MoreHorizontalIcon,
  Note01Icon,
  RepeatIcon,
  Search01Icon,
  SentIcon,
  Task01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DateTimePicker } from "@/components/date-time-picker";
import { EmailComposeDialog } from "@/components/email-compose-dialog";
import { LeadFormDialog } from "@/components/lead-form-dialog";
import { LogActivityDialog } from "@/components/log-activity-dialog";
import {
  MeetingDetail,
  MeetingLinkBadge,
  MeetingLinkPill,
} from "@/components/meeting-detail";
import {
  DetailField,
  IconSelect,
  Pill,
  SectionHeader,
  UserAvatar,
} from "@/components/micro";
import { PageHeader } from "@/components/page-header";
import { EmptyState, PageSkeleton } from "@/components/page-skeleton";
import { SegmentedControl } from "@/components/segmented-control";
import { StatusBadge, StatusDot } from "@/components/status-badge";
import { TaskCheckbox } from "@/components/task-checkbox";
import { TaskInlineEdit } from "@/components/task-inline-edit";
import {
  RecurrenceBadge,
  TaskTypeBadge,
  TaskTypePicker,
} from "@/components/task-type-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { GmailMessage } from "@/lib/actions/gmail";
import {
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
  useSendEmail,
  useTeamMembers,
  useToggleTask,
  useUpdateLead,
} from "@/lib/queries";
import {
  computeLeadScore,
  getScoreBgColor,
  getScoreLabel,
} from "@/lib/scoring";
import { formatCents, formatWebsite, isMeetingType } from "@/lib/utils";

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

const RE_EMAIL_NAME = /^"?([^"<]+)"?\s*</;
const RE_QUOTE_TEXT = /\r?\n\s*On .+wrote:\s*\n[\s\S]*/;
const RE_GMAIL_QUOTE = /<div class="gmail_quote"[\s\S]*$/i;
const RE_BLOCKQUOTE_TAIL = /<blockquote[^>]*>[\s\S]*$/i;

function parseEmailName(raw: string): string {
  const match = raw.match(RE_EMAIL_NAME);
  if (match) {
    return match[1].trim();
  }
  return raw.split("@")[0];
}

function isFromLead(from: string, leadEmail: string): boolean {
  return from.toLowerCase().includes(leadEmail.toLowerCase());
}

function decodeHtmlEntities(str: string): string {
  const map: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&#39;": "'",
    "&apos;": "'",
    "&quot;": '"',
    "&#x27;": "'",
    "&#x2F;": "/",
    "&nbsp;": " ",
  };
  return str.replace(/&(?:#x?[0-9a-f]+|[a-z]+);/gi, (ent) => map[ent] ?? ent);
}

function stripQuotedHtml(html: string): string {
  let clean = html.replace(RE_GMAIL_QUOTE, "");
  clean = clean.replace(RE_BLOCKQUOTE_TAIL, "");
  return clean.trim();
}

function stripQuotedText(text: string): string {
  return text.replace(RE_QUOTE_TEXT, "").trim();
}

const INITIAL_EMAIL_COUNT = 20;

function EmailThreadView({
  emails,
  leadEmail,
  leadId,
  leadName,
}: {
  emails: GmailMessage[];
  leadEmail: string;
  leadId: string;
  leadName: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "sent" | "received">("all");
  const [showCount, setShowCount] = useState(INITIAL_EMAIL_COUNT);

  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeBcc, setComposeBcc] = useState("");
  const [showExtraFields, setShowExtraFields] = useState(false);
  const [replyCtx, setReplyCtx] = useState<{
    threadId: string;
    messageId: string;
    subject: string;
  } | null>(null);

  const sendEmail = useSendEmail();
  const { data: gConn } = useGoogleConnection();

  const sorted = [...emails].sort(
    (a, b) => Number(b.internalDate) - Number(a.internalDate)
  );

  const filtered = sorted.filter((msg) => {
    const received = isFromLead(msg.from, leadEmail);
    if (filter === "sent" && received) {
      return false;
    }
    if (filter === "received" && !received) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        msg.subject?.toLowerCase().includes(q) ||
        msg.snippet?.toLowerCase().includes(q) ||
        msg.from?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  function startReply(msg: GmailMessage) {
    const subj = msg.subject?.startsWith("Re:")
      ? msg.subject
      : `Re: ${msg.subject}`;
    setReplyCtx({
      threadId: msg.threadId,
      messageId: msg.messageId,
      subject: subj,
    });
    setComposeSubject(subj);
    setComposeBody("");
    setComposeCc(msg.cc || "");
    setComposeBcc("");
    setShowExtraFields(!!msg.cc);
  }

  function resetCompose() {
    setReplyCtx(null);
    setComposeSubject("");
    setComposeBody("");
    setComposeCc("");
    setComposeBcc("");
    setShowExtraFields(false);
  }

  function handleQuickSend() {
    const body = composeBody.trim();
    if (!body) {
      return;
    }
    const subject = composeSubject.trim() || `Message to ${leadName}`;
    sendEmail.mutate(
      {
        leadId,
        data: {
          subject,
          body,
          sendVia: gConn?.hasGmail ? "gmail" : "resend",
          cc: composeCc.trim() || undefined,
          bcc: composeBcc.trim() || undefined,
          threadId: replyCtx?.threadId,
          replyToMessageId: replyCtx?.messageId,
        },
      },
      { onSuccess: resetCompose }
    );
  }

  const threads = new Map<string, GmailMessage[]>();
  for (const e of filtered) {
    const tid = e.threadId;
    if (!threads.has(tid)) {
      threads.set(tid, []);
    }
    threads.get(tid)?.push(e);
  }
  for (const msgs of threads.values()) {
    msgs.sort((a, b) => Number(a.internalDate) - Number(b.internalDate));
  }
  const sortedThreads = [...threads.entries()].sort(
    ([, a], [, b]) =>
      Number(b.at(-1)?.internalDate ?? 0) - Number(a.at(-1)?.internalDate ?? 0)
  );
  const visibleThreads = sortedThreads.slice(0, showCount);
  const hasMoreThreads = sortedThreads.length > showCount;

  return (
    <div className="flex h-full flex-col">
      {/* toolbar */}
      <div className="flex items-center gap-2 pb-3">
        <div className="relative flex-1">
          <HugeiconsIcon
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
            icon={Search01Icon}
            size={13}
            strokeWidth={1.5}
          />
          <input
            className="h-8 w-full rounded-lg border bg-background pr-3 pl-8 text-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-ring"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emails..."
            type="text"
            value={search}
          />
        </div>
        <SegmentedControl
          onChange={setFilter}
          segments={[
            { value: "all" as const, label: "All" },
            { value: "received" as const, label: "In" },
            { value: "sent" as const, label: "Out" },
          ]}
          value={filter}
        />
      </div>

      {/* thread count */}
      {sortedThreads.length > 0 && (
        <div className="pb-2 text-[10px] text-muted-foreground">
          {sortedThreads.length} thread
          {sortedThreads.length === 1 ? "" : "s"} · {filtered.length} message
          {filtered.length === 1 ? "" : "s"}
          {search && " matching"}
        </div>
      )}

      {/* conversation view */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        {visibleThreads.length === 0 && (
          <EmptyState
            message={search ? "No emails match your search" : "No emails found"}
          />
        )}

        {visibleThreads.map(([threadId, msgs]) => {
          const subject = msgs[0]?.subject || "(no subject)";
          const lastMsg = msgs.at(-1);

          return (
            <div className="rounded-xl border bg-card/30" key={threadId}>
              {/* thread subject header */}
              <div className="flex items-center gap-2 border-b px-4 py-2">
                <HugeiconsIcon
                  className="shrink-0 text-muted-foreground"
                  icon={Mail01Icon}
                  size={12}
                  strokeWidth={1.5}
                />
                <span className="min-w-0 flex-1 truncate font-medium text-xs">
                  {subject}
                </span>
                {msgs.length > 1 && (
                  <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                    {msgs.length}
                  </span>
                )}
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {dayjs(Number(lastMsg?.internalDate ?? 0)).fromNow()}
                </span>
              </div>

              {/* messages as chat bubbles */}
              <div className="space-y-2 p-3">
                {msgs.map((msg) => {
                  const received = isFromLead(msg.from, leadEmail);
                  const sender = parseEmailName(msg.from);
                  const ts = dayjs(Number(msg.internalDate));
                  const expanded = openId === msg.id;

                  return (
                    <div
                      className={`flex ${received ? "justify-start" : "justify-end"}`}
                      key={msg.id}
                    >
                      <div
                        className={`max-w-[88%] ${received ? "pr-6" : "pl-6"}`}
                      >
                        <button
                          className={`w-full rounded-2xl px-3.5 py-2 text-left transition-colors ${
                            received
                              ? "rounded-bl-sm bg-muted/70 hover:bg-muted"
                              : "rounded-br-sm bg-primary/10 hover:bg-primary/15"
                          } ${expanded ? "ring-1 ring-ring/30" : ""}`}
                          onClick={() => setOpenId(expanded ? null : msg.id)}
                          type="button"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex size-5 shrink-0 items-center justify-center rounded-full font-bold text-[8px] ${
                                received
                                  ? "bg-amber-500/20 text-amber-500"
                                  : "bg-primary/15 text-primary"
                              }`}
                            >
                              {sender.charAt(0).toUpperCase()}
                            </span>
                            <span className="truncate font-medium text-[11px]">
                              {sender}
                            </span>
                            <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                              {ts.format("h:mm A")}
                            </span>
                          </div>
                          {!expanded && (
                            <p className="mt-1 line-clamp-2 text-foreground/70 text-xs leading-relaxed">
                              {decodeHtmlEntities(msg.snippet)}
                            </p>
                          )}
                        </button>

                        {expanded && (
                          <div className="mt-1 rounded-xl border bg-background px-4 py-3">
                            <div className="mb-2 space-y-0.5 text-[10px] text-muted-foreground">
                              <div className="flex flex-wrap items-center gap-x-3">
                                <span>{msg.from}</span>
                                <span className="text-muted-foreground/40">
                                  →
                                </span>
                                <span>{msg.to}</span>
                                <span className="ml-auto font-mono">
                                  {ts.format("MMM D, YYYY h:mm A")}
                                </span>
                              </div>
                              {msg.cc && (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-muted-foreground/70">
                                    CC
                                  </span>
                                  <span>{msg.cc}</span>
                                </div>
                              )}
                              {msg.bcc && (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-muted-foreground/70">
                                    BCC
                                  </span>
                                  <span>{msg.bcc}</span>
                                </div>
                              )}
                            </div>
                            {msg.bodyHtml ? (
                              <div
                                className="max-h-72 overflow-y-auto text-[13px] leading-relaxed **:max-w-full [&_a]:text-primary [&_a]:underline [&_blockquote]:border-muted [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_img]:max-w-full [&_img]:rounded"
                                // biome-ignore lint/security/noDangerouslySetInnerHtml: email HTML
                                dangerouslySetInnerHTML={{
                                  __html: stripQuotedHtml(msg.bodyHtml),
                                }}
                              />
                            ) : (
                              <p className="max-h-72 overflow-y-auto whitespace-pre-wrap text-[13px] leading-relaxed">
                                {stripQuotedText(msg.bodyText || msg.snippet)}
                              </p>
                            )}
                            <div className="mt-2 flex justify-end border-t pt-2">
                              <button
                                className="rounded-md px-2.5 py-1 font-medium text-[11px] text-primary transition-colors hover:bg-primary/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startReply(msg);
                                }}
                                type="button"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* quick reply to thread */}
              {lastMsg && (
                <div className="border-t px-4 py-2">
                  <button
                    className="font-medium text-[11px] text-primary transition-colors hover:text-primary/80"
                    onClick={() => {
                      if (lastMsg) {
                        startReply(lastMsg);
                      }
                    }}
                    type="button"
                  >
                    Reply to thread
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {hasMoreThreads && (
          <button
            className="flex w-full items-center justify-center gap-1 rounded-lg py-2 text-muted-foreground text-xs transition-colors hover:bg-muted/30 hover:text-foreground"
            onClick={() => setShowCount((c) => c + INITIAL_EMAIL_COUNT)}
            type="button"
          >
            Show older threads ({sortedThreads.length - showCount} more)
          </button>
        )}
      </div>

      {/* inline compose */}
      <div className="border-t pt-3">
        {replyCtx && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-1.5 text-[11px]">
            <span className="flex-1 truncate text-muted-foreground">
              Replying to:{" "}
              <span className="font-medium text-foreground">
                {replyCtx.subject}
              </span>
            </span>
            <button
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              onClick={resetCompose}
              type="button"
            >
              ✕
            </button>
          </div>
        )}
        {showExtraFields && (
          <div className="mb-2 space-y-1.5">
            {!replyCtx && (
              <input
                className="h-8 w-full rounded-lg border bg-background px-3 text-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-ring"
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Subject"
                type="text"
                value={composeSubject}
              />
            )}
            <input
              className="h-8 w-full rounded-lg border bg-background px-3 text-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-ring"
              onChange={(e) => setComposeCc(e.target.value)}
              placeholder="CC (comma-separated emails)"
              type="text"
              value={composeCc}
            />
            <input
              className="h-8 w-full rounded-lg border bg-background px-3 text-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-ring"
              onChange={(e) => setComposeBcc(e.target.value)}
              placeholder="BCC (comma-separated emails)"
              type="text"
              value={composeBcc}
            />
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            className="block max-h-28 min-h-[36px] flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-xs leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-ring"
            onChange={(e) => setComposeBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleQuickSend();
              }
            }}
            placeholder={
              replyCtx
                ? "Write your reply... (Cmd+Enter)"
                : `Message ${leadName}... (Cmd+Enter)`
            }
            rows={1}
            value={composeBody}
          />
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              className={`flex size-8 items-center justify-center rounded-lg transition-colors ${
                showExtraFields
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
              onClick={() => setShowExtraFields((s) => !s)}
              title="Subject, CC, BCC"
              type="button"
            >
              <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={1.5} />
            </button>
            <Button
              disabled={!composeBody.trim() || sendEmail.isPending}
              onClick={handleQuickSend}
              size="sm"
            >
              {sendEmail.isPending && "..."}
              {!sendEmail.isPending && replyCtx && "Reply"}
              {!(sendEmail.isPending || replyCtx) && "Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LeadDetailClient({ leadId }: { leadId: string }) {
  const router = useRouter();
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

      {/* Two-panel layout that fills viewport */}
      <div className="flex min-h-0 flex-1">
        {/* LEFT — Profile + Activity */}
        <div className="flex min-h-0 flex-1 flex-col border-r">
          {/* Profile strip */}
          <div className="shrink-0 border-b px-6 py-4">
            <div className="flex items-center gap-4">
              <UserAvatar name={lead.name} size="xl" />
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <h1 className="truncate font-semibold text-lg tracking-tight">
                    {lead.name}
                  </h1>
                  <StatusBadge status={lead.status} />
                  {(() => {
                    const score = computeLeadScore({
                      value: lead.value,
                      status: lead.status,
                      activitiesCount: lead.activities?.length ?? 0,
                      tasksCount: lead.tasks?.length ?? 0,
                      daysSinceCreated: dayjs().diff(
                        dayjs(lead.createdAt),
                        "day"
                      ),
                    });
                    return (
                      <span
                        className={`rounded-sm px-2 py-0.5 font-mono text-xs ${getScoreBgColor(score)}`}
                      >
                        {score} {getScoreLabel(score)}
                      </span>
                    );
                  })()}
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

          {/* Scrollable content */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {leftTab === "activity" && (
              <>
                {lead.activities.length === 0 && (
                  <EmptyState message="No activity yet" />
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
              <EmailThreadView
                emails={leadEmails}
                leadEmail={lead.email}
                leadId={id}
                leadName={lead.name}
              />
            )}
          </div>
        </div>

        {/* RIGHT — Details + Assigned To + Tasks sidebar */}
        <div className="flex w-80 shrink-0 flex-col lg:w-96">
          {/* Details section */}
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
              {lead.customFields &&
                Object.keys(lead.customFields as Record<string, string>)
                  .length > 0 &&
                Object.entries(lead.customFields as Record<string, string>).map(
                  ([key, val]) => (
                    <DetailField key={key} label={key}>
                      {val}
                    </DetailField>
                  )
                )}
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

          {/* Assigned To section */}
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
                {teamMembers.map((m: TeamMember) => (
                  <DropdownMenuItem
                    key={m.id}
                    onClick={() =>
                      assignLead.mutate({ leadId: id, assignedTo: m.id })
                    }
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

          <LeadTasksSidebar
            leadId={id}
            leadPhone={lead.phone}
            tasks={lead.tasks}
            teamMembers={teamMembers as TeamMember[]}
          />
        </div>
      </div>

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

// ---------------------------------------------------------------------------
// Tasks sidebar for lead detail
// ---------------------------------------------------------------------------
interface LeadTask {
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

function LeadTasksSidebar({
  leadId,
  leadPhone,
  tasks,
  teamMembers,
}: {
  leadId: string;
  leadPhone?: string | null;
  tasks: LeadTask[];
  teamMembers: TeamMember[];
}) {
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
              {teamMembers.map((m) => (
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
                    : (RECURRENCE_LABELS[newTaskRecurrence] ??
                      newTaskRecurrence)
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
            <Button
              onClick={() => setShowAddTask(false)}
              size="sm"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              disabled={
                createTask.isPending || !newTaskTitle.trim() || !newTaskDue
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

function LeadTaskDetail({
  task: t,
  leadId,
  leadPhone,
  onDelete,
}: {
  task: {
    id: string;
    title: string;
    description: string | null;
    dueAt: Date;
    type: string;
    calendarEventId: string | null;
    meetingLink: string | null;
    user: { id: string; name: string } | null;
  };
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
// Single task row for lead detail — expandable
// ---------------------------------------------------------------------------
function LeadTaskRow({
  task: t,
  leadId,
  leadPhone,
  expanded,
  onToggleExpand,
  onToggle,
  onDelete,
}: {
  task: {
    id: string;
    title: string;
    description: string | null;
    dueAt: Date;
    completedAt: Date | null;
    type: string;
    recurrence: string | null;
    meetingLink: string | null;
    calendarEventId: string | null;
    user: { id: string; name: string } | null;
  };
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
            {t.type === "call" && !expanded && leadPhone && (
              <a
                className="shrink-0 rounded-sm bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-400 transition-colors hover:bg-blue-500/20"
                href={`tel:${leadPhone}`}
                onClick={(e) => e.stopPropagation()}
              >
                Call
              </a>
            )}
            {t.type === "email" && !expanded && (
              <Link
                className="shrink-0 rounded-sm bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-400 transition-colors hover:bg-violet-500/20"
                href={`/leads/${leadId}`}
                onClick={(e) => e.stopPropagation()}
              >
                Email
              </Link>
            )}
            {t.type === "linkedin" && !expanded && (
              <a
                className="shrink-0 rounded-sm bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-400 transition-colors hover:bg-sky-500/20"
                href="https://linkedin.com"
                onClick={(e) => e.stopPropagation()}
                rel="noopener noreferrer"
                target="_blank"
              >
                LinkedIn
              </a>
            )}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-1">
            <TaskTypeBadge type={t.type} />
            <RecurrenceBadge recurrence={t.recurrence} />
            <span
              className={`text-[11px] ${overdue ? "text-red-400" : "text-muted-foreground"}`}
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
