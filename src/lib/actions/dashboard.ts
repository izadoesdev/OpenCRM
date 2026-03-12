"use server";

import { asc, count, desc, eq, isNull, sql, sum } from "drizzle-orm";
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
  });
}

export async function getUpcomingTasks() {
  await getUser();
  return db.query.task.findMany({
    where: isNull(task.completedAt),
    orderBy: [asc(task.dueAt)],
    limit: 5,
    with: { lead: true },
  });
}
