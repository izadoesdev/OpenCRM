"use server";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { account } from "@/db/schema";
import { auth } from "@/lib/auth";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

async function getGoogleAccount(userId: string) {
  const row = await db.query.account.findFirst({
    where: and(eq(account.userId, userId), eq(account.providerId, "google")),
  });
  if (!row) {
    throw new Error("No Google account linked");
  }
  return row;
}

async function refreshAccessToken(acct: typeof account.$inferSelect) {
  if (!acct.refreshToken) {
    throw new Error("No refresh token — user must re-authenticate");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: acct.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }

  const data = await res.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  await db
    .update(account)
    .set({
      accessToken: data.access_token,
      accessTokenExpiresAt: expiresAt,
    })
    .where(eq(account.id, acct.id));

  return data.access_token as string;
}

export async function getGoogleToken(): Promise<string> {
  const user = await getSession();
  const acct = await getGoogleAccount(user.id);

  const needsRefresh =
    !(acct.accessToken && acct.accessTokenExpiresAt) ||
    acct.accessTokenExpiresAt.getTime() - Date.now() < REFRESH_BUFFER_MS;

  if (needsRefresh) {
    return refreshAccessToken(acct);
  }

  return acct.accessToken as string;
}

export async function googleFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getGoogleToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google API ${res.status}: ${body}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export async function checkGoogleConnection(): Promise<{
  connected: boolean;
  hasCalendar: boolean;
  hasGmail: boolean;
  email: string | null;
}> {
  try {
    const user = await getSession();
    const acct = await getGoogleAccount(user.id);
    const scopes = acct.scope?.split(" ") ?? [];
    return {
      connected: !!acct.accessToken,
      hasCalendar: scopes.some((s) => s.includes("calendar")),
      hasGmail: scopes.some((s) => s.includes("gmail")),
      email: user.email,
    };
  } catch {
    return {
      connected: false,
      hasCalendar: false,
      hasGmail: false,
      email: null,
    };
  }
}
