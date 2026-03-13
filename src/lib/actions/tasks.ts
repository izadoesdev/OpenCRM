"use server";

import { and, asc, eq, isNull, lte, type SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { lead, task } from "@/db/schema";
import {
  addCalendarAttendees,
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "@/lib/actions/calendar";
import { auth } from "@/lib/auth";
import dayjs from "@/lib/dayjs";

async function getUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

function revalidateAll(leadId?: string | null) {
  revalidatePath("/tasks");
  revalidatePath("/");
  if (leadId) {
    revalidatePath(`/leads/${leadId}`);
  }
}

function nextDueDate(current: Date, recurrence: string): Date {
  const d = dayjs(current);
  switch (recurrence) {
    case "daily":
      return d.add(1, "day").toDate();
    case "weekly":
      return d.add(1, "week").toDate();
    case "biweekly":
      return d.add(2, "week").toDate();
    case "monthly":
      return d.add(1, "month").toDate();
    default:
      return d.add(1, "day").toDate();
  }
}

function isMeetingType(t: string) {
  return t === "meeting" || t === "demo";
}

// ---------------------------------------------------------------------------
// Calendar sync helpers
// ---------------------------------------------------------------------------

type TaskUpdateFields = Partial<{
  title: string;
  description: string;
  dueAt: Date;
  type: string;
  userId: string | null;
  recurrence: string | null;
  meetingLink: string | null;
}>;

async function handleCalendarOnTypeChange(
  existing: { calendarEventId: string | null; type: string },
  newType: string | undefined,
  taskId: string
): Promise<{ ops: string[]; clearMeeting: boolean }> {
  const ops: string[] = [];
  const wasMeeting = isMeetingType(existing.type);
  const willBeMeeting =
    newType !== undefined ? isMeetingType(newType) : wasMeeting;

  if (wasMeeting && !willBeMeeting && existing.calendarEventId) {
    try {
      await deleteCalendarEvent(existing.calendarEventId);
      ops.push("calendar_cancelled");
    } catch {
      ops.push("calendar_cancel_failed");
    }
    await db
      .update(task)
      .set({ calendarEventId: null })
      .where(eq(task.id, taskId));
    return { ops, clearMeeting: true };
  }

  return { ops, clearMeeting: false };
}

async function handleCalendarFieldSync(
  existing: { calendarEventId: string | null; type: string },
  updates: TaskUpdateFields
): Promise<string[]> {
  if (!existing.calendarEventId) {
    return [];
  }
  if (!isMeetingType(existing.type)) {
    return [];
  }

  const ops: string[] = [];
  const calPatch: {
    summary?: string;
    description?: string;
    startTime?: Date;
  } = {};

  if (updates.title) {
    calPatch.summary = updates.title;
  }
  if (updates.description !== undefined) {
    calPatch.description = updates.description;
  }
  if (updates.dueAt) {
    calPatch.startTime = updates.dueAt;
  }

  if (Object.keys(calPatch).length > 0) {
    try {
      await updateCalendarEvent(existing.calendarEventId, calPatch);
      ops.push("calendar_updated");
    } catch {
      ops.push("calendar_update_failed");
    }
  }

  return ops;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function getTasks(opts?: {
  showCompleted?: boolean;
  userId?: string | null;
}) {
  await getUser();
  const conditions: SQL[] = [];

  if (!opts?.showCompleted) {
    conditions.push(isNull(task.completedAt));
  }
  if (opts?.userId) {
    conditions.push(eq(task.userId, opts.userId));
  }

  return db.query.task.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [asc(task.dueAt)],
    with: { lead: true, user: true },
  });
}

export async function getLeadTasks(leadId: string) {
  await getUser();
  return db.query.task.findMany({
    where: eq(task.leadId, leadId),
    orderBy: [asc(task.dueAt)],
    with: { user: true },
  });
}

export async function createTask(data: {
  leadId: string;
  title: string;
  description?: string;
  dueAt: Date;
  type?: string;
  userId?: string;
  recurrence?: string | null;
  meetingLink?: string | null;
  syncToCalendar?: boolean;
}) {
  const currentUser = await getUser();

  let calendarEventId: string | null = null;
  let meetingLink = data.meetingLink ?? null;

  if (data.syncToCalendar && isMeetingType(data.type ?? "follow_up")) {
    try {
      const leadRow = await db.query.lead.findFirst({
        where: eq(lead.id, data.leadId),
      });

      const calResult = await createCalendarEvent({
        summary: data.title,
        description: data.description,
        startTime: data.dueAt,
        attendeeEmails: leadRow?.email ? [leadRow.email] : undefined,
        addMeetLink: true,
      });

      calendarEventId = calResult.eventId;
      if (calResult.meetLink) {
        meetingLink = calResult.meetLink;
      }
    } catch {
      // Calendar sync failed — task still gets created
    }
  }

  const [row] = await db
    .insert(task)
    .values({
      leadId: data.leadId,
      title: data.title,
      description: data.description,
      dueAt: data.dueAt,
      userId: data.userId ?? currentUser.id,
      type: data.type ?? "follow_up",
      recurrence: data.recurrence ?? null,
      meetingLink,
      calendarEventId,
    })
    .returning();

  revalidateAll(data.leadId);
  return row;
}

export async function updateTask(id: string, data: TaskUpdateFields) {
  await getUser();

  const existing = await db.query.task.findFirst({ where: eq(task.id, id) });
  if (!existing) {
    throw new Error("Task not found");
  }

  const calendarOps: string[] = [];

  const { ops: typeOps, clearMeeting } = await handleCalendarOnTypeChange(
    existing,
    data.type,
    id
  );
  calendarOps.push(...typeOps);

  if (!clearMeeting) {
    const syncOps = await handleCalendarFieldSync(existing, data);
    calendarOps.push(...syncOps);
  }

  const setData = clearMeeting ? { ...data, meetingLink: null } : data;

  const [row] = await db
    .update(task)
    .set(setData)
    .where(eq(task.id, id))
    .returning();

  revalidateAll(row?.leadId);
  return { ...row, calendarOps };
}

export async function completeTask(id: string) {
  await getUser();
  const existing = await db.query.task.findFirst({
    where: eq(task.id, id),
  });
  if (!existing) {
    throw new Error("Task not found");
  }

  const [row] = await db
    .update(task)
    .set({ completedAt: new Date() })
    .where(eq(task.id, id))
    .returning();

  if (isMeetingType(existing.type) && existing.calendarEventId) {
    try {
      await deleteCalendarEvent(existing.calendarEventId);
    } catch {
      /* best-effort */
    }
  }

  if (existing.recurrence) {
    const base = existing.dueAt < new Date() ? new Date() : existing.dueAt;
    const nextDue = nextDueDate(base, existing.recurrence);
    await createRecurringFollowUp(existing, nextDue);
  }

  revalidateAll(row?.leadId);
  return row;
}

async function createRecurringFollowUp(
  existing: typeof task.$inferSelect,
  nextDue: Date
) {
  let newCalendarEventId: string | null = null;
  let newMeetingLink = existing.meetingLink;

  if (isMeetingType(existing.type)) {
    try {
      const leadRow = await db.query.lead.findFirst({
        where: eq(lead.id, existing.leadId),
      });
      const calResult = await createCalendarEvent({
        summary: existing.title,
        description: existing.description ?? undefined,
        startTime: nextDue,
        attendeeEmails: leadRow?.email ? [leadRow.email] : undefined,
        addMeetLink: true,
      });
      newCalendarEventId = calResult.eventId;
      if (calResult.meetLink) {
        newMeetingLink = calResult.meetLink;
      }
    } catch {
      /* recurring task still created without calendar */
    }
  }

  await db.insert(task).values({
    leadId: existing.leadId,
    userId: existing.userId,
    title: existing.title,
    description: existing.description,
    type: existing.type,
    recurrence: existing.recurrence,
    meetingLink: newMeetingLink,
    calendarEventId: newCalendarEventId,
    dueAt: nextDue,
  });
}

export async function uncompleteTask(id: string) {
  await getUser();
  const [row] = await db
    .update(task)
    .set({ completedAt: null })
    .where(eq(task.id, id))
    .returning();

  revalidateAll(row?.leadId);
  return row;
}

export async function rescheduleTask(id: string, days: number) {
  await getUser();
  const existing = await db.query.task.findFirst({
    where: eq(task.id, id),
  });
  if (!existing) {
    throw new Error("Task not found");
  }

  const baseDate = existing.dueAt < new Date() ? new Date() : existing.dueAt;
  const newDue = dayjs(baseDate).add(days, "day").toDate();

  const [row] = await db
    .update(task)
    .set({ dueAt: newDue })
    .where(eq(task.id, id))
    .returning();

  if (existing.calendarEventId) {
    try {
      await updateCalendarEvent(existing.calendarEventId, {
        startTime: newDue,
      });
    } catch {
      /* calendar sync best-effort */
    }
  }

  revalidateAll(row?.leadId);
  return row;
}

export async function rescheduleTaskTo(id: string, newDate: Date) {
  await getUser();
  const existing = await db.query.task.findFirst({
    where: eq(task.id, id),
  });
  if (!existing) {
    throw new Error("Task not found");
  }

  const [row] = await db
    .update(task)
    .set({ dueAt: newDate })
    .where(eq(task.id, id))
    .returning();

  if (existing.calendarEventId) {
    try {
      await updateCalendarEvent(existing.calendarEventId, {
        startTime: newDate,
      });
    } catch {
      /* calendar sync best-effort */
    }
  }

  revalidateAll(row?.leadId);
  return row;
}

export async function addTaskAttendees(id: string, emails: string[]) {
  await getUser();
  const existing = await db.query.task.findFirst({
    where: eq(task.id, id),
  });
  if (!existing?.calendarEventId) {
    throw new Error("Task has no calendar event");
  }

  await addCalendarAttendees(existing.calendarEventId, emails);
  revalidateAll(existing.leadId);
}

export async function deleteTask(id: string) {
  await getUser();
  const existing = await db.query.task.findFirst({
    where: eq(task.id, id),
  });

  const [row] = await db.delete(task).where(eq(task.id, id)).returning();

  if (existing?.calendarEventId) {
    try {
      await deleteCalendarEvent(existing.calendarEventId);
    } catch {
      /* calendar sync best-effort */
    }
  }

  revalidateAll(row?.leadId);
}

export async function getOverdueTasks() {
  await getUser();
  return db.query.task.findMany({
    where: and(isNull(task.completedAt), lte(task.dueAt, new Date())),
    orderBy: [asc(task.dueAt)],
    with: { lead: true, user: true },
  });
}
