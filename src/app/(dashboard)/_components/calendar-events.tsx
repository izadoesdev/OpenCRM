import { Calendar01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Pill } from "@/components/micro";
import type { CalendarEvent } from "@/lib/actions/calendar";
import dayjs from "@/lib/dayjs";

export function CalendarEvents({ events }: { events: CalendarEvent[] }) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <HugeiconsIcon
          className="text-muted-foreground"
          icon={Calendar01Icon}
          size={14}
          strokeWidth={1.5}
        />
        <h2 className="font-medium text-sm">Upcoming Events</h2>
      </div>

      <div className="mt-2 space-y-1">
        {events.map((ev) => (
          <a
            className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/40"
            href={ev.htmlLink}
            key={ev.id}
            rel="noopener noreferrer"
            target="_blank"
          >
            <div className="flex shrink-0 flex-col items-end">
              <span className="font-mono text-[10px] text-muted-foreground">
                {dayjs(ev.start.dateTime).format("h:mm A")}
              </span>
              <span className="text-[9px] text-muted-foreground/70">
                {dayjs(ev.start.dateTime).fromNow()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm">{ev.summary}</span>
              {(ev.attendees?.length ?? 0) > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {ev.attendees?.length} attendee
                  {ev.attendees?.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
            {ev.hangoutLink && <Pill variant="success">Meet</Pill>}
          </a>
        ))}
      </div>
    </div>
  );
}
