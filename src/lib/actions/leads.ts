"use server";

import { and, desc, eq, ilike, inArray, or, type SQL, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { activity, lead, task } from "@/db/schema";
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

export type LeadRow = typeof lead.$inferSelect;

export async function getLeads(opts?: {
  status?: string;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}) {
  await getUser();
  const conditions: SQL[] = [];

  if (opts?.status && opts.status !== "all") {
    conditions.push(eq(lead.status, opts.status));
  }
  if (opts?.search) {
    const term = `%${opts.search}%`;
    const searchCondition = or(
      ilike(lead.name, term),
      ilike(lead.email, term),
      ilike(lead.company, term)
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  const rows = await db.query.lead.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(lead.createdAt)],
    with: { assignedUser: true },
  });

  return rows;
}

export async function getLead(id: string) {
  await getUser();
  const row = await db.query.lead.findFirst({
    where: eq(lead.id, id),
    with: {
      activities: {
        orderBy: [desc(activity.createdAt)],
        with: { user: true },
      },
      tasks: {
        orderBy: [desc(task.dueAt)],
        with: { user: true },
      },
      assignedUser: true,
    },
  });
  if (!row) {
    throw new Error("Lead not found");
  }
  return row;
}

export async function createLead(data: {
  name: string;
  email: string;
  company?: string;
  title?: string;
  phone?: string;
  website?: string;
  source?: string;
  value?: number;
}) {
  const user = await getUser();
  const [row] = await db
    .insert(lead)
    .values({
      ...data,
      source: data.source ?? "manual",
      value: data.value ?? 0,
      assignedTo: user.id,
    })
    .returning();

  await db.insert(activity).values({
    leadId: row.id,
    userId: user.id,
    type: "status_change",
    content: "Lead created",
    metadata: { newStatus: "new" },
  });

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/");
  return row;
}

export async function updateLead(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    company: string;
    title: string;
    phone: string;
    website: string;
    source: string;
    value: number;
    plan: string;
    assignedTo: string | null;
  }>
) {
  await getUser();
  const [row] = await db
    .update(lead)
    .set(data)
    .where(eq(lead.id, id))
    .returning();

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/pipeline");
  revalidatePath("/");
  return row;
}

export async function deleteLead(id: string) {
  await getUser();
  await db.delete(lead).where(eq(lead.id, id));
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/");
}

export async function bulkUpdateStatus(ids: string[], status: string) {
  const user = await getUser();
  await db.update(lead).set({ status }).where(inArray(lead.id, ids));

  for (const id of ids) {
    await db.insert(activity).values({
      leadId: id,
      userId: user.id,
      type: "status_change",
      content: `Status changed to ${status}`,
      metadata: { newStatus: status },
    });
  }

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/");
}

export async function bulkDeleteLeads(ids: string[]) {
  await getUser();
  await db.delete(lead).where(inArray(lead.id, ids));
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/");
}

export async function getLeadCounts() {
  await getUser();
  const rows = await db
    .select({
      status: lead.status,
      count: sql<number>`count(*)::int`,
    })
    .from(lead)
    .groupBy(lead.status);

  const counts: Record<string, number> = {};
  for (const r of rows) {
    counts[r.status] = r.count;
  }
  counts.all = Object.values(counts).reduce((a, b) => a + b, 0);
  return counts;
}
