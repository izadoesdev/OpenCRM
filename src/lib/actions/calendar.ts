"use server";

import dayjs from "@/lib/dayjs";
import { googleFetch } from "@/lib/google";

const CAL_BASE = "https://www.googleapis.com/calendar/v3";

export interface CalendarEvent {
  attendees?: Array<{ email: string; responseStatus?: string }>;
  conferenceData?: {
    entryPoints?: Array<{ entryPointType: string; uri: string }>;
  };
  description?: string;
  end: { dateTime: string; timeZone?: string };
  hangoutLink?: string;
  htmlLink: string;
  id: string;
  start: { dateTime: string; timeZone?: string };
  status: string;
  summary: string;
}

interface CalendarListResponse {
  items: CalendarEvent[];
  nextPageToken?: string;
}

export async function createCalendarEvent(data: {
  summary: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  attendeeEmails?: string[];
  addMeetLink?: boolean;
}): Promise<{ eventId: string; meetLink: string | null; htmlLink: string }> {
  const startIso = data.startTime.toISOString();
  const endIso = (
    data.endTime ?? dayjs(data.startTime).add(1, "hour").toDate()
  ).toISOString();

  const body: Record<string, unknown> = {
    summary: data.summary,
    description: data.description,
    start: { dateTime: startIso },
    end: { dateTime: endIso },
  };

  if (data.attendeeEmails?.length) {
    body.attendees = data.attendeeEmails.map((email) => ({ email }));
  }

  if (data.addMeetLink) {
    body.conferenceData = {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const url = `${CAL_BASE}/calendars/primary/events${data.addMeetLink ? "?conferenceDataVersion=1" : ""}`;
  const event = await googleFetch<CalendarEvent>(url, {
    method: "POST",
    body: JSON.stringify(body),
  });

  const meetLink =
    event.hangoutLink ??
    event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")
      ?.uri ??
    null;

  return {
    eventId: event.id,
    meetLink,
    htmlLink: event.htmlLink,
  };
}

export async function getUpcomingCalendarEvents(opts?: {
  maxResults?: number;
}): Promise<CalendarEvent[]> {
  const now = new Date().toISOString();
  const params = new URLSearchParams({
    timeMin: now,
    maxResults: String(opts?.maxResults ?? 10),
    singleEvents: "true",
    orderBy: "startTime",
  });

  const data = await googleFetch<CalendarListResponse>(
    `${CAL_BASE}/calendars/primary/events?${params}`
  );

  return data.items ?? [];
}

export async function updateCalendarEvent(
  eventId: string,
  data: {
    summary?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
    attendeeEmails?: string[];
  }
): Promise<CalendarEvent> {
  const body: Record<string, unknown> = {};
  if (data.summary) {
    body.summary = data.summary;
  }
  if (data.description !== undefined) {
    body.description = data.description;
  }
  if (data.startTime) {
    body.start = { dateTime: data.startTime.toISOString() };
    body.end = {
      dateTime: (
        data.endTime ?? dayjs(data.startTime).add(1, "hour").toDate()
      ).toISOString(),
    };
  }
  if (data.attendeeEmails) {
    body.attendees = data.attendeeEmails.map((email) => ({ email }));
  }

  return googleFetch<CalendarEvent>(
    `${CAL_BASE}/calendars/primary/events/${eventId}`,
    { method: "PATCH", body: JSON.stringify(body) }
  );
}

export async function addCalendarAttendees(
  eventId: string,
  newEmails: string[]
): Promise<CalendarEvent> {
  const existing = await getCalendarEvent(eventId);
  const currentEmails = new Set(existing.attendees?.map((a) => a.email) ?? []);
  const allAttendees = [
    ...(existing.attendees ?? []),
    ...newEmails
      .filter((e) => !currentEmails.has(e))
      .map((email) => ({ email })),
  ];

  return googleFetch<CalendarEvent>(
    `${CAL_BASE}/calendars/primary/events/${eventId}?sendUpdates=all`,
    {
      method: "PATCH",
      body: JSON.stringify({ attendees: allAttendees }),
    }
  );
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  await googleFetch(`${CAL_BASE}/calendars/primary/events/${eventId}`, {
    method: "DELETE",
  });
}

export async function getCalendarEvent(
  eventId: string
): Promise<CalendarEvent> {
  return await googleFetch<CalendarEvent>(
    `${CAL_BASE}/calendars/primary/events/${eventId}`
  );
}
