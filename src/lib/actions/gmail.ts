"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { activity } from "@/db/schema";
import { auth } from "@/lib/auth";
import { googleFetch } from "@/lib/google";

const GMAIL_BASE = "https://www.googleapis.com/gmail/v1/users/me";

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

const RE_PLUS = /\+/g;
const RE_SLASH = /\//g;
const RE_PAD = /=+$/;

function base64url(str: string): string {
  return btoa(str)
    .replace(RE_PLUS, "-")
    .replace(RE_SLASH, "_")
    .replace(RE_PAD, "");
}

function buildRawEmail(opts: {
  from: string;
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  replyToMessageId?: string;
  threadId?: string;
}): string {
  const boundary = `boundary_${crypto.randomUUID().replace(/-/g, "")}`;
  const lines: string[] = [];

  lines.push(`From: ${opts.from}`);
  lines.push(`To: ${opts.to}`);
  if (opts.cc) {
    lines.push(`Cc: ${opts.cc}`);
  }
  if (opts.bcc) {
    lines.push(`Bcc: ${opts.bcc}`);
  }
  lines.push(`Subject: ${opts.subject}`);
  lines.push("MIME-Version: 1.0");

  if (opts.replyToMessageId) {
    lines.push(`In-Reply-To: ${opts.replyToMessageId}`);
    lines.push(`References: ${opts.replyToMessageId}`);
  }

  lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
  lines.push("");
  lines.push(`--${boundary}`);
  lines.push("Content-Type: text/plain; charset=UTF-8");
  lines.push("");
  lines.push(opts.body.replace(/<[^>]*>/g, ""));
  lines.push(`--${boundary}`);
  lines.push("Content-Type: text/html; charset=UTF-8");
  lines.push("");
  lines.push(opts.body.replace(/\n/g, "<br />"));
  lines.push(`--${boundary}--`);

  return lines.join("\r\n");
}

export async function sendGmailEmail(data: {
  leadId: string;
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  replyToMessageId?: string;
  threadId?: string;
}): Promise<{ messageId: string; threadId: string }> {
  const user = await getUser();

  const raw = buildRawEmail({
    from: user.email,
    to: data.to,
    subject: data.subject,
    body: data.body,
    cc: data.cc,
    bcc: data.bcc,
    replyToMessageId: data.replyToMessageId,
    threadId: data.threadId,
  });

  const payload: Record<string, string> = { raw: base64url(raw) };
  if (data.threadId) {
    payload.threadId = data.threadId;
  }

  const result = await googleFetch<{ id: string; threadId: string }>(
    `${GMAIL_BASE}/messages/send`,
    { method: "POST", body: JSON.stringify(payload) }
  );

  await db.insert(activity).values({
    leadId: data.leadId,
    userId: user.id,
    type: "email_sent",
    content: `Sent: ${data.subject}`,
    metadata: { gmailMessageId: result.id, gmailThreadId: result.threadId },
  });

  revalidatePath(`/leads/${data.leadId}`);
  return { messageId: result.id, threadId: result.threadId };
}

export interface GmailMessage {
  bcc: string;
  bodyHtml: string;
  bodyText: string;
  cc: string;
  from: string;
  id: string;
  internalDate: string;
  messageId: string;
  snippet: string;
  subject: string;
  threadId: string;
  to: string;
}

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailPart {
  body?: { data?: string; size: number };
  mimeType: string;
  parts?: GmailPart[];
}

interface GmailRawMessage {
  id: string;
  internalDate: string;
  payload: {
    headers: GmailHeader[];
    mimeType: string;
    body?: { data?: string; size: number };
    parts?: GmailPart[];
  };
  snippet: string;
  threadId: string;
}

interface GmailThreadResponse {
  id: string;
  messages: GmailRawMessage[];
}

function getHeader(headers: GmailHeader[], name: string): string {
  return (
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ??
    ""
  );
}

function decodeBase64url(data: string): string {
  try {
    const padded = data.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

function extractBody(payload: GmailRawMessage["payload"]): {
  html: string;
  text: string;
} {
  let html = "";
  let text = "";

  function walk(part: GmailPart) {
    if (part.mimeType === "text/html" && part.body?.data) {
      html = decodeBase64url(part.body.data);
    } else if (part.mimeType === "text/plain" && part.body?.data) {
      text = decodeBase64url(part.body.data);
    }
    if (part.parts) {
      for (const sub of part.parts) {
        walk(sub);
      }
    }
  }

  walk(payload as GmailPart);
  return { html, text };
}

function parseMessage(raw: GmailRawMessage): GmailMessage {
  const { html, text } = extractBody(raw.payload);
  return {
    id: raw.id,
    threadId: raw.threadId,
    messageId: getHeader(raw.payload.headers, "Message-ID"),
    snippet: raw.snippet,
    internalDate: raw.internalDate,
    from: getHeader(raw.payload.headers, "From"),
    to: getHeader(raw.payload.headers, "To"),
    cc: getHeader(raw.payload.headers, "Cc"),
    bcc: getHeader(raw.payload.headers, "Bcc"),
    subject: getHeader(raw.payload.headers, "Subject"),
    bodyHtml: html,
    bodyText: text,
  };
}

export async function getLeadEmails(
  leadEmail: string,
  maxResults = 50
): Promise<GmailMessage[]> {
  await getUser();

  const q = encodeURIComponent(`from:${leadEmail} OR to:${leadEmail}`);
  const list = await googleFetch<{
    messages?: Array<{ id: string; threadId: string }>;
  }>(`${GMAIL_BASE}/messages?q=${q}&maxResults=${maxResults}`);

  if (!list.messages?.length) {
    return [];
  }

  const messages = await Promise.all(
    list.messages.map((m) =>
      googleFetch<GmailRawMessage>(`${GMAIL_BASE}/messages/${m.id}?format=full`)
    )
  );

  return messages.map(parseMessage);
}

export async function getEmailThread(
  threadId: string
): Promise<GmailMessage[]> {
  await getUser();

  const thread = await googleFetch<GmailThreadResponse>(
    `${GMAIL_BASE}/threads/${threadId}?format=full`
  );

  return thread.messages.map(parseMessage);
}

export async function getRecentSentEmails(
  maxResults = 15
): Promise<GmailMessage[]> {
  await getUser();

  const q = encodeURIComponent("in:sent");
  const list = await googleFetch<{
    messages?: Array<{ id: string; threadId: string }>;
  }>(`${GMAIL_BASE}/messages?q=${q}&maxResults=${maxResults}`);

  if (!list.messages?.length) {
    return [];
  }

  const messages = await Promise.all(
    list.messages.map((m) =>
      googleFetch<GmailRawMessage>(`${GMAIL_BASE}/messages/${m.id}?format=full`)
    )
  );

  return messages.map(parseMessage);
}
