"use client";

import {
  Cancel01Icon,
  CheckmarkCircle01Icon,
  ComputerVideoCallIcon,
  HelpCircleIcon,
  Link01Icon,
  Mail01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { SectionHeader, UserAvatar } from "@/components/micro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAddTaskAttendees, useCalendarEvent } from "@/lib/queries";

const RSVP_CONFIG: Record<
  string,
  { icon: typeof CheckmarkCircle01Icon; label: string; className: string }
> = {
  accepted: {
    icon: CheckmarkCircle01Icon,
    label: "Accepted",
    className: "text-emerald-400",
  },
  declined: {
    icon: Cancel01Icon,
    label: "Declined",
    className: "text-red-400",
  },
  tentative: {
    icon: HelpCircleIcon,
    label: "Maybe",
    className: "text-amber-400",
  },
  needsAction: {
    icon: Mail01Icon,
    label: "Pending",
    className: "text-muted-foreground",
  },
};

export function MeetingDetail({
  calendarEventId,
  meetingLink,
  taskId,
  leadId,
}: {
  calendarEventId: string;
  meetingLink: string | null;
  taskId: string;
  leadId: string;
}) {
  const { data: event, isLoading } = useCalendarEvent(calendarEventId);
  const addAttendees = useAddTaskAttendees();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  function handleInvite() {
    if (!inviteEmail.trim()) {
      return;
    }
    addAttendees.mutate(
      {
        id: taskId,
        emails: [inviteEmail.trim()],
        calendarEventId,
        leadId,
      },
      {
        onSuccess: () => {
          setInviteEmail("");
          setShowInvite(false);
        },
      }
    );
  }

  const attendees = event?.attendees ?? [];

  return (
    <div className="space-y-2.5">
      {meetingLink && <MeetingLinkBadge href={meetingLink} />}

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <SectionHeader
            className="mb-0"
            count={isLoading ? undefined : attendees.length}
          >
            Attendees
          </SectionHeader>
          <button
            className="text-[11px] text-primary hover:underline"
            onClick={() => setShowInvite(!showInvite)}
            type="button"
          >
            + Invite
          </button>
        </div>

        {isLoading && <p className="text-muted-foreground text-xs">Loading…</p>}

        {!isLoading && attendees.length === 0 && (
          <p className="text-muted-foreground text-xs">No attendees yet</p>
        )}

        {attendees.length > 0 && (
          <div className="space-y-0.5">
            {attendees.map((a) => {
              const rsvp =
                RSVP_CONFIG[a.responseStatus ?? "needsAction"] ??
                RSVP_CONFIG.needsAction;
              return (
                <div
                  className="flex items-center gap-2 rounded-md px-1 py-0.5"
                  key={a.email}
                >
                  <UserAvatar name={a.email.split("@")[0]} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-xs">
                    {a.email}
                  </span>
                  <span
                    className={`flex items-center gap-0.5 text-[10px] ${rsvp.className}`}
                  >
                    <HugeiconsIcon icon={rsvp.icon} size={10} strokeWidth={2} />
                    {rsvp.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {showInvite && (
          <div className="mt-2 flex items-center gap-2">
            <Input
              autoFocus
              className="h-7 flex-1 text-xs"
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleInvite();
                }
                if (e.key === "Escape") {
                  setShowInvite(false);
                }
              }}
              placeholder="email@example.com"
              type="email"
              value={inviteEmail}
            />
            <Button
              className="h-7 text-xs"
              disabled={!inviteEmail.trim() || addAttendees.isPending}
              onClick={handleInvite}
              size="sm"
            >
              {addAttendees.isPending ? "…" : "Send"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function MeetingLinkBadge({ href }: { href: string }) {
  const isGoogleMeet = href.includes("meet.google");
  return (
    <a
      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1 text-emerald-400 text-xs transition-colors hover:bg-emerald-500/20"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <HugeiconsIcon
        icon={isGoogleMeet ? ComputerVideoCallIcon : Link01Icon}
        size={12}
        strokeWidth={1.5}
      />
      Join Meeting
      {isGoogleMeet && <span className="text-emerald-400/60">Google Meet</span>}
    </a>
  );
}

export function MeetingLinkPill({
  href,
  onClick,
}: {
  href: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <a
      className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400 transition-colors hover:bg-emerald-500/20"
      href={href}
      onClick={onClick}
      rel="noopener noreferrer"
      target="_blank"
    >
      <HugeiconsIcon icon={ComputerVideoCallIcon} size={10} strokeWidth={2} />
      Join
    </a>
  );
}
