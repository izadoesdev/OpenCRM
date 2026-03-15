"use server";

import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { webhook } from "@/db/schema";
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

export async function getWebhooks() {
  await getUser();
  return db.query.webhook.findMany({
    orderBy: [desc(webhook.createdAt)],
  });
}

export async function createWebhook(data: { url: string; events: string[] }) {
  const user = await getUser();
  const secret = `whsec_${crypto.randomUUID().replace(/-/g, "")}`;
  const [row] = await db
    .insert(webhook)
    .values({
      url: data.url,
      events: data.events,
      secret,
      createdBy: user.id,
    })
    .returning();
  return row;
}

export async function updateWebhook(
  id: string,
  data: Partial<{
    url: string;
    events: string[];
    active: boolean;
  }>
) {
  await getUser();
  const [row] = await db
    .update(webhook)
    .set(data)
    .where(eq(webhook.id, id))
    .returning();
  return row;
}

export async function deleteWebhook(id: string) {
  await getUser();
  await db.delete(webhook).where(eq(webhook.id, id));
}
