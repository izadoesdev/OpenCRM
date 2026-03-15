import { and, asc, isNull, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { task } from "@/db/schema";
import dayjs from "@/lib/dayjs";
import { sendEmail } from "@/lib/email";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = dayjs().toDate();

  const overdueTasks = await db.query.task.findMany({
    where: and(isNull(task.completedAt), lte(task.dueAt, now)),
    orderBy: [asc(task.dueAt)],
    with: { lead: true, user: true },
  });

  if (overdueTasks.length === 0) {
    return NextResponse.json({ sent: 0, message: "No overdue tasks" });
  }

  const byUser: Record<
    string,
    { email: string; name: string; tasks: typeof overdueTasks }
  > = {};

  for (const t of overdueTasks) {
    const u = t.user;
    if (!u) {
      continue;
    }
    if (!byUser[u.id]) {
      byUser[u.id] = { email: u.email, name: u.name, tasks: [] };
    }
    byUser[u.id].tasks.push(t);
  }

  const results = await Promise.allSettled(
    Object.entries(byUser).map(
      async ([, { email, name, tasks: userTasks }]) => {
        const taskLines = userTasks
          .map((t) => {
            const leadName = t.lead?.name ?? "Unknown";
            const due = dayjs(t.dueAt).fromNow();
            return `<li><strong>${t.title}</strong> — ${leadName} (due ${due})</li>`;
          })
          .join("\n");

        const html = `
        <p>Hi ${name},</p>
        <p>You have <strong>${userTasks.length}</strong> overdue task${userTasks.length === 1 ? "" : "s"}:</p>
        <ul>${taskLines}</ul>
        <p>Log in to OpenCRM to take action.</p>
      `.trim();

        await sendEmail({
          to: email,
          subject: `[OpenCRM] ${userTasks.length} overdue task${userTasks.length === 1 ? "" : "s"}`,
          body: html,
        });
      }
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  for (const r of results) {
    if (r.status === "rejected") {
      console.error("Failed to send digest:", r.reason);
    }
  }

  return NextResponse.json({
    sent,
    totalOverdue: overdueTasks.length,
    users: Object.keys(byUser).length,
  });
}
