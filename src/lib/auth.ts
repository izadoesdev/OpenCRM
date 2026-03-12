import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";

const ALLOWED_DOMAIN = "databuddy.cc";

if (!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)) {
  throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
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
      scope: ["openid", "email", "profile"],
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!user.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
            throw new Error(
              `Only @${ALLOWED_DOMAIN} email addresses are allowed.`
            );
          }
          return { data: user };
        },
      },
    },
  },
  plugins: [nextCookies()],
});
