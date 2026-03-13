import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM ?? "noreply@example.com";

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
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html: body.replace(/\n/g, "<br />"),
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
