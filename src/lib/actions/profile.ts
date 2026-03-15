"use server";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { account, user } from "@/db/schema";
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

export async function getProfile() {
  const sessionUser = await getUser();
  const row = await db.query.user.findFirst({
    where: eq(user.id, sessionUser.id),
  });
  if (!row) {
    throw new Error("User not found");
  }
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image,
    preferences: row.preferences ?? {},
    createdAt: row.createdAt,
  };
}

export async function updateProfile(data: { name?: string; image?: string }) {
  const sessionUser = await getUser();
  const [row] = await db
    .update(user)
    .set(data)
    .where(eq(user.id, sessionUser.id))
    .returning();
  return row;
}

export async function updatePreferences(
  prefs: Partial<{
    digestEnabled: boolean;
    timezone: string;
    dateFormat: string;
  }>
) {
  const sessionUser = await getUser();
  const existing = await db.query.user.findFirst({
    where: eq(user.id, sessionUser.id),
  });
  const merged = { ...(existing?.preferences ?? {}), ...prefs };
  const [row] = await db
    .update(user)
    .set({ preferences: merged })
    .where(eq(user.id, sessionUser.id))
    .returning();
  return row;
}

export async function disconnectGoogle() {
  const sessionUser = await getUser();
  await db
    .delete(account)
    .where(
      and(eq(account.userId, sessionUser.id), eq(account.providerId, "google"))
    );
  return { success: true };
}
