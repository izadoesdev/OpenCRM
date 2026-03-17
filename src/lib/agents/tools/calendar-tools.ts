import { tool } from "ai";
import { z } from "zod/v4";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getUpcomingCalendarEvents,
  updateCalendarEvent,
} from "@/lib/actions/calendar";
import { checkGoogleConnection } from "@/lib/google";

function createCalendarTools() {
  const listCalendarEvents = tool({
    description:
      "List upcoming Google Calendar events. Returns the next N events sorted by start time. Use this to check the user's schedule.",
    inputSchema: z.object({
      maxResults: z
        .number()
        .int()
        .min(1)
        .max(25)
        .optional()
        .describe("Max events to return (default 10)"),
    }),
    execute: async ({ maxResults }) => {
      const conn = await checkGoogleConnection();
      if (!(conn.connected && conn.hasCalendar)) {
        return {
          error: "Google Calendar not connected. Connect in Settings > Google.",
        };
      }

      const events = await getUpcomingCalendarEvents({
        maxResults: maxResults ?? 10,
      });

      return {
        count: events.length,
        events: events.map((e) => ({
          id: e.id,
          summary: e.summary,
          start: e.start.dateTime,
          end: e.end.dateTime,
          status: e.status,
          attendees: e.attendees?.map((a) => ({
            email: a.email,
            rsvp: a.responseStatus ?? "needsAction",
          })),
          meetLink: e.hangoutLink ?? null,
          htmlLink: e.htmlLink,
        })),
      };
    },
  });

  const createEvent = tool({
    description:
      "Create a Google Calendar event. Optionally adds a Google Meet link and invites attendees.",
    inputSchema: z.object({
      summary: z.string().describe("Event title"),
      description: z.string().optional().describe("Event description"),
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
        .describe("Add a Google Meet link (default false)"),
    }),
    execute: async ({
      summary,
      description,
      startTime,
      endTime,
      attendeeEmails,
      addMeetLink,
    }) => {
      const conn = await checkGoogleConnection();
      if (!(conn.connected && conn.hasCalendar)) {
        return {
          error: "Google Calendar not connected. Connect in Settings > Google.",
        };
      }

      const result = await createCalendarEvent({
        summary,
        description,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : undefined,
        attendeeEmails,
        addMeetLink: addMeetLink ?? false,
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
        .describe("Replace attendee list"),
    }),
    execute: async ({
      eventId,
      summary,
      description,
      startTime,
      endTime,
      attendeeEmails,
    }) => {
      const conn = await checkGoogleConnection();
      if (!(conn.connected && conn.hasCalendar)) {
        return {
          error: "Google Calendar not connected. Connect in Settings > Google.",
        };
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
        eventId: updated.id,
        summary: updated.summary,
        start: updated.start.dateTime,
        end: updated.end.dateTime,
      };
    },
  });

  const deleteEvent = tool({
    description: "Delete a Google Calendar event by ID.",
    inputSchema: z.object({
      eventId: z.string().describe("Calendar event ID to delete"),
    }),
    execute: async ({ eventId }) => {
      const conn = await checkGoogleConnection();
      if (!(conn.connected && conn.hasCalendar)) {
        return {
          error: "Google Calendar not connected. Connect in Settings > Google.",
        };
      }

      await deleteCalendarEvent(eventId);
      return { success: true, deletedEventId: eventId };
    },
  });

  return {
    listCalendarEvents,
    createCalendarEvent: createEvent,
    updateCalendarEvent: updateEvent,
    deleteCalendarEvent: deleteEvent,
  };
}

export { createCalendarTools };
