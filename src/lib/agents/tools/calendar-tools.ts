import { tool } from "ai";
import { z } from "zod/v4";
import {
  addCalendarAttendees,
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvent,
  getUpcomingCalendarEvents,
  searchCalendarEvents,
  updateCalendarEvent,
} from "@/lib/actions/calendar";
import { checkGoogleConnection } from "@/lib/google";

function ensureCalendar() {
  return async () => {
    const conn = await checkGoogleConnection();
    if (!(conn.connected && conn.hasCalendar)) {
      return {
        error: "Google Calendar not connected. Connect in Settings > Google.",
      } as const;
    }
    return null;
  };
}

function formatEvent(e: {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  status: string;
  htmlLink: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{ entryPointType: string; uri: string }>;
  };
  attendees?: Array<{ email: string; responseStatus?: string }>;
}) {
  return {
    id: e.id,
    summary: e.summary,
    description: e.description ?? null,
    start: e.start.dateTime,
    end: e.end.dateTime,
    timeZone: e.start.timeZone ?? null,
    status: e.status,
    attendees: e.attendees?.map((a) => ({
      email: a.email,
      rsvp: a.responseStatus ?? "needsAction",
    })),
    meetLink:
      e.hangoutLink ??
      e.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === "video")
        ?.uri ??
      null,
    htmlLink: e.htmlLink,
  };
}

function createCalendarTools() {
  const checkCal = ensureCalendar();

  const listUpcomingEvents = tool({
    description:
      "List upcoming Google Calendar events from now forward. Use this for quick schedule checks like 'what's next' or 'what do I have today'.",
    inputSchema: z.object({
      maxResults: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe("Max events to return (default 10)"),
    }),
    execute: async ({ maxResults }) => {
      const err = await checkCal();
      if (err) {
        return err;
      }

      const events = await getUpcomingCalendarEvents({
        maxResults: maxResults ?? 10,
      });
      return { count: events.length, events: events.map(formatEvent) };
    },
  });

  const searchEvents = tool({
    description: `Search Google Calendar events by text query, date range, or both. Use for finding specific events, checking availability on a date, or looking at past meetings.

Examples:
- Search by keyword: query="standup"
- Events on a specific day: timeMin="2026-03-17T00:00:00Z", timeMax="2026-03-18T00:00:00Z"
- Events this week with a person: query="Jane", timeMin/timeMax for the week
- Past meetings: set timeMin/timeMax in the past`,
    inputSchema: z.object({
      query: z
        .string()
        .optional()
        .describe("Text search across event titles and descriptions"),
      timeMin: z
        .string()
        .optional()
        .describe(
          "Start of date range (ISO 8601). Defaults to 1 year ago if omitted."
        ),
      timeMax: z
        .string()
        .optional()
        .describe("End of date range (ISO 8601). Omit for open-ended."),
      maxResults: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe("Max events to return (default 25)"),
    }),
    execute: async ({ query, timeMin, timeMax, maxResults }) => {
      const err = await checkCal();
      if (err) {
        return err;
      }

      const events = await searchCalendarEvents({
        query,
        timeMin,
        timeMax,
        maxResults: maxResults ?? 25,
      });
      return { count: events.length, events: events.map(formatEvent) };
    },
  });

  const getEvent = tool({
    description: "Get full details for a specific calendar event by its ID.",
    inputSchema: z.object({
      eventId: z.string().describe("Calendar event ID"),
    }),
    execute: async ({ eventId }) => {
      const err = await checkCal();
      if (err) {
        return err;
      }

      const event = await getCalendarEvent(eventId);
      return formatEvent(event);
    },
  });

  const createEvent = tool({
    description:
      "Create a Google Calendar event. Adds a Google Meet link by default when attendees are included.",
    inputSchema: z.object({
      summary: z.string().describe("Event title"),
      description: z
        .string()
        .optional()
        .describe("Event description or agenda"),
      startTime: z.string().describe("ISO 8601 start time"),
      endTime: z
        .string()
        .optional()
        .describe("ISO 8601 end time (default: 1 hour after start)"),
      attendeeEmails: z
        .array(z.string())
        .optional()
        .describe("Emails to invite"),
      addMeetLink: z
        .boolean()
        .optional()
        .describe(
          "Add a Google Meet link (default: true if attendees present, false otherwise)"
        ),
    }),
    execute: async ({
      summary,
      description,
      startTime,
      endTime,
      attendeeEmails,
      addMeetLink,
    }) => {
      const err = await checkCal();
      if (err) {
        return err;
      }

      const shouldAddMeet =
        addMeetLink ?? (attendeeEmails && attendeeEmails.length > 0);

      const result = await createCalendarEvent({
        summary,
        description,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : undefined,
        attendeeEmails,
        addMeetLink: shouldAddMeet ?? false,
      });

      return {
        success: true,
        eventId: result.eventId,
        meetLink: result.meetLink,
        htmlLink: result.htmlLink,
      };
    },
  });

  const updateEvent = tool({
    description:
      "Update an existing Google Calendar event. Can change title, description, time, or attendees.",
    inputSchema: z.object({
      eventId: z.string().describe("Calendar event ID"),
      summary: z.string().optional().describe("New event title"),
      description: z.string().optional().describe("New description"),
      startTime: z.string().optional().describe("New ISO 8601 start time"),
      endTime: z.string().optional().describe("New ISO 8601 end time"),
      attendeeEmails: z
        .array(z.string())
        .optional()
        .describe("Replace attendee list entirely"),
    }),
    execute: async ({
      eventId,
      summary,
      description,
      startTime,
      endTime,
      attendeeEmails,
    }) => {
      const err = await checkCal();
      if (err) {
        return err;
      }

      const updated = await updateCalendarEvent(eventId, {
        summary,
        description,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        attendeeEmails,
      });

      return {
        success: true,
        ...formatEvent(updated),
      };
    },
  });

  const addAttendees = tool({
    description:
      "Add attendees to an existing calendar event without removing current ones. Sends calendar invitations to new attendees.",
    inputSchema: z.object({
      eventId: z.string().describe("Calendar event ID"),
      emails: z.array(z.string()).min(1).describe("Email addresses to add"),
    }),
    execute: async ({ eventId, emails }) => {
      const err = await checkCal();
      if (err) {
        return err;
      }

      const updated = await addCalendarAttendees(eventId, emails);
      return {
        success: true,
        addedCount: emails.length,
        totalAttendees: updated.attendees?.length ?? 0,
        ...formatEvent(updated),
      };
    },
  });

  const deleteEvent = tool({
    description: "Delete a Google Calendar event by ID.",
    inputSchema: z.object({
      eventId: z.string().describe("Calendar event ID to delete"),
    }),
    execute: async ({ eventId }) => {
      const err = await checkCal();
      if (err) {
        return err;
      }

      await deleteCalendarEvent(eventId);
      return { success: true, deletedEventId: eventId };
    },
  });

  return {
    listUpcomingEvents,
    searchCalendarEvents: searchEvents,
    getCalendarEvent: getEvent,
    createCalendarEvent: createEvent,
    updateCalendarEvent: updateEvent,
    addCalendarAttendees: addAttendees,
    deleteCalendarEvent: deleteEvent,
  };
}

export { createCalendarTools };
