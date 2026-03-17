import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/db";
import { lead } from "@/db/schema";
import {
  getEmailThread,
  getGmailMessage,
  getRecentSentEmails,
  searchGmail,
  sendGmailEmail,
} from "@/lib/actions/gmail";
import { checkGoogleConnection } from "@/lib/google";

function ensureGmail() {
  return async () => {
    const conn = await checkGoogleConnection();
    if (!(conn.connected && conn.hasGmail)) {
      return {
        error: "Gmail not connected. Connect in Settings > Google.",
      } as const;
    }
    return null;
  };
}

function createGmailTools() {
  const checkGmail = ensureGmail();

  const searchEmails = tool({
    description: `Search Gmail with any combination of filters. Supports Gmail search syntax. Use this for ANY email search — by person, subject, date, label, attachment, keyword, read/unread, etc. Not limited to leads.

Examples of valid queries:
- "from:jane@acme.com" — emails from Jane
- "to:support@company.com" — emails sent to support
- "subject:invoice" — emails with "invoice" in the subject
- "has:attachment filename:pdf" — emails with PDF attachments
- "after:2025/01/01 before:2025/06/01" — emails in a date range
- "is:unread" — unread emails
- "in:sent" — sent emails
- "label:important" — important emails
- "from:jane@acme.com subject:proposal after:2025/03/01" — combine any filters
- "newer_than:7d" — emails from the last 7 days
- "larger:5M" — emails larger than 5MB`,
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "Gmail search query. Supports all Gmail operators: from, to, subject, has, is, in, after, before, newer_than, older_than, larger, smaller, filename, label, category, etc."
        ),
      maxResults: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe("Max messages to return (default 20)"),
    }),
    execute: async ({ query, maxResults }) => {
      const err = await checkGmail();
      if (err) {
        return err;
      }

      const messages = await searchGmail(query, maxResults ?? 20);

      return {
        count: messages.length,
        query,
        messages: messages.map((m) => ({
          id: m.id,
          threadId: m.threadId,
          from: m.from,
          to: m.to,
          cc: m.cc || undefined,
          subject: m.subject,
          snippet: m.snippet,
          date: new Date(Number(m.internalDate)).toISOString(),
        })),
      };
    },
  });

  const readMessage = tool({
    description:
      "Read the full content of a single email message by its ID. Use after searchEmails to get the complete body of a specific message.",
    inputSchema: z.object({
      messageId: z.string().describe("Gmail message ID"),
    }),
    execute: async ({ messageId }) => {
      const err = await checkGmail();
      if (err) {
        return err;
      }

      const m = await getGmailMessage(messageId);

      return {
        id: m.id,
        threadId: m.threadId,
        from: m.from,
        to: m.to,
        cc: m.cc || undefined,
        bcc: m.bcc || undefined,
        subject: m.subject,
        bodyText: m.bodyText,
        date: new Date(Number(m.internalDate)).toISOString(),
      };
    },
  });

  const readThread = tool({
    description:
      "Read all messages in an email thread by thread ID. Returns the full conversation in order.",
    inputSchema: z.object({
      threadId: z.string().describe("Gmail thread ID"),
    }),
    execute: async ({ threadId }) => {
      const err = await checkGmail();
      if (err) {
        return err;
      }

      const messages = await getEmailThread(threadId);

      return {
        threadId,
        count: messages.length,
        messages: messages.map((m) => ({
          id: m.id,
          from: m.from,
          to: m.to,
          cc: m.cc || undefined,
          subject: m.subject,
          bodyText: m.bodyText.slice(0, 2000),
          date: new Date(Number(m.internalDate)).toISOString(),
        })),
      };
    },
  });

  const getMyEmailStyle = tool({
    description:
      "Fetch the user's 15 most recent sent emails (excluding spam/promotions/social) to learn their writing style. Call this BEFORE drafting any email.",
    inputSchema: z.object({}),
    execute: async () => {
      const err = await checkGmail();
      if (err) {
        return err;
      }

      const messages = await getRecentSentEmails(15);

      return {
        count: messages.length,
        samples: messages.map((m) => ({
          to: m.to,
          subject: m.subject,
          bodyText: m.bodyText.slice(0, 800),
        })),
      };
    },
  });

  const sendLeadEmail = tool({
    description:
      "Send an email via Gmail to a CRM lead. Looks up the lead's email from the database and logs the send as CRM activity.",
    inputSchema: z.object({
      leadId: z.string().describe("The lead ID"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Email body (plain text or simple HTML)"),
      cc: z.string().optional().describe("CC recipients (comma-separated)"),
      bcc: z.string().optional().describe("BCC recipients (comma-separated)"),
      threadId: z.string().optional().describe("Gmail thread ID to reply to"),
      replyToMessageId: z
        .string()
        .optional()
        .describe("Message-ID header to reply to"),
    }),
    execute: async ({
      leadId,
      subject,
      body,
      cc,
      bcc,
      threadId,
      replyToMessageId,
    }) => {
      const err = await checkGmail();
      if (err) {
        return err;
      }

      const row = await db.query.lead.findFirst({
        where: eq(lead.id, leadId),
        columns: { id: true, email: true, name: true },
      });
      if (!row) {
        return { error: "Lead not found" };
      }

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

      return {
        success: true,
        to: row.email,
        subject,
        messageId: result.messageId,
        threadId: result.threadId,
      };
    },
  });

  return {
    searchEmails,
    readMessage,
    readEmailThread: readThread,
    getMyEmailStyle,
    sendLeadEmail,
  };
}

export { createGmailTools };
