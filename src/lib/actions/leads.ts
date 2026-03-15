"use server";

import {
  and,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { activity, lead, task, user as userTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import dayjs from "@/lib/dayjs";
import { fireWebhooks } from "@/lib/webhook-dispatch";

async function getUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export type LeadRow = typeof lead.$inferSelect & {
  assignedUser: { id: string; name: string; email: string } | null;
};

export async function getLeads(opts?: {
  status?: string;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}) {
  await getUser();
  const conditions: SQL[] = [isNull(lead.archivedAt)];

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
    where: and(...conditions),
    orderBy: [desc(lead.createdAt)],
    limit: opts?.limit ?? 500,
    offset: opts?.offset,
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
        limit: 100,
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
  country?: string;
  timezone?: string;
  customFields?: Record<string, string>;
}) {
  const user = await getUser();

  const row = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(lead)
      .values({
        ...data,
        source: data.source ?? "manual",
        value: data.value ?? 0,
        customFields: data.customFields ?? {},
        assignedTo: user.id,
      })
      .returning();

    await tx.insert(activity).values({
      leadId: inserted.id,
      userId: user.id,
      type: "lead_created",
      content: `Added ${data.name}`,
      metadata: { source: data.source ?? "manual" },
    });

    return inserted;
  });

  fireWebhooks("lead.created", {
    id: row.id,
    name: row.name,
    email: row.email,
    source: row.source,
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
    country: string;
    timezone: string;
    customFields: Record<string, string>;
  }>
) {
  const user = await getUser();

  const existing =
    data.assignedTo !== undefined
      ? await db.query.lead.findFirst({
          where: eq(lead.id, id),
          with: { assignedUser: true },
        })
      : null;

  const [row] = await db
    .update(lead)
    .set(data)
    .where(eq(lead.id, id))
    .returning();

  if (data.assignedTo !== undefined && existing) {
    const prevName = existing.assignedUser?.name ?? null;
    if (data.assignedTo) {
      const newAssignee = await db.query.user.findFirst({
        where: eq(userTable.id, data.assignedTo),
        columns: { name: true },
      });
      await db.insert(activity).values({
        leadId: id,
        userId: user.id,
        type: "assignment_changed",
        content: `Assigned to ${newAssignee?.name ?? "a team member"}`,
        metadata: {
          previousAssignee: prevName,
          newAssignee: newAssignee?.name ?? data.assignedTo,
        },
      });
    } else {
      await db.insert(activity).values({
        leadId: id,
        userId: user.id,
        type: "assignment_changed",
        content: "Unassigned",
        metadata: { previousAssignee: prevName, newAssignee: null },
      });
    }
  }

  fireWebhooks("lead.updated", {
    id: row.id,
    name: row.name,
    changes: Object.keys(data),
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/pipeline");
  revalidatePath("/");
  return row;
}

export async function deleteLead(id: string) {
  await getUser();
  await db
    .update(lead)
    .set({ archivedAt: dayjs().toDate() })
    .where(eq(lead.id, id));

  fireWebhooks("lead.deleted", { id });

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/");
}

export async function bulkUpdateStatus(ids: string[], status: string) {
  const user = await getUser();

  await db.transaction(async (tx) => {
    await tx.update(lead).set({ status }).where(inArray(lead.id, ids));

    await tx.insert(activity).values(
      ids.map((id) => ({
        leadId: id,
        userId: user.id,
        type: "status_change",
        content: `Status changed to ${status}`,
        metadata: { newStatus: status },
      }))
    );
  });

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/");
}

export async function bulkDeleteLeads(ids: string[]) {
  await getUser();
  await db
    .update(lead)
    .set({ archivedAt: dayjs().toDate() })
    .where(inArray(lead.id, ids));
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/");
}

export async function restoreLead(id: string) {
  await getUser();
  await db.update(lead).set({ archivedAt: null }).where(eq(lead.id, id));
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/");
}

export async function getArchivedLeads(opts?: {
  limit?: number;
  offset?: number;
}) {
  await getUser();
  const rows = await db.query.lead.findMany({
    where: isNotNull(lead.archivedAt),
    orderBy: [desc(lead.archivedAt)],
    limit: opts?.limit ?? 500,
    offset: opts?.offset,
    with: { assignedUser: true },
  });
  return rows;
}

export async function permanentlyDeleteLead(id: string) {
  await getUser();
  await db.delete(lead).where(eq(lead.id, id));
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/");
}

export async function importLeads(
  rows: Array<{
    name: string;
    email: string;
    company?: string;
    title?: string;
    phone?: string;
    website?: string;
    source?: string;
    value?: number;
  }>
) {
  const user = await getUser();
  const values = rows.map((r) => ({
    ...r,
    source: r.source ?? "manual",
    value: r.value ?? 0,
    assignedTo: user.id,
  }));

  const inserted = await db.transaction(async (tx) => {
    const rows = await tx.insert(lead).values(values).returning();

    await tx.insert(activity).values(
      rows.map((row) => ({
        leadId: row.id,
        userId: user.id,
        type: "status_change",
        content: "Lead imported via CSV",
        metadata: { newStatus: "new" },
      }))
    );

    return rows;
  });

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/");
  return inserted.length;
}

export async function checkDuplicateEmail(email: string) {
  await getUser();
  const existing = await db.query.lead.findFirst({
    where: eq(lead.email, email),
    columns: { id: true, name: true, email: true, status: true },
  });
  return existing ?? null;
}

export async function getLeadCounts() {
  await getUser();
  const rows = await db
    .select({
      status: lead.status,
      count: sql<number>`count(*)::int`,
    })
    .from(lead)
    .where(isNull(lead.archivedAt))
    .groupBy(lead.status);

  const counts: Record<string, number> = {};
  for (const r of rows) {
    counts[r.status] = r.count;
  }
  counts.all = Object.values(counts).reduce((a, b) => a + b, 0);
  return counts;
}
