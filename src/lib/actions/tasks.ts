"use server";

import { and, asc, eq, isNull, lte, type SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { lead, task } from "@/db/schema";
import { createCalendarEvent } from "@/lib/actions/calendar";
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

  if (
    data.syncToCalendar &&
    (data.type === "meeting" || data.type === "demo")
  ) {
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
      // Calendar sync failed silently — task still gets created
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

export async function updateTask(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    dueAt: Date;
    type: string;
    userId: string | null;
    recurrence: string | null;
    meetingLink: string | null;
  }>
) {
  await getUser();
  const [row] = await db
    .update(task)
    .set(data)
    .where(eq(task.id, id))
    .returning();

  revalidateAll(row?.leadId);
  return row;
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

  if (existing.recurrence) {
    const base = existing.dueAt < new Date() ? new Date() : existing.dueAt;
    await db.insert(task).values({
      leadId: existing.leadId,
      userId: existing.userId,
      title: existing.title,
      description: existing.description,
      type: existing.type,
      recurrence: existing.recurrence,
      meetingLink: existing.meetingLink,
      dueAt: nextDueDate(base, existing.recurrence),
    });
  }

  revalidateAll(row?.leadId);
  return row;
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
  const [row] = await db
    .update(task)
    .set({ dueAt: dayjs(baseDate).add(days, "day").toDate() })
    .where(eq(task.id, id))
    .returning();

  revalidateAll(row?.leadId);
  return row;
}

export async function deleteTask(id: string) {
  await getUser();
  const [row] = await db.delete(task).where(eq(task.id, id)).returning();
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
