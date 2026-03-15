"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
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

async function ensureSettings() {
  const existing = await db.query.appSettings.findFirst({
    where: eq(appSettings.id, "default"),
  });
  if (existing) {
    return existing;
  }
  const [row] = await db
    .insert(appSettings)
    .values({ id: "default" })
    .returning();
  return row;
}

export async function getAppSettings() {
  await getUser();
  return ensureSettings();
}

export async function updateAppSettings(
  data: Partial<{
    currency: string;
    dateFormat: string;
  }>
) {
  await getUser();
  await ensureSettings();
  const [row] = await db
    .update(appSettings)
    .set(data)
    .where(eq(appSettings.id, "default"))
    .returning();
  return row;
}
