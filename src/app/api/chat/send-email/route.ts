import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { lead } from "@/db/schema";
import { sendGmailEmail } from "@/lib/actions/gmail";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json();
  const { leadId, subject, body, cc, bcc, threadId, replyToMessageId } =
    payload as {
      leadId: string;
      subject: string;
      body: string;
      cc?: string;
      bcc?: string;
      threadId?: string;
      replyToMessageId?: string;
    };

  if (!(leadId && subject && body)) {
    return Response.json(
      { error: "leadId, subject, and body are required" },
      { status: 400 }
    );
  }

  const row = await db.query.lead.findFirst({
    where: eq(lead.id, leadId),
    columns: { id: true, email: true },
  });

  if (!row) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }

  try {
    const result = await sendGmailEmail({
      leadId,
      to: row.email,
      subject,
      body,
      cc,
      bcc,
      threadId,
      replyToMessageId,
    });

    return Response.json({
      success: true,
      messageId: result.messageId,
      threadId: result.threadId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return Response.json({ error: message }, { status: 500 });
  }
}
