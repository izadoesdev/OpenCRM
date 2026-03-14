"use server";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  isNull,
  lte,
  sql,
  sum,
} from "drizzle-orm";
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

function getDateFilter(opts?: { from?: string; to?: string }) {
  const dateConditions: ReturnType<typeof gte>[] = [];
  if (opts?.from) {
    dateConditions.push(gte(lead.createdAt, new Date(opts.from)));
  }
  if (opts?.to) {
    dateConditions.push(lte(lead.createdAt, new Date(opts.to)));
  }
  return dateConditions.length > 0 ? and(...dateConditions) : undefined;
}

export async function getDashboardStats(opts?: { from?: string; to?: string }) {
  await getUser();

  const dateFilter = getDateFilter(opts);

  const [totalResult] = await db
    .select({ count: count() })
    .from(lead)
    .where(dateFilter ?? sql`1 = 1`);

  const [convertedResult] = await db
    .select({ count: count() })
    .from(lead)
    .where(
      dateFilter
        ? and(eq(lead.status, "converted"), dateFilter)
        : eq(lead.status, "converted")
    );

  const [revenueResult] = await db
    .select({ total: sum(lead.value) })
    .from(lead)
    .where(
      dateFilter
        ? and(eq(lead.status, "converted"), dateFilter)
        : eq(lead.status, "converted")
    );

  const qualifiedStatuses = ["interested", "demo", "negotiating", "converted"];
  const qualifiedWhere = sql`${lead.status} IN (${sql.join(
    qualifiedStatuses.map((s) => sql`${s}`),
    sql`, `
  )})`;
  const [qualifiedResult] = await db
    .select({ count: count() })
    .from(lead)
    .where(dateFilter ? and(qualifiedWhere, dateFilter) : qualifiedWhere);

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

export async function getRecentLeads(opts?: { from?: string; to?: string }) {
  await getUser();
  const dateFilter = getDateFilter(opts);
  return db.query.lead.findMany({
    ...(dateFilter && { where: dateFilter }),
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

export async function getPipelineCounts(opts?: { from?: string; to?: string }) {
  await getUser();
  const dateFilter = getDateFilter(opts);
  const rows = await db
    .select({ status: lead.status, count: count() })
    .from(lead)
    .where(dateFilter ?? sql`1 = 1`)
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

export async function getPipelineVelocity() {
  await getUser();

  const statusChanges = await db
    .select({
      leadId: activity.leadId,
      metadata: activity.metadata,
      createdAt: activity.createdAt,
    })
    .from(activity)
    .where(eq(activity.type, "status_change"))
    .orderBy(asc(activity.createdAt));

  const stageDurations: Record<string, number[]> = {};
  const leadTimelines: Record<string, Array<{ status: string; at: Date }>> = {};

  for (const sc of statusChanges) {
    const meta = sc.metadata as { newStatus?: string } | null;
    if (!meta?.newStatus) {
      continue;
    }
    if (!leadTimelines[sc.leadId]) {
      leadTimelines[sc.leadId] = [];
    }
    leadTimelines[sc.leadId].push({
      status: meta.newStatus,
      at: new Date(sc.createdAt),
    });
  }

  for (const timeline of Object.values(leadTimelines)) {
    for (let i = 0; i < timeline.length - 1; i++) {
      const days =
        (timeline[i + 1].at.getTime() - timeline[i].at.getTime()) /
        (1000 * 60 * 60 * 24);
      const status = timeline[i].status;
      if (!stageDurations[status]) {
        stageDurations[status] = [];
      }
      stageDurations[status].push(days);
    }
  }

  const velocity: Record<string, { avg: number; count: number }> = {};
  for (const [status, durations] of Object.entries(stageDurations)) {
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    velocity[status] = {
      avg: Math.round(avg * 10) / 10,
      count: durations.length,
    };
  }

  return velocity;
}

export async function getStatusChangeHistory(opts?: {
  from?: string;
  to?: string;
  fromStatus?: string;
  toStatus?: string;
}) {
  await getUser();

  const conditions: Parameters<typeof and>[0][] = [
    eq(activity.type, "status_change"),
  ];

  if (opts?.from) {
    conditions.push(gte(activity.createdAt, new Date(opts.from)));
  }
  if (opts?.to) {
    conditions.push(lte(activity.createdAt, new Date(opts.to)));
  }

  const rows = await db.query.activity.findMany({
    where: and(...conditions),
    orderBy: [desc(activity.createdAt)],
    limit: 200,
    with: { lead: true, user: true },
  });

  // Filter by status transition if specified
  let filtered = rows;
  if (opts?.fromStatus || opts?.toStatus) {
    filtered = rows.filter((r) => {
      const meta = r.metadata as {
        oldStatus?: string;
        newStatus?: string;
      } | null;
      if (opts?.fromStatus && meta?.oldStatus !== opts.fromStatus) {
        return false;
      }
      if (opts?.toStatus && meta?.newStatus !== opts.toStatus) {
        return false;
      }
      return true;
    });
  }

  return filtered;
}

export async function getReportingData() {
  await getUser();

  const bySource = await db
    .select({ source: lead.source, count: count() })
    .from(lead)
    .groupBy(lead.source);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyLeads = await db
    .select({
      month: sql<string>`to_char(${lead.createdAt}, 'YYYY-MM')`,
      count: count(),
    })
    .from(lead)
    .where(gte(lead.createdAt, sixMonthsAgo))
    .groupBy(sql`to_char(${lead.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${lead.createdAt}, 'YYYY-MM')`);

  const convBySource = await db
    .select({
      source: lead.source,
      total: count(),
      converted: sql<number>`count(*) filter (where ${lead.status} = 'converted')`,
    })
    .from(lead)
    .groupBy(lead.source);

  const funnelCounts = await db
    .select({ status: lead.status, count: count() })
    .from(lead)
    .groupBy(lead.status);

  return {
    bySource: bySource.map((r) => ({ source: r.source, count: r.count })),
    monthlyLeads: monthlyLeads.map((r) => ({ month: r.month, count: r.count })),
    convBySource: convBySource.map((r) => ({
      source: r.source,
      total: r.total,
      converted: Number(r.converted),
      rate: r.total > 0 ? Math.round((Number(r.converted) / r.total) * 100) : 0,
    })),
    funnelCounts: funnelCounts.map((r) => ({
      status: r.status,
      count: r.count,
    })),
  };
}
