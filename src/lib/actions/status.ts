"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { activity, lead, task } from "@/db/schema";
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

export async function changeLeadStatus(
  leadId: string,
  newStatus: string,
  opts?: { plan?: string; note?: string }
) {
  const user = await getUser();

  const existing = await db.query.lead.findFirst({
    where: eq(lead.id, leadId),
  });
  if (!existing) {
    throw new Error("Lead not found");
  }

  if (existing.status === newStatus) {
    return;
  }

  const updates: Record<string, unknown> = { status: newStatus };

  if (newStatus === "converted") {
    updates.convertedAt = dayjs().toDate();
    if (opts?.plan) {
      updates.plan = opts.plan;
    }
  }
  if (newStatus === "lost") {
    updates.lostAt = dayjs().toDate();
  }
  if (newStatus === "churned") {
    updates.churnedAt = dayjs().toDate();
  }

  await db.update(lead).set(updates).where(eq(lead.id, leadId));

  await db.insert(activity).values({
    leadId,
    userId: user.id,
    type: "status_change",
    content:
      opts?.note ?? `Status changed from ${existing.status} to ${newStatus}`,
    metadata: { oldStatus: existing.status, newStatus },
  });

  if (newStatus === "contacted") {
    await db.insert(task).values({
      leadId,
      userId: user.id,
      title: `Follow up with ${existing.name}`,
      type: "follow_up",
      dueAt: dayjs().add(3, "day").toDate(),
    });
  }

  if (newStatus === "demo") {
    await db.insert(task).values({
      leadId,
      userId: user.id,
      title: `Prepare demo for ${existing.name}`,
      type: "demo",
      dueAt: dayjs().add(1, "day").toDate(),
    });
  }

  if (newStatus === "converted") {
    await db.insert(task).values({
      leadId,
      userId: user.id,
      title: `Onboarding check-in with ${existing.name}`,
      type: "follow_up",
      dueAt: dayjs().add(7, "day").toDate(),
    });
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/pipeline");
  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function addNote(leadId: string, content: string) {
  const user = await getUser();

  await db.insert(activity).values({
    leadId,
    userId: user.id,
    type: "note",
    content,
  });

  revalidatePath(`/leads/${leadId}`);
}

export async function logOutreach(
  leadId: string,
  type: "outreach_call" | "outreach_linkedin",
  content: string
) {
  const user = await getUser();

  await db.insert(activity).values({
    leadId,
    userId: user.id,
    type,
    content,
  });

  const existing = await db.query.lead.findFirst({
    where: eq(lead.id, leadId),
  });
  if (existing?.status === "new") {
    await changeLeadStatus(leadId, "contacted");
  }

  revalidatePath(`/leads/${leadId}`);
}
