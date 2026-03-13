"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { activity, emailTemplate, lead, task } from "@/db/schema";
import { auth } from "@/lib/auth";
import dayjs from "@/lib/dayjs";
import { mergeTags, sendEmail } from "@/lib/email";
import { sendGmailEmail } from "./gmail";

async function getUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function getEmailTemplates() {
  await getUser();
  return db.query.emailTemplate.findMany({
    orderBy: [desc(emailTemplate.createdAt)],
  });
}

export async function createEmailTemplate(data: {
  name: string;
  subject: string;
  body: string;
}) {
  const user = await getUser();
  const [row] = await db
    .insert(emailTemplate)
    .values({ ...data, createdBy: user.id })
    .returning();
  return row;
}

export async function updateEmailTemplate(
  id: string,
  data: { name?: string; subject?: string; body?: string }
) {
  await getUser();
  const [row] = await db
    .update(emailTemplate)
    .set(data)
    .where(eq(emailTemplate.id, id))
    .returning();
  return row;
}

export async function deleteEmailTemplate(id: string) {
  await getUser();
  await db.delete(emailTemplate).where(eq(emailTemplate.id, id));
}

export async function sendLeadEmail(
  leadId: string,
  data: {
    subject: string;
    body: string;
    templateId?: string;
    sendVia?: "resend" | "gmail";
  }
) {
  const user = await getUser();

  const row = await db.query.lead.findFirst({
    where: eq(lead.id, leadId),
  });
  if (!row) {
    throw new Error("Lead not found");
  }

  const mergeData = {
    name: row.name,
    company: row.company ?? "",
    title: row.title ?? "",
  };
  const subject = mergeTags(data.subject, mergeData);
  const body = mergeTags(data.body, mergeData);

  let gmailMeta: { gmailMessageId?: string; gmailThreadId?: string } = {};

  if (data.sendVia === "gmail") {
    const result = await sendGmailEmail({
      leadId,
      to: row.email,
      subject,
      body,
    });
    gmailMeta = {
      gmailMessageId: result.messageId,
      gmailThreadId: result.threadId,
    };
  } else {
    await sendEmail({ to: row.email, subject, body });
  }

  await db.insert(activity).values({
    leadId,
    userId: user.id,
    type: "email_sent",
    content: `Sent email: ${subject}`,
    metadata: {
      subject,
      templateId: data.templateId,
      sendVia: data.sendVia ?? "resend",
      ...gmailMeta,
    },
  });

  if (row.status === "new") {
    await db
      .update(lead)
      .set({ status: "contacted" })
      .where(eq(lead.id, leadId));

    await db.insert(activity).values({
      leadId,
      userId: user.id,
      type: "status_change",
      content: "Auto-moved to Contacted after first email",
      metadata: { oldStatus: "new", newStatus: "contacted" },
    });

    await db.insert(task).values({
      leadId,
      userId: user.id,
      title: `Follow up with ${row.name}`,
      type: "follow_up",
      dueAt: dayjs().add(3, "day").toDate(),
    });
  } else if (row.status === "contacted") {
    const existingTasks = await db.query.task.findMany({
      where: eq(task.leadId, leadId),
    });
    const openFollowUp = existingTasks.find(
      (t) => t.type === "follow_up" && !t.completedAt
    );
    if (openFollowUp) {
      await db
        .update(task)
        .set({ dueAt: dayjs().add(3, "day").toDate() })
        .where(eq(task.id, openFollowUp.id));
    }
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/tasks");
  revalidatePath("/");
}
