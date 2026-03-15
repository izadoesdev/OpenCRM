import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";

const ENV_ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN ?? "";

if (!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)) {
  throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
}

async function getAllowedDomain(): Promise<string> {
  try {
    const row = await db.query.appSettings.findFirst({
      where: eq(schema.appSettings.id, "default"),
      columns: { allowedDomain: true },
    });
    return row?.allowedDomain || ENV_ALLOWED_DOMAIN;
  } catch {
    return ENV_ALLOWED_DOMAIN;
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      accessType: "offline",
      scope: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
      ],
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const domain = await getAllowedDomain();
          if (domain && !user.email?.endsWith(`@${domain}`)) {
            await Promise.reject(
              new Error(`Only @${domain} email addresses are allowed.`)
            );
          }
          return { data: user };
        },
      },
    },
  },
  plugins: [nextCookies()],
});
