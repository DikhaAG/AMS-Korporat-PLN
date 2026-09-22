import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined),
  trustedOrigins: [
    "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.BETTER_AUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
  ].filter(Boolean) as string[],
  database: drizzleAdapter(db, {
    provider: "pg", // PostgreSQL
    schema,
  }),
  user: {
    additionalFields: {
      nip: {
        type: "string",
        required: false,
      },
      positionId: {
        type: "string",
        required: false,
      },
      signaturePassphraseHash: {
        type: "string",
        required: false,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
      },
    },
  },
  session: {
    // Custom session fields (active position for PBAC)
    // Actually, session is defined by BetterAuth core. If we want custom session fields, we can use hooks or plugins, but typically Better Auth session extension requires a plugin or custom fields in session table.
    // Let's add them to the session configuration if supported, or rely on custom hook to fetch active position.
  },
  // In a real app, you would enable specific plugins like emailAndPassword, twoFactor, etc.
  emailAndPassword: {
    enabled: true,
  },
});
