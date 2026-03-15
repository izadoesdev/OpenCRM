import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db";
import { appSettings } from "@/db/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

const ENV_FROM = process.env.EMAIL_FROM ?? "noreply@example.com";

async function getFromEmail(): Promise<string> {
  try {
    const row = await db.query.appSettings.findFirst({
      where: eq(appSettings.id, "default"),
      columns: { emailFrom: true },
    });
    return row?.emailFrom || ENV_FROM;
  } catch {
    return ENV_FROM;
  }
}

interface MergeData {
  company?: string;
  name?: string;
  title?: string;
}

export function mergeTags(template: string, data: MergeData): string {
  return template
    .replace(/\{\{name\}\}/g, data.name ?? "")
    .replace(/\{\{company\}\}/g, data.company ?? "")
    .replace(/\{\{title\}\}/g, data.title ?? "");
}

export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  const from = await getFromEmail();

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html: body.replace(/\n/g, "<br />"),
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
