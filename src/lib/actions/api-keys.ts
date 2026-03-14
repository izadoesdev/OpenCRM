"use server";

import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { apiKey } from "@/db/schema";
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

function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function createApiKey(name: string) {
  const user = await getUser();

  const raw = `dcrm_${randomBytes(24).toString("hex")}`;
  const prefix = raw.slice(0, 12);
  const keyHash = hashKey(raw);

  const [row] = await db
    .insert(apiKey)
    .values({
      name,
      keyHash,
      prefix,
      createdBy: user.id,
    })
    .returning();

  return { ...row, plainKey: raw };
}

export async function getApiKeys() {
  await getUser();
  return db.query.apiKey.findMany({
    where: isNull(apiKey.revokedAt),
    orderBy: [desc(apiKey.createdAt)],
    with: { creator: { columns: { name: true } } },
  });
}

export async function revokeApiKey(id: string) {
  await getUser();
  await db
    .update(apiKey)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKey.id, id), isNull(apiKey.revokedAt)));
}

export async function deleteApiKey(id: string) {
  await getUser();
  await db.delete(apiKey).where(eq(apiKey.id, id));
}

/**
 * Validates a raw API key and returns the key row if valid.
 * Used by public API routes — not a server action.
 */
export async function validateApiKey(raw: string) {
  const keyHash = hashKey(raw);
  const row = await db.query.apiKey.findFirst({
    where: and(eq(apiKey.keyHash, keyHash), isNull(apiKey.revokedAt)),
  });

  if (!row) {
    return null;
  }

  if (row.expiresAt && row.expiresAt < new Date()) {
    return null;
  }

  await db
    .update(apiKey)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKey.id, row.id));

  return row;
}
