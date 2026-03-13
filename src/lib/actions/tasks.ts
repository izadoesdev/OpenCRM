"use server";

import { addDays, addMonths, addWeeks } from "date-fns";
import { and, asc, eq, isNull, lte, type SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { task } from "@/db/schema";
import { auth } from "@/lib/auth";

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
  switch (recurrence) {
    case "daily":
      return addDays(current, 1);
    case "weekly":
      return addWeeks(current, 1);
    case "biweekly":
      return addWeeks(current, 2);
    case "monthly":
      return addMonths(current, 1);
    default:
      return addDays(current, 1);
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
}) {
  const currentUser = await getUser();
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
    .set({ dueAt: addDays(baseDate, days) })
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
