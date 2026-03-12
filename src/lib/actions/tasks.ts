"use server";

import { addDays } from "date-fns";
import { and, asc, eq, isNull, lte } from "drizzle-orm";
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

export async function getTasks(opts?: { showCompleted?: boolean }) {
  await getUser();
  const conditions: ReturnType<typeof isNull>[] = [];
  if (!opts?.showCompleted) {
    conditions.push(isNull(task.completedAt));
  }

  return db.query.task.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [asc(task.dueAt)],
    with: { lead: true },
  });
}

export async function getLeadTasks(leadId: string) {
  await getUser();
  return db.query.task.findMany({
    where: eq(task.leadId, leadId),
    orderBy: [asc(task.dueAt)],
  });
}

export async function createTask(data: {
  leadId: string;
  title: string;
  description?: string;
  dueAt: Date;
  type?: string;
}) {
  const user = await getUser();
  const [row] = await db
    .insert(task)
    .values({
      ...data,
      userId: user.id,
      type: data.type ?? "follow_up",
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
  const [row] = await db
    .update(task)
    .set({ completedAt: new Date() })
    .where(eq(task.id, id))
    .returning();

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
    with: { lead: true },
  });
}
