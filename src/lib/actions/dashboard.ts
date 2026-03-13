"use server";

import { and, asc, count, desc, eq, isNull, sql, sum } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { lead, task } from "@/db/schema";
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

export async function getDashboardStats() {
  await getUser();

  const [totalResult] = await db.select({ count: count() }).from(lead);

  const [convertedResult] = await db
    .select({ count: count() })
    .from(lead)
    .where(eq(lead.status, "converted"));

  const [revenueResult] = await db
    .select({ total: sum(lead.value) })
    .from(lead)
    .where(eq(lead.status, "converted"));

  const qualifiedStatuses = ["interested", "demo", "negotiating", "converted"];
  const [qualifiedResult] = await db
    .select({ count: count() })
    .from(lead)
    .where(
      sql`${lead.status} IN (${sql.join(
        qualifiedStatuses.map((s) => sql`${s}`),
        sql`, `
      )})`
    );

  const total = totalResult?.count ?? 0;
  const converted = convertedResult?.count ?? 0;
  const conversionRate =
    total > 0 ? ((converted / total) * 100).toFixed(1) : "0";
  const revenue = Number(revenueResult?.total ?? 0);

  return {
    totalLeads: total,
    qualified: qualifiedResult?.count ?? 0,
    conversionRate: `${conversionRate}%`,
    revenue,
  };
}

export async function getRecentLeads() {
  await getUser();
  return db.query.lead.findMany({
    orderBy: [desc(lead.createdAt)],
    limit: 5,
    with: { assignedUser: true },
  });
}

export async function getUpcomingTasks(opts?: { allUsers?: boolean }) {
  const currentUser = await getUser();
  const conditions = [isNull(task.completedAt)];
  if (!opts?.allUsers) {
    conditions.push(eq(task.userId, currentUser.id));
  }
  return db.query.task.findMany({
    where: and(...conditions),
    orderBy: [asc(task.dueAt)],
    limit: 15,
    with: { lead: true, user: true },
  });
}

export async function getPipelineCounts() {
  await getUser();
  const rows = await db
    .select({ status: lead.status, count: count() })
    .from(lead)
    .groupBy(lead.status);

  const counts: Record<string, number> = {};
  let total = 0;
  for (const r of rows) {
    counts[r.status] = r.count;
    total += r.count;
  }
  counts.all = total;
  return counts;
}
