import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/db";
import { lead } from "@/db/schema";
import {
  getEmailThread,
  getLeadEmails,
  getRecentSentEmails,
  sendGmailEmail,
} from "@/lib/actions/gmail";
import { checkGoogleConnection } from "@/lib/google";

function createGmailTools() {
  const searchEmails = tool({
    description:
      "Search email conversations by email address. Works for leads and any other contact. Returns messages sorted by date.",
    inputSchema: z.object({
      email: z.string().describe("Email address to search conversations for"),
      maxResults: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe("Max messages to return (default 20)"),
    }),
    execute: async ({ email, maxResults }) => {
      const conn = await checkGoogleConnection();
      if (!(conn.connected && conn.hasGmail)) {
        return { error: "Gmail not connected. Connect in Settings > Google." };
      }

      const messages = await getLeadEmails(email, maxResults ?? 20);

      return {
        count: messages.length,
        messages: messages.map((m) => ({
          id: m.id,
          threadId: m.threadId,
          from: m.from,
          to: m.to,
          cc: m.cc || undefined,
          subject: m.subject,
          snippet: m.snippet,
          bodyText: m.bodyText.slice(0, 500),
          date: new Date(Number(m.internalDate)).toISOString(),
        })),
      };
    },
  });

  const readThread = tool({
    description:
      "Read a full email thread by thread ID. Returns all messages in the conversation.",
    inputSchema: z.object({
      threadId: z.string().describe("Gmail thread ID"),
    }),
    execute: async ({ threadId }) => {
      const conn = await checkGoogleConnection();
      if (!(conn.connected && conn.hasGmail)) {
        return { error: "Gmail not connected. Connect in Settings > Google." };
      }

      const messages = await getEmailThread(threadId);

      return {
        count: messages.length,
        messages: messages.map((m) => ({
          id: m.id,
          from: m.from,
          to: m.to,
          cc: m.cc || undefined,
          subject: m.subject,
          bodyText: m.bodyText.slice(0, 1000),
          date: new Date(Number(m.internalDate)).toISOString(),
        })),
      };
    },
  });

  const sendLeadEmail = tool({
    description:
      "Send an email via Gmail to a CRM lead. Uses the lead's email from the database and logs the send as CRM activity. Use this when emailing someone who is already a lead.",
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
      const conn = await checkGoogleConnection();
      if (!(conn.connected && conn.hasGmail)) {
        return { error: "Gmail not connected. Connect in Settings > Google." };
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

  const getMyEmailStyle = tool({
    description:
      "Fetch the user's recent sent emails to learn their writing style, tone, greeting, and sign-off patterns. Call this BEFORE drafting any email so you can match their voice.",
    inputSchema: z.object({
      count: z
        .number()
        .int()
        .min(1)
        .max(10)
        .optional()
        .describe("Number of recent sent emails to fetch (default 5)"),
    }),
    execute: async ({ count }) => {
      const conn = await checkGoogleConnection();
      if (!(conn.connected && conn.hasGmail)) {
        return { error: "Gmail not connected. Connect in Settings > Google." };
      }

      const messages = await getRecentSentEmails(count ?? 15);

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

  return {
    searchEmails,
    readEmailThread: readThread,
    getMyEmailStyle,
    sendLeadEmail,
  };
}

export { createGmailTools };
