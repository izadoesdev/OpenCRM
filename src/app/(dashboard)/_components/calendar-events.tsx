"use client";

import {
  Cancel01Icon,
  CheckmarkCircle01Icon,
  HelpCircleIcon,
  Link01Icon,
  Mail01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { MeetingLinkBadge } from "@/components/meeting-detail";
import { Pill, UserAvatar } from "@/components/micro";
import type { CalendarEvent } from "@/lib/actions/calendar";
import dayjs from "@/lib/dayjs";
import { cn } from "@/lib/utils";

const RSVP_CONFIG: Record<
  string,
  { icon: typeof CheckmarkCircle01Icon; label: string; className: string }
> = {
  accepted: {
    icon: CheckmarkCircle01Icon,
    label: "Accepted",
    className: "text-emerald-600",
  },
  declined: {
    icon: Cancel01Icon,
    label: "Declined",
    className: "text-red-600",
  },
  tentative: {
    icon: HelpCircleIcon,
    label: "Maybe",
    className: "text-amber-600",
  },
  needsAction: {
    icon: Mail01Icon,
    label: "Pending",
    className: "text-muted-foreground",
  },
};

export function CalendarEvents({ events }: { events: CalendarEvent[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="space-y-0.5">
      {events.map((ev) => {
        const expanded = expandedId === ev.id;
        return (
          <CalendarEventRow
            event={ev}
            expanded={expanded}
            key={ev.id}
            onToggleExpand={() => setExpandedId(expanded ? null : ev.id)}
          />
        );
      })}
    </div>
  );
}

function CalendarEventRow({
  event: ev,
  expanded,
  onToggleExpand,
}: {
  event: CalendarEvent;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const start = dayjs(ev.start.dateTime);
  const end = dayjs(ev.end.dateTime);
  const attendees = ev.attendees ?? [];

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
        <div className="flex shrink-0 flex-col items-end">
          <span className="font-mono text-[10px] text-muted-foreground">
            {start.format("h:mm A")}
          </span>
          <span className="text-[9px] text-muted-foreground/70">
            {start.fromNow()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <span className="block truncate text-[13px] leading-tight">
            {ev.summary}
          </span>
          <div className="mt-1 flex items-center gap-2">
            {attendees.length > 0 && (
              <span className="text-[11px] text-muted-foreground">
                {attendees.length} attendee
                {attendees.length === 1 ? "" : "s"}
              </span>
            )}
            <span className="ml-auto shrink-0" />
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              {start.format("h:mm A")} – {end.format("h:mm A")}
            </span>
          </div>
        </div>
        {ev.hangoutLink && !expanded && <Pill variant="success">Meet</Pill>}
      </button>

      {expanded && (
        <div className="border-t px-3.5 pt-3 pb-3.5">
          <div className="space-y-2.5">
            {ev.hangoutLink && <MeetingLinkBadge href={ev.hangoutLink} />}

            <div className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2.5 text-[13px]">
              <span className="text-muted-foreground text-xs">When</span>
              <span>
                {start.format("MMM D, YYYY · h:mm A")} – {end.format("h:mm A")}
              </span>

              {ev.status && (
                <>
                  <span className="text-muted-foreground text-xs">Status</span>
                  <Pill
                    variant={ev.status === "confirmed" ? "success" : "muted"}
                  >
                    {ev.status}
                  </Pill>
                </>
              )}
            </div>

            {ev.description && (
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {ev.description}
              </p>
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
                        className={cn(
                          "flex items-center gap-0.5 text-[10px]",
                          rsvp.className
                        )}
                      >
                        <HugeiconsIcon
                          icon={rsvp.icon}
                          size={10}
                          strokeWidth={2}
                        />
                        {rsvp.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-2 border-t pt-3">
              <a
                className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted/50"
                href={ev.htmlLink}
                rel="noopener noreferrer"
                target="_blank"
              >
                <HugeiconsIcon icon={Link01Icon} size={12} strokeWidth={1.5} />
                Open in Calendar
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
