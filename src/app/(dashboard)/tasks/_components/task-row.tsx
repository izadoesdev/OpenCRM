"use client";

import {
  Calendar03Icon,
  CallIcon,
  Clock01Icon,
  Delete02Icon,
  Edit02Icon,
  LinkSquare01Icon,
  Mail01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";
import {
  MeetingDetail,
  MeetingLinkBadge,
  MeetingLinkPill,
} from "@/components/meeting-detail";
import { UserAvatar } from "@/components/micro";
import { StatusBadge } from "@/components/status-badge";
import { TaskCheckbox } from "@/components/task-checkbox";
import { TaskInlineEdit } from "@/components/task-inline-edit";
import { RecurrenceBadge, TaskTypeBadge } from "@/components/task-type-picker";
import { Button } from "@/components/ui/button";
import dayjs from "@/lib/dayjs";
import { cn, isMeetingType } from "@/lib/utils";

export interface TaskWithLead {
  calendarEventId: string | null;
  completedAt: Date | null;
  description: string | null;
  dueAt: Date;
  id: string;
  lead: {
    id: string;
    name: string;
    status: string;
    phone?: string | null;
  } | null;
  leadId: string;
  meetingLink: string | null;
  recurrence: string | null;
  title: string;
  type: string;
  user: {
    email: string;
    id: string;
    image: string | null;
    name: string;
  } | null;
  userId: string | null;
}

function dueInfo(dueAt: Date, completed: boolean) {
  if (completed) {
    return { text: "Done", color: "text-muted-foreground" };
  }
  const d = dayjs(dueAt);
  if (d.isBefore(dayjs(), "minute")) {
    return { text: d.fromNow(), color: "text-red-500" };
  }
  if (d.isToday()) {
    return { text: d.format("h:mm A"), color: "text-amber-500" };
  }
  if (d.isTomorrow()) {
    return {
      text: `Tomorrow · ${d.format("h:mm A")}`,
      color: "text-foreground",
    };
  }
  return { text: d.format("MMM D · h:mm A"), color: "text-muted-foreground" };
}

function TaskDetail({
  task: t,
  onDelete,
}: {
  task: TaskWithLead;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <TaskInlineEdit
        leadId={t.leadId}
        onClose={() => setEditing(false)}
        task={t}
      />
    );
  }

  return (
    <div className="space-y-3.5">
      {t.description && (
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          {t.description}
        </p>
      )}

      {isMeetingType(t.type) && t.calendarEventId && (
        <MeetingDetail
          calendarEventId={t.calendarEventId}
          leadId={t.leadId}
          meetingLink={t.meetingLink}
          taskId={t.id}
        />
      )}

      {isMeetingType(t.type) && !t.calendarEventId && t.meetingLink && (
        <MeetingLinkBadge href={t.meetingLink} />
      )}

      <div className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2.5 text-[13px]">
        {t.lead && (
          <>
            <span className="text-muted-foreground text-xs">Lead</span>
            <div className="flex items-center gap-2">
              <Link
                className="font-medium hover:underline"
                href={`/leads/${t.lead.id}`}
              >
                {t.lead.name}
              </Link>
              <StatusBadge status={t.lead.status} />
            </div>
          </>
        )}
        {t.user && (
          <>
            <span className="text-muted-foreground text-xs">Assigned</span>
            <div className="flex items-center gap-2">
              <UserAvatar name={t.user.name} size="xs" />
              <span>{t.user.name}</span>
            </div>
          </>
        )}
        <span className="text-muted-foreground text-xs">Due</span>
        <div className="flex items-center gap-1.5">
          <HugeiconsIcon
            className="text-muted-foreground"
            icon={Calendar03Icon}
            size={12}
            strokeWidth={1.5}
          />
          <span>{dayjs(t.dueAt).format("MMM D, YYYY · h:mm A")}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {t.type === "call" && t.lead && (
          <a
            className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted/50"
            href={`tel:${t.lead?.phone ?? ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <HugeiconsIcon icon={CallIcon} size={12} strokeWidth={1.5} />
            Call
          </a>
        )}
        {t.type === "email" && t.lead && (
          <Link
            className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted/50"
            href={`/leads/${t.lead.id}`}
          >
            <HugeiconsIcon icon={Mail01Icon} size={12} strokeWidth={1.5} />
            Send Email
          </Link>
        )}
        {t.type === "linkedin" && (
          <a
            className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted/50"
            href="https://linkedin.com"
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

      <div className="flex items-center gap-2 border-t pt-3">
        <Button onClick={() => setEditing(true)} size="sm" variant="outline">
          <HugeiconsIcon icon={Edit02Icon} size={12} strokeWidth={1.5} />
          Edit
        </Button>
        <Button
          className="text-red-600 hover:bg-red-500/10 hover:text-red-600"
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

export function TaskRow({
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
  const due = dueInfo(dayjs(t.dueAt).toDate(), isComplete);
  const showJoin = isMeetingType(t.type) && t.meetingLink && !expanded;

  return (
    <div
      className={cn(
        "group rounded-lg border bg-background transition-colors",
        expanded ? "border-border" : "border-transparent hover:border-border/50"
      )}
    >
      <button
        className="flex w-full cursor-pointer items-center gap-3 px-3.5 py-3 text-left"
        onClick={onToggleExpand}
        type="button"
      >
        {/* biome-ignore lint/a11y: checkbox handles its own a11y */}
        <span className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <TaskCheckbox checked={isComplete} onChange={onToggleComplete} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex-1 truncate text-[13px] leading-tight",
                isComplete && "text-muted-foreground line-through"
              )}
            >
              {t.title}
            </span>

            {showJoin && (
              <MeetingLinkPill
                href={t.meetingLink ?? ""}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {t.type === "call" && !expanded && t.lead && (
              <a
                className="shrink-0 rounded-md bg-blue-500/10 px-2 py-0.5 font-medium text-[10px] text-blue-600 transition-colors hover:bg-blue-500/20"
                href={`tel:${t.lead?.phone ?? ""}`}
                onClick={(e) => e.stopPropagation()}
              >
                Call
              </a>
            )}
            {t.type === "email" && !expanded && t.lead && (
              <Link
                className="shrink-0 rounded-md bg-violet-500/10 px-2 py-0.5 font-medium text-[10px] text-violet-600 transition-colors hover:bg-violet-500/20"
                href={`/leads/${t.lead.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                Email
              </Link>
            )}
            {t.type === "linkedin" && !expanded && (
              <a
                className="shrink-0 rounded-md bg-sky-500/10 px-2 py-0.5 font-medium text-[10px] text-sky-600 transition-colors hover:bg-sky-500/20"
                href="https://linkedin.com"
                onClick={(e) => e.stopPropagation()}
                rel="noopener noreferrer"
                target="_blank"
              >
                LinkedIn
              </a>
            )}
          </div>

          <div className="mt-1.5 flex items-center gap-2">
            <TaskTypeBadge type={t.type} />
            <RecurrenceBadge recurrence={t.recurrence} />
            {t.lead && (
              <Link
                className="truncate text-muted-foreground text-xs transition-colors hover:text-foreground hover:underline"
                href={`/leads/${t.lead.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                {t.lead.name}
              </Link>
            )}
            <span className="ml-auto shrink-0" />
            <div
              className={cn("flex items-center gap-1 text-[11px]", due.color)}
            >
              <HugeiconsIcon icon={Clock01Icon} size={10} strokeWidth={1.5} />
              <span>{due.text}</span>
            </div>
          </div>
        </div>

        {showAssignee && t.user && (
          <div className="flex shrink-0 items-center gap-1.5 pl-2">
            <UserAvatar name={t.user.name} size="sm" />
            <span className="hidden text-muted-foreground text-xs lg:inline">
              {t.user.name.split(" ")[0]}
            </span>
          </div>
        )}
      </button>

      {expanded && (
        <div className="border-t px-3.5 pt-3.5 pb-4 pl-[44px]">
          <TaskDetail onDelete={onDelete} task={t} />
        </div>
      )}
    </div>
  );
}
